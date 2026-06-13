export type BaseCourse = {
  id: string;
  code: string;
  name: string;
  term: string;
  year: number;
  section: string | null;
  status: string;
};

export type InstructorCourse = BaseCourse & {
  joinCode: string | null;
  studentCount: number;
  teamMode: 'instructor' | 'random' | 'student';
  teamMinSize: number | null;
  teamMaxSize: number | null;
  sprintMode?: 'instructor' | 'team';
};

export type AdminCourse = BaseCourse & {
  instructorName: string;
  studentCount: number;
};

export type StudentCourse = BaseCourse & {
  enrollmentId: string;
  enrollmentStatus: string;
  instructorName: string;
  enrolledAt: string;
  joinCode?: string | null;
};
