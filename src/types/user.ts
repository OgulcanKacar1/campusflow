export type OrgUser = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
};

export type UserRole = 'super_admin' | 'admin' | 'instructor' | 'student';
