// Basic types for the attendance portal

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'teacher' | 'student';
  createdAt: Date;
}

export interface Student extends User {
  role: 'student';
  studentId: string;
  course?: string;
}

export interface Teacher extends User {
  role: 'teacher';
  teacherId: string;
  subjects: string[];
}

export interface Admin extends User {
  role: 'admin';
}

export interface Course {
  id: string;
  name: string;
  code: string;
  teacherId: string;
  students: string[];
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  courseId: string;
  date: Date;
  status: 'present' | 'absent' | 'late';
}
