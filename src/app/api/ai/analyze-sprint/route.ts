import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { sprintId, teamId } = await req.json();

    if (!sprintId || !teamId) {
      return NextResponse.json({ error: 'sprintId and teamId are required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Google Gemini API Key bulunamadı (.env.local kontrol edin)' }, { status: 500 });
    }

    const google = createGoogleGenerativeAI({
      apiKey,
    });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Yetki kontrolü (Sadece eğitmenler)
    const { data: teamAccess, error: accessError } = await supabase
      .from('teams')
      .select('project_name, project_description, course:courses!inner(instructor_id)')
      .eq('id', teamId)
      .single();

    if (accessError || teamAccess.course.instructor_id !== user.id) {
      return NextResponse.json({ error: 'Bu işlem için eğitmen yetkisi gereklidir.' }, { status: 403 });
    }

    // Daha önceden üretilmiş rapor var mı kontrol et
    const { data: existingReport } = await supabase
      .from('ai_sprint_reports')
      .select('report_content')
      .eq('sprint_id', sprintId)
      .maybeSingle();

    if (existingReport && existingReport.report_content) {
      return NextResponse.json({ data: existingReport.report_content });
    }

    // 1. Sprint Görevlerini Çek
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        description,
        status,
        priority,
        attachments
      `)
      .eq('sprint_id', sprintId);

    if (tasksError) throw tasksError;

    // 2. Görev Atamalarını Çek
    const taskIds = tasks.map(t => t.id);
    const { data: assignments } = await supabase
      .from('task_assignments')
      .select('task_id, student_id')
      .in('task_id', taskIds.length > 0 ? taskIds : [null]);

    // 3. Takım Üyelerini Çek
    const { data: members } = await supabase
      .from('team_members')
      .select('student_id, profile:profiles(full_name, email)')
      .eq('team_id', teamId);

    // 4. GitHub Etkinliklerini (Commitler) Çek
    const { data: githubEvents } = await supabase
      .from('task_github_events')
      .select('task_id, event_type, commit_hash, message, author_name, created_at')
      .in('task_id', taskIds.length > 0 ? taskIds : [null]);

    // 5. GitHub Token Çek ve Diff'leri (Değişen Kodları) Fetch Et
    const { data: githubConnection } = await supabase
      .from('github_connections')
      .select('access_token, repo_full_name')
      .eq('team_id', teamId)
      .maybeSingle();

    const accessToken = githubConnection?.access_token;
    const commitDiffs: Record<string, string> = {};

    if (accessToken) {
      const commitsToFetch = new Map<string, string>(); // sha -> repoFullName
      githubEvents?.forEach(e => {
        if (e.event_type === 'commit' && e.commit_hash) {
          const repo = githubConnection.repo_full_name;
          if (repo && repo !== 'baglanildi') {
            commitsToFetch.set(e.commit_hash, repo);
          }
        }
      });

      for (const [sha, repo] of commitsToFetch.entries()) {
        try {
          const res = await fetch(`https://api.github.com/repos/${repo}/commits/${sha}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/vnd.github.v3.diff',
              'User-Agent': 'CampusFlow-App'
            }
          });
          if (res.ok) {
            let diff = await res.text();
            // Yapay zeka token limitini korumak için çok uzun diff'leri kırp
            if (diff.length > 2500) {
              diff = diff.substring(0, 2500) + '\n... [Diff çok uzun olduğu için kırpıldı]';
            }
            commitDiffs[sha] = diff;
          } else {
            console.warn(`GitHub Diff alınamadı: ${sha} (Status: ${res.status})`);
          }
        } catch (err) {
          console.error('Diff fetch error for', sha, err);
        }
      }
    }

    // Verileri AI için formatla
    const studentsData = members?.map(m => {
      const profile = Array.isArray(m.profile) ? m.profile[0] : m.profile;
      return {
        id: m.student_id,
        name: profile?.full_name || profile?.email || 'Bilinmiyor',
      };
    }) || [];

    const formattedTasks = tasks.map(t => {
      const assignees = assignments?.filter(a => a.task_id === t.id).map(a => {
        const s = studentsData.find(s => s.id === a.student_id);
        return s ? s.name : 'Bilinmeyen Öğrenci';
      }) || [];

      const events = githubEvents?.filter(e => e.task_id === t.id).map(e => {
        let diffs = '';
        
        if (e.event_type === 'commit' && e.commit_hash) {
          const patch = commitDiffs[e.commit_hash] ? `Değişen Kodlar (Diff):\n${commitDiffs[e.commit_hash]}` : 'Kod içeriği alınamadı.';
          diffs = `Commit: ${e.message}\nYazar: ${e.author_name}\n${patch}`;
        }

        return {
          type: e.event_type,
          author: e.author_name || 'Bilinmiyor',
          message: e.message || 'Bilinmiyor',
          date: e.created_at,
          code_changes: diffs // Yapay zekanın analiz edeceği ana kanıt
        };
      }) || [];

      return {
        title: t.title,
        status: t.status,
        priority: t.priority,
        assignees,
        attachments: t.attachments || [],
        github_commits: events
      };
    });

    // Sistem Promptunu oluştur
    const systemPrompt = `Sen bir yazılım eğitmeni asistanısın. Görevin, bir yazılım geliştirme takımının (Öğrencilerin) belirli bir sprint boyunca yaptığı çalışmaları analiz ederek, her bir öğrencinin katkısını adil ve detaylı bir şekilde değerlendirmektir.

Takımın üzerinde çalıştığı proje ve hedefleri şunlardır:
Proje Adı: ${teamAccess?.project_name || 'Belirtilmemiş'}
Proje Açıklaması/Amacı: ${teamAccess?.project_description || 'Belirtilmemiş'}

(Lütfen analizini ve takımın ilerlemesini değerlendirirken bu proje hedefini göz önünde bulundur. Eklenen kodların veya tasarımların bu hedefe ne kadar hizmet ettiğini değerlendirmenıze dahil et.)

Aşağıda takım üyeleri ve o sprintteki görevlerin dökümü JSON formatında verilmiştir.
Görevlerin durumları, kimlere atandığı, eklenen Drive/Figma linkleri (attachments) ve atılan GitHub commitlerine bakarak detaylı bir analiz çıkar.

TAKIM ÜYELERİ:
${JSON.stringify(studentsData, null, 2)}

GÖREVLER VE İŞLEMLER:
${JSON.stringify(formattedTasks, null, 2)}

Önemli Kurallar:
1. Öğrencinin katkı yüzdesini (contributionPercentage) hesaplarken, sadece atandığı görev sayısına değil, aynı zamanda attığı commitlerin sayısına/büyüklüğüne ve eklediği dosyalara/linklere (attachments) de dikkat et.
2. Öğrencilerin katkı yüzdelerinin toplamı her zaman %100 olmalıdır.
3. 'feedback' (Geri bildirim) alanı yapıcı olmalı. Örneğin: "Ali çok sayıda commit atmış ancak hiçbir göreve tasarım/döküman linki eklememiş" veya "Ayşe commit atmamış ancak tüm analiz dokümanlarını o yüklemiş".
4. 'recommendations' alanı takımın genel gidişatı için 2-3 cümlelik tavsiyeler içermeli.
5. (ÇOK KRİTİK): GÖREVLER VE İŞLEMLER içindeki 'code_changes' (Git diff/patch) verilerini DİKKATLİCE İNCELE. Öğrencinin değiştirdiği kod gerçekten mantıksal bir özellik (logic, UI, backend vb.) ekliyor mu? Yoksa sadece boşlukları, yorum satırlarını veya önemsiz dosyaları (README ufak harf değişimi vb.) değiştirerek sahte bir aktivite mi yaratmış? Eğer bir öğrenci 'sahte' (fake/önemsiz) commitlerle sistemi kandırmaya çalışıyorsa onun katkı oranını düşür ve 'feedback' kısmında bu zayıf/anlamsız kod katkısını hocaya kesinlikle raporla (Örn: "Commit sayıları yüksek görünse de kod içeriklerinde sadece yorum satırları değiştirilmiş, gerçek bir mantıksal katkı bulunmuyor."). Eğer gerçekten kaliteli ve projeye değer katan zorlu kodlar (diff'ler) yazılmışsa bunu da mutlaka öv.
`;

    // Vercel AI SDK ile garantili JSON üretimi
    const { object } = await generateObject({
      model: google('gemini-flash-latest'),
      schema: z.object({
        summary: z.string().describe('Sprintin genel durumunu anlatan 2-3 cümlelik özet.'),
        overallScore: z.number().min(0).max(100).describe('Takımın genel başarısı (0-100 arası).'),
        studentContributions: z.array(z.object({
          studentId: z.string(),
          fullName: z.string(),
          contributionPercentage: z.number().min(0).max(100),
          completedTasks: z.number(),
          linesOfCode: z.number().describe('Tahmini yazılan kod veya commit ağırlığı skoru'),
          attachmentsAdded: z.number().describe('Eklenen link (Drive/Figma) sayısı'),
          feedback: z.string().describe('Öğrenciye özel, neyi iyi yaptığına ve neyi geliştirmesi gerektiğine dair yapıcı geri bildirim.'),
        })),
        recommendations: z.array(z.string()).describe('Takımın geneline yönelik eyleme geçirilebilir tavsiyeler.')
      }),
      prompt: systemPrompt,
    });

    // Üretilen JSON'ı veritabanına kaydet (Admin Client ile RLS bypass)
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error: insertError } = await adminSupabase
      .from('ai_sprint_reports')
      .insert({
        team_id: teamId,
        sprint_id: sprintId,
        report_content: object as any
      });

    if (insertError) {
      console.error('Report Insert Error:', insertError);
    }

    return NextResponse.json({ data: object });

  } catch (error: any) {
    console.error('AI Analysis Error:', error);
    return NextResponse.json({ error: error?.message || 'AI analizi sırasında beklenmeyen bir hata oluştu.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sprintId = searchParams.get('sprintId');

    if (!sprintId) {
      return NextResponse.json({ error: 'sprintId is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await adminSupabase
      .from('ai_sprint_reports')
      .delete()
      .eq('sprint_id', sprintId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete Report Error:', error);
    return NextResponse.json({ error: 'Rapor silinirken hata oluştu.' }, { status: 500 });
  }
}
