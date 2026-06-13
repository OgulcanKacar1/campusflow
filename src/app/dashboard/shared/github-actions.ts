'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function checkGithubConnection(teamId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { connected: false };
    }

    const { data, error } = await supabase
      .from('github_connections')
      .select('id, repo_full_name')
      .eq('team_id', teamId)
      .maybeSingle();

    if (error || !data) {
      return { connected: false };
    }

    return { connected: true, repoFullName: data.repo_full_name };
  } catch (error) {
    console.error('checkGithubConnection error:', error);
    return { connected: false };
  }
}

export async function disconnectGithub(teamId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Oturum açmanız gerekiyor.' };
    }

    const { error } = await supabase
      .from('github_connections')
      .delete()
      .eq('team_id', teamId);

    if (error) {
      console.error('disconnectGithub DB error:', error);
      return { error: 'Bağlantı kesilirken veritabanı hatası oluştu.' };
    }

    revalidatePath(`/dashboard`);
    return { success: true };
  } catch (error) {
    console.error('disconnectGithub error:', error);
    return { error: 'Bağlantı kesilirken beklenmeyen bir hata oluştu.' };
  }
}
