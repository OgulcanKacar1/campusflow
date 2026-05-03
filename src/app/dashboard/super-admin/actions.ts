'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getSuperAdminStats() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('super_admin_stats').select('*');
  
  if (error) {
    console.error('getSuperAdminStats error:', error);
    return [];
  }
  return data;
}

export async function getRegistrationTrend(daysBack = 30) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_registration_trend', { days_back: daysBack });

  if (error) {
    console.error('getRegistrationTrend error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    return [];
  }
  return data;
}

export async function getOrganizationsWithDomains() {
  const supabase = await createClient();
  
  // Önce organizasyonları al
  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: false });

  if (orgsError) {
    console.error('getOrganizations error:', orgsError);
    return [];
  }

  // Sonra domainleri al
  const { data: domains, error: domainsError } = await supabase
    .from('organization_domains')
    .select('*');

  if (domainsError) {
    console.error('getDomains error:', domainsError);
    return orgs;
  }

  // Domainleri organizasyonlara ata
  return orgs.map(org => ({
    ...org,
    domains: domains.filter(d => d.organization_id === org.id)
  }));
}

export async function createOrganization(formData: FormData) {
  const name = formData.get('name') as string;
  const primaryDomain = formData.get('primaryDomain') as string;
  const plan = formData.get('plan') as string;
  const maxStudentsStr = formData.get('maxStudents') as string;
  const maxStudents = maxStudentsStr ? parseInt(maxStudentsStr, 10) : null;
  
  // JSON formatında gönderilen ekstra domainler
  const domainsJson = formData.get('domains') as string;
  let extraDomains: Array<{domain: string, role_hint: string}> = [];
  try {
    if (domainsJson) extraDomains = JSON.parse(domainsJson);
  } catch (e) {
    // parse error
  }

  const supabase = await createClient();

  // 1. Organizasyonu oluştur
  const { data: newOrg, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name,
      domain: primaryDomain,
      plan,
      status: 'active',
      max_students: maxStudents
    })
    .select('id')
    .single();

  if (orgError) {
    return { error: 'Organizasyon oluşturulurken hata: ' + orgError.message };
  }

  // 2. Domainleri ekle
  // Önce birincil domaini öğrenci olarak ekleyelim
  const domainsToInsert = [
    { organization_id: newOrg.id, domain: primaryDomain, role_hint: 'student' }
  ];

  // Sonra diğer domainleri ekleyelim
  extraDomains.forEach(d => {
    if (d.domain && d.domain !== primaryDomain) {
      domainsToInsert.push({
        organization_id: newOrg.id,
        domain: d.domain,
        role_hint: d.role_hint || 'student'
      });
    }
  });

  const { error: domainsError } = await supabase
    .from('organization_domains')
    .insert(domainsToInsert);

  if (domainsError) {
    // Tam temizlik yapılamayabilir ama uyarı döndür
    return { error: 'Organizasyon açıldı ancak domainler eklenirken hata oluştu: ' + domainsError.message };
  }

  revalidatePath('/dashboard/super-admin');
  return { success: true };
}

export async function updateOrganizationStatus(orgId: string, status: 'active' | 'suspended') {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('organizations')
    .update({ status })
    .eq('id', orgId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/super-admin');
  return { success: true };
}

export async function updateOrganizationDetails(orgId: string, formData: FormData) {
  const name = formData.get('name') as string;
  const plan = formData.get('plan') as string;
  const maxStudentsStr = formData.get('maxStudents') as string;
  const maxStudents = maxStudentsStr ? parseInt(maxStudentsStr, 10) : null;

  const supabase = await createClient();

  const { error } = await supabase
    .from('organizations')
    .update({ name, plan, max_students: maxStudents })
    .eq('id', orgId);

  if (error) {
    return { error: error.message };
  }
  
  revalidatePath('/dashboard/super-admin/organizations');
  revalidatePath('/dashboard/super-admin');
  return { success: true };
}
