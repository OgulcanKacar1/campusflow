// src/types/team.ts
// Takım yönetimi için temel tipler

export type TeamMode = 'instructor' | 'random' | 'student';
export type SprintMode = 'instructor' | 'team';

export interface TeamSettings {
  teamMode: TeamMode;
  teamMinSize: number;
  teamMaxSize: number;
  sprintMode: SprintMode;
}

export interface Team {
  id: string;
  courseId: string;
  name: string;
  repoUrl?: string | null;
  inviteCode?: string | null;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  // Join'lerle gelen alanlar
  memberCount?: number;
  members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  teamId: string;
  studentId: string;
  role: 'member' | 'leader' | 'owner';
  joinedAt: string;
  leftAt?: string | null;
  // Join'lerle gelen alanlar
  studentName?: string;
  studentEmail?: string;
}

export interface CreateTeamInput {
  courseId: string;
  name: string;
  repoUrl?: string;
}

export interface UpdateTeamInput {
  name?: string;
  repoUrl?: string;
  status?: 'active' | 'inactive';
}

export interface AddMemberInput {
  teamId: string;
  studentId: string;
}

export interface RemoveMemberInput {
  teamId: string;
  studentId: string;
}

export interface CreateRandomTeamsInput {
  courseId: string;
  teamSize: number;
  teamPrefix?: string;
}

export interface JoinTeamByCodeInput {
  inviteCode: string;
}
