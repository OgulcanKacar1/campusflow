'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Servis yetkili client (RLS bypass ile notification eklemek için)
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  content: string;
  is_read: boolean;
  type: string;
  entity_type: string | null;
  entity_id: string | null;
  link: string | null;
  created_at: string;
}

/**
 * Mevcut kullanıcının bildirimlerini getirir. Okunmamışlar ve en yeniler en üstte olacak şekilde.
 */
export async function getUserNotifications(): Promise<{ data?: Notification[], error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Oturum açılmamış.' };

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('is_read', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return { data: data as Notification[] };
  } catch (error: any) {
    console.error('getUserNotifications hatası:', error);
    return { error: error.message };
  }
}

/**
 * Belirli bir bildirimi okundu olarak işaretler
 */
export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean, error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Oturum açılmamış.' };

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id); // RLS ile korunsa da ekstra güvenlik

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Kullanıcının tüm bildirimlerini okundu olarak işaretler
 */
export async function markAllNotificationsAsRead(): Promise<{ success: boolean, error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Oturum açılmamış.' };

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Sistem tarafından bildirim oluşturmak için Helper Fonksiyon.
 * Backend action'ları içerisinden (Supabase Admin role ile) çağrılır.
 */
export async function createNotification(data: {
  userId: string;
  title: string;
  content: string;
  type: 'task_assigned' | 'task_status' | 'meeting_invite' | 'github_commit' | 'system';
  entityType?: 'task' | 'meeting' | 'github';
  entityId?: string;
  link?: string;
}): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: data.userId,
        title: data.title,
        content: data.content,
        type: data.type,
        entity_type: data.entityType || null,
        entity_id: data.entityId || null,
        link: data.link || null,
        is_read: false
      });

    if (error) {
      console.error('Bildirim oluşturma hatası:', error);
    }
  } catch (error) {
    console.error('createNotification catch hatası:', error);
  }
}
