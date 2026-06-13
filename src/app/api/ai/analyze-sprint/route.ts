import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';

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
      .select('course:courses!inner(instructor_id)')
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
      .select('task_id, event_type, payload, created_at')
      .in('task_id', taskIds.length > 0 ? taskIds : [null]);

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

      const events = githubEvents?.filter(e => e.task_id === t.id).map(e => ({
        type: e.event_type,
        author: (e.payload as any)?.author_name || 'Bilinmiyor',
        message: (e.payload as any)?.commit_message || 'Bilinmiyor',
        date: e.created_at
      })) || [];

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

    // Üretilen JSON'ı veritabanına kaydet
    const { error: insertError } = await supabase
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
