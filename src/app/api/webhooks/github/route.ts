import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper: Metin içinden T-1, t-42 gibi ID'leri çıkarır
function extractTaskIds(text: string): string[] {
  if (!text) return [];
  const regex = /\b(T-\d+)\b/gi;
  const matches = text.match(regex) || [];
  return [...new Set(matches.map(m => m.toUpperCase()))];
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return new NextResponse('Missing teamId in webhook URL', { status: 400 });
    }

    const eventType = request.headers.get('x-github-event');
    const payload = await request.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // 1. Push Event (Sadece commit loglanır, statü değişmez)
    if (eventType === 'push') {
      const commits = payload.commits || [];
      for (const commit of commits) {
        const shortIds = extractTaskIds(commit.message);
        
        for (const shortId of shortIds) {
          // Görevi bul
          const { data: task } = await supabaseAdmin
            .from('tasks')
            .select('id')
            .eq('team_id', teamId)
            .eq('short_id', shortId)
            .maybeSingle();

          if (task) {
            // Veritabanına logla
            await supabaseAdmin.from('task_github_events').insert({
              task_id: task.id,
              event_type: 'commit',
              commit_hash: commit.id,
              message: commit.message,
              author_name: commit.author?.name || 'Unknown',
              author_username: commit.author?.username || commit.author?.name,
              url: commit.url
            });
          }
        }
      }
    } 
    // 2. Pull Request Event (Açılınca Review, Merge olunca Done)
    else if (eventType === 'pull_request') {
      const action = payload.action;
      const pr = payload.pull_request;
      
      // PR Başlığı ve Açıklamasındaki ID'leri bul (Örn: "Fix T-5: header issue")
      const textToSearch = `${pr.title} ${pr.body || ''}`;
      const shortIds = extractTaskIds(textToSearch);

      for (const shortId of shortIds) {
        const { data: task } = await supabaseAdmin
          .from('tasks')
          .select('id, status')
          .eq('team_id', teamId)
          .eq('short_id', shortId)
          .maybeSingle();

        if (task) {
          // PR eventini logla
          const { error: insertError } = await supabaseAdmin.from('task_github_events').insert({
            task_id: task.id,
            event_type: 'pull_request',
            message: `PR ${action}: ${pr.title}`,
            author_username: pr.user.login,
            url: pr.html_url
          });
          if (insertError) console.error("Event Insert Error:", insertError);

          // Otomasyon: Statüyü güncelle
          let newStatus = null;
          if (action === 'opened' || action === 'reopened') {
            if (task.status !== 'review' && task.status !== 'done') {
              newStatus = 'review';
            }
          } else if (action === 'closed' && pr.merged) {
            if (task.status !== 'done') {
              newStatus = 'done';
            }
          }

          if (newStatus) {
            const { error: updateError } = await supabaseAdmin.from('tasks').update({ status: newStatus }).eq('id', task.id);
            if (updateError) console.error("Task Update Error:", updateError);
          }
        }
      }
    }

    return new NextResponse('Webhook processed successfully', { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
