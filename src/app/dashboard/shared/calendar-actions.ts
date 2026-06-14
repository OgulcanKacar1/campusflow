'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { CalendarEvent, KanbanActionResult, Meeting, KANBAN_STATUS_LABELS, KANBAN_PRIORITY_LABELS, TaskStatus, TaskPriority } from '@/types/kanban';
import { createNotification } from './notification-actions';
import { sendEmail } from '@/lib/mail';

export async function createMeeting(
  data: {
    course_id: string;
    team_id: string | null;
    sprint_id: string | null;
    title: string;
    description?: string;
    meeting_link?: string;
    start_time: string;
    end_time: string;
  },
  revalidatePaths?: string[]
): Promise<KanbanActionResult<Meeting>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { code: 'NOT_AUTHENTICATED', error: 'Oturum açmanız gerekiyor.' };
    }

    // Admin yetkisiyle (RLS'yi atlayarak) işlem yapmak için Service Role Key kullanıyoruz.
    // Kullanıcının RLS kuralları çakıştığı için direkt veritabanına admin olarak yazıyoruz.
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: newMeeting, error } = await supabaseAdmin
      .from('meetings')
      .insert({
        course_id: data.course_id,
        team_id: data.team_id,
        sprint_id: data.sprint_id,
        title: data.title,
        description: data.description || null,
        meeting_link: data.meeting_link || null,
        start_time: data.start_time,
        end_time: data.end_time,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Create meeting error:', error);
      return { code: 'SUPABASE_ERROR', error: `Supabase Hatası: ${error.message}` };
    }

    if (revalidatePaths) {
      revalidatePaths.forEach((p) => revalidatePath(p));
    }

    // Toplantı oluşturulduktan sonra üyelere bildirim ve e-posta gönder
    const { data: courseData } = await supabaseAdmin.from('courses').select('code, name').eq('id', data.course_id).single();
    const courseCode = courseData?.code || 'Bilinmeyen Ders';
    
    let targetMembers: any[] = [];
    let contextTitle = `[${courseCode}]`;

    if (data.team_id) {
      const { data: teamData } = await supabaseAdmin.from('teams').select('name').eq('id', data.team_id).single();
      contextTitle = `[${courseCode} - ${teamData?.name || 'Takım'}]`;
      
      const { data: teamMembers } = await supabaseAdmin
        .from('team_members')
        .select('student_id, profiles(email, full_name)')
        .eq('team_id', data.team_id)
        .is('left_at', null);
      targetMembers = teamMembers || [];
    } else {
      contextTitle = `[${courseCode} - Tüm Sınıf]`;
      const { data: courseTeams } = await supabaseAdmin.from('teams').select('id').eq('course_id', data.course_id);
      const teamIds = courseTeams?.map(t => t.id) || [];
      
      if (teamIds.length > 0) {
        const { data: allMembers } = await supabaseAdmin
          .from('team_members')
          .select('student_id, profiles(email, full_name)')
          .in('team_id', teamIds)
          .is('left_at', null);
          
        // Aynı öğrenci birden fazla takımdaysa (veya hata varsa) duplicate mail gitmesin
        const uniqueMap = new Map();
        (allMembers || []).forEach(m => uniqueMap.set(m.student_id, m));
        targetMembers = Array.from(uniqueMap.values());
      }
    }
        
    if (targetMembers.length > 0) {
      const notifyPromises = targetMembers.map(async (tm) => {
        if (tm.student_id === user.id) return; // Kendine gönderme
        
        await createNotification({
          userId: tm.student_id,
          title: 'Yeni Toplantı Planlandı',
          content: `${contextTitle} '${data.title}' adlı toplantı takvimine eklendi.`,
          type: 'meeting_invite',
          entityType: 'meeting',
          entityId: newMeeting.id,
        });

        const profile = tm.profiles as any;
        if (profile && profile.email) {
          await sendEmail({
            to: profile.email,
            subject: `CampusFlow - Yeni Toplantı Daveti: ${contextTitle} ${data.title}`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #4f46e5;">Yeni Toplantı Daveti</h2>
                <p>Merhaba <b>${profile.full_name || 'Öğrenci'}</b>,</p>
                <p><b>${contextTitle}</b> için yeni bir toplantı planlandı.</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                  <p><b>Başlık:</b> ${data.title}</p>
                  <p><b>Açıklama:</b> ${data.description || 'Belirtilmedi'}</p>
                  <p><b>Zaman:</b> ${new Date(data.start_time).toLocaleString('tr-TR')} - ${new Date(data.end_time).toLocaleTimeString('tr-TR')}</p>
                  ${data.meeting_link ? `<p><b>Bağlantı Linki:</b> <a href="${data.meeting_link}" style="color: #4f46e5;">Toplantıya Katıl</a></p>` : ''}
                </div>
                <p>Detayları incelemek için <a href="https://campusflow.app">CampusFlow</a> panona giriş yapabilirsin.</p>
              </div>
            `
          });
        }
      });
      await Promise.all(notifyPromises);
    }

    return { data: newMeeting as Meeting };
  } catch (error: any) {
    console.error('Create meeting exception:', error);
    return { code: 'UNKNOWN_ERROR', error: error.message || 'Beklenmeyen bir hata oluştu.' };
  }
}

export async function updateMeetingDetails(
  meetingId: string,
  data: {
    title: string;
    description: string;
    meeting_link: string;
    start_time: string;
    end_time: string;
  },
  revalidatePaths?: string[]
): Promise<KanbanActionResult<boolean>> {
  try {
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabaseAdmin
      .from('meetings')
      .update({
        title: data.title,
        description: data.description || null,
        meeting_link: data.meeting_link || null,
        start_time: data.start_time,
        end_time: data.end_time,
      })
      .eq('id', meetingId);

    if (error) {
      console.error('Update meeting error:', error);
      return { code: 'SUPABASE_ERROR', error: `Supabase Hatası: ${error.message}` };
    }

    if (revalidatePaths) {
      revalidatePaths.forEach((p) => revalidatePath(p));
    }

    return { data: true };
  } catch (error: any) {
    console.error('Update meeting exception:', error);
    return { code: 'UNKNOWN_ERROR', error: error.message || 'Beklenmeyen bir hata oluştu.' };
  }
}


export async function deleteMeeting(
  meetingId: string,
  revalidatePaths?: string[]
): Promise<KanbanActionResult<boolean>> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from('meetings').delete().eq('id', meetingId);

    if (error) {
      console.error('Delete meeting error:', error);
      return { code: 'SUPABASE_ERROR', error: 'Toplantı silinirken bir hata oluştu.' };
    }

    if (revalidatePaths) {
      revalidatePaths.forEach((p) => revalidatePath(p));
    }

    return { data: true };
  } catch (error: any) {
    console.error('Delete meeting exception:', error);
    return { code: 'UNKNOWN_ERROR', error: error.message || 'Beklenmeyen bir hata oluştu.' };
  }
}

export async function getGlobalCalendarEvents(
  courseIds: string[],
  teamIds: string[],
  includeTasks: boolean = true
): Promise<KanbanActionResult<CalendarEvent[]>> {
  try {
    const supabase = await createClient();

    // 1. Toplantıları Çek
    let meetings: any[] = [];
    if (courseIds.length > 0) {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .in('course_id', courseIds);
      
      if (error) {
        console.error('Fetch meetings error:', error);
        return { code: 'SUPABASE_ERROR', error: `Toplantılar yüklenemedi: ${error.message || JSON.stringify(error)}` };
      }
      
      // Filtreleme: Kullanıcının takımları (teamIds) veya null olanlar
      meetings = data?.filter(m => m.team_id === null || teamIds.includes(m.team_id)) || [];
    }

    // 2. Sprintleri Çek
    let sprints: any[] = [];
    if (teamIds.length > 0) {
      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .in('team_id', teamIds);

      if (error) {
        console.error('Fetch sprints error:', error);
        return { code: 'SUPABASE_ERROR', error: `Sprintler yüklenemedi: ${error.message || JSON.stringify(error)}` };
      }
      sprints = data || [];
    }

    // 3. Görevleri (Tasks) Çek (Sadece includeTasks true ise)
    let tasks: any[] = [];
    if (includeTasks && teamIds.length > 0) {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, task_members(student_id)')
        .in('team_id', teamIds);

      if (error) {
        console.error('Fetch tasks error:', error);
        // Hata olsa da akışı bozmayalım, loglamak yeterli
      } else {
        tasks = data || [];
      }
    }

    // 4. Verileri CalendarEvent tipinde birleştir
    const events: CalendarEvent[] = [];

    // Meetings ekle
    meetings.forEach((m) => {
      events.push({
        id: m.id,
        title: m.title,
        start: new Date(m.start_time),
        end: new Date(m.end_time),
        type: 'meeting',
        description: m.description || undefined,
        link: m.meeting_link || undefined,
        isCourseWide: m.team_id === null,
        originalData: m,
      });
    });

    // Sprint durumlarını Türkçeleştirme
    const sprintStatusMap: Record<string, string> = {
      planning: 'Planlanıyor',
      active: 'Aktif',
      completed: 'Tamamlandı',
      archived: 'Arşivlendi'
    };

    // Sprintleri ekle
    sprints.forEach((s) => {
      events.push({
        id: s.id,
        title: `Sprint: ${s.name}`,
        start: new Date(s.start_at),
        end: new Date(s.end_at),
        type: 'sprint',
        description: `Durum: ${sprintStatusMap[s.status] || s.status}`,
        originalData: s,
      });
    });

    // Görevleri ekle
    tasks.forEach((t) => {
      const statusTR = KANBAN_STATUS_LABELS[t.status as TaskStatus] || t.status;
      const priorityTR = KANBAN_PRIORITY_LABELS[t.priority as TaskPriority] || t.priority;
      
      events.push({
        id: t.id,
        title: `Görev: ${t.title}`,
        start: new Date(t.created_at),
        end: new Date(t.created_at),
        type: 'task',
        description: `Durum: ${statusTR} | Öncelik: ${priorityTR}`,
        originalData: t,
      });
    });

    return { data: events };
  } catch (error: any) {
    console.error('Fetch global calendar events exception:', error);
    return { code: 'UNKNOWN_ERROR', error: error.message || 'Beklenmeyen bir hata oluştu.' };
  }
}

export async function updateMeetingNotes(
  meetingId: string,
  notes: string,
  revalidatePaths?: string[]
): Promise<KanbanActionResult<boolean>> {
  try {
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabaseAdmin
      .from('meetings')
      .update({ meeting_notes: notes })
      .eq('id', meetingId);

    if (error) {
      console.error('Update meeting notes error:', error);
      return { code: 'SUPABASE_ERROR', error: 'Notlar güncellenirken bir hata oluştu.' };
    }

    if (revalidatePaths) {
      revalidatePaths.forEach((p) => revalidatePath(p));
    }

    return { data: true };
  } catch (error: any) {
    console.error('Update meeting notes exception:', error);
    return { code: 'UNKNOWN_ERROR', error: error.message || 'Beklenmeyen bir hata oluştu.' };
  }
}
