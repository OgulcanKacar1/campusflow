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
};

export type AdminCourse = BaseCourse & {
  instructorName: string;
  studentCount: number;
};

export type StudentCourse = BaseCourse & {
  enrollmentId: string;
  enrollmentStatus: string;
  instructorName: string;
};
