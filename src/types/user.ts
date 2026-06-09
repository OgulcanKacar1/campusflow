export type OrgUser = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  created_at: string;
};

export type UserRole = 'super_admin' | 'admin' | 'instructor' | 'student';
