import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';

export async function POST(request: Request) {
  try {
    const { teamId } = await request.json();
    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: teamCheck } = await supabase
      .from('teams')
      .select('course:courses!inner(instructor_id)')
      .eq('id', teamId)
      .single();
      
    if (!teamCheck || teamCheck.course?.instructor_id !== user.id) {
       return NextResponse.json({ error: 'Sadece takımın eğitmeni bu raporu oluşturabilir' }, { status: 403 });
    }

    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select(`
        id, name, project_name, project_description, repo_url,
        members:team_members (
          left_at,
          student_id,
          profile:profiles ( id, full_name, role )
        )
      `)
      .eq('id', teamId)
      .single();

    if (teamError || !teamData) {
      return NextResponse.json({ error: 'Takım bulunamadı' }, { status: 404 });
    }

    if (teamData.members) {
      teamData.members = teamData.members.filter((m: any) => m.left_at === null);
    }

    const { data: sprints } = await supabase
      .from('sprints')
      .select(`
        id, name, start_date, end_date, status, goal,
        reports:ai_sprint_reports ( report_content, created_at )
      `)
      .eq('team_id', teamId)
      .order('start_date', { ascending: true });

    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, description, status, sprint_id, created_at, updated_at, points')
      .eq('team_id', teamId);

    const taskIds = tasks?.map(t => t.id) || [];

    const { data: assignments } = await supabase
      .from('task_members')
      .select('task_id, student_id')
      .in('task_id', taskIds.length > 0 ? taskIds : [null]);

    const { data: githubEvents } = await supabase
      .from('task_github_events')
      .select('*')
      .in('task_id', taskIds.length > 0 ? taskIds : [null]);

    const teamMembersText = teamData.members
      ?.map((m: any) => `- ${m.profile?.full_name} (ID: ${m.profile?.id})`)
      .join('\n') || 'Üye bulunamadı';

    const sprintsText = sprints?.map(s => {
      const sprintTasks = tasks?.filter(t => t.sprint_id === s.id) || [];
      const completedTasks = sprintTasks.filter(t => t.status === 'done').length;
      const report = s.reports && s.reports.length > 0 ? JSON.stringify(s.reports[0].report_content) : 'Rapor yok';
      return `Sprint: ${s.name} (${s.status})
      - Hedef: ${s.goal || 'Belirtilmedi'}
      - Görevler: Toplam ${sprintTasks.length}, Tamamlanan ${completedTasks}
      - Geçmiş AI Analizi: ${report}`;
    }).join('\n\n') || 'Sprint verisi yok';

    const tasksText = tasks?.map(t => {
      const taskAssignments = assignments?.filter(a => a.task_id === t.id) || [];
      const assigneeNames = taskAssignments.map(a => {
        const member = teamData.members?.find((m: any) => m.student_id === a.student_id);
        return member?.profile?.full_name || 'Bilinmiyor';
      });
      const assigneeName = assigneeNames.length > 0 ? assigneeNames.join(', ') : 'Atanmamış';
      return `- [${t.status.toUpperCase()}] ${t.title} (${t.points || 0} puan) -> ${assigneeName}`;
    }).join('\n') || 'Görev verisi yok';

    const promptText = `
Sen kıdemli bir Yazılım Mühendisliği Profesörüsün. Bir takımın TÜM DÖNEM BOYUNCA gösterdiği performansı analiz edip final notlarını vereceksin.
Öğrenciler bu raporu GÖREMEYECEK. Sadece eğitmen görecek, bu yüzden öğrencilerin hatalarını açıkça ve dürüstçe belirtebilirsin.

Takım Bilgileri:
- Takım Adı: ${teamData.name}
- Proje: ${teamData.project_name || 'Belirtilmedi'}
- Açıklama: ${teamData.project_description || 'Belirtilmedi'}

Üyeler:
${teamMembersText}

Dönem İçi Sprintler ve Geçmiş Yapay Zeka Raporları:
${sprintsText}

Dönem Boyunca Yapılan Tüm Görevler:
${tasksText}

Lütfen bu verileri sentezleyerek dönemi değerlendir ve her öğrenci için 0-100 arası hakkaniyetli bir not belirle (Önceki sprintlerdeki bireysel katkıları, tamamlanan görevleri dikkate al).

AŞAĞIDAKİ JSON FORMATINDA YANIT VER (başka hiçbir metin ekleme, doğrudan JSON):
{
  "overallScore": 85,
  "executiveSummary": "Takım genel olarak projeyi başarıyla yürüttü...",
  "technicalEvaluation": "Mimaride şu teknolojiler kullanıldı, şu sorunlar yaşandı...",
  "strengths": ["Güçlü iletişim", "İyi kodlama"],
  "weaknesses": ["Zaman yönetimi", "Test eksikliği"],
  "studentPerformances": [
    {
      "studentId": "id-buraya",
      "name": "Öğrenci Adı",
      "score": 90,
      "feedback": "Projede en çok görev alan kişi. Görevleri zamanında tamamladı ve genel performansı çok iyi."
    }
  ]
}
`;

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Google Gemini API Key bulunamadı' }, { status: 500 });
    }
    const google = createGoogleGenerativeAI({ apiKey });

    // Gemini API'yi çağır
    const { object: reportContent } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: z.object({
        overallScore: z.number(),
        executiveSummary: z.string(),
        technicalEvaluation: z.string(),
        strengths: z.array(z.string()),
        weaknesses: z.array(z.string()),
        studentPerformances: z.array(z.object({
          studentId: z.string(),
          name: z.string(),
          score: z.number(),
          feedback: z.string()
        }))
      }),
      prompt: promptText
    });

    // Raporu veritabanına kaydet (Varsa güncelle, yoksa ekle)
    const { error: upsertError } = await supabase
      .from('ai_final_reports')
      .upsert({
        team_id: teamId,
        report_content: reportContent,
        updated_at: new Date().toISOString()
      }, { onConflict: 'team_id' });

    if (upsertError) {
      console.error('Rapor kaydedilirken hata:', upsertError);
      return NextResponse.json({ error: 'Rapor oluşturuldu ancak veritabanına kaydedilemedi.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, report: reportContent });

  } catch (error: any) {
    console.error('Dönem Sonu AI Raporu Hatası:', error);
    
    // Check if it's a rate limit error from Gemini
    if (error.statusCode === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
      return NextResponse.json({ 
        error: 'Google Gemini ücretsiz kota sınırına ulaşıldı (Çok fazla veri gönderildi). Lütfen 30 saniye bekleyip tekrar deneyin.' 
      }, { status: 429 });
    }

    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
