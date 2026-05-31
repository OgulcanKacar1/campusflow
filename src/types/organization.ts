export type OrganizationStatus = 'active' | 'suspended' | 'trial';

export type OrganizationDomain = {
  domain: string;
  role_hint: string;
};

export type Organization = {
  id: string;
  name: string;
  domain: string;
  status: OrganizationStatus;
  plan: string;
  max_students: number | null;
  domains: OrganizationDomain[];
};
