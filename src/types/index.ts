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
  id?: string;
  name: string;
  code: string;
  teacherId: string;
  teacherName?: string; // Denormalized for easy display
  studentIds: string[]; // Array of enrolled student IDs
  schedule?: string; // e.g., "Mon/Wed/Fri 9:00 AM"
  department?: string;
  semester?: string; // e.g., "Fall 2025"
  credits?: number;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AttendanceRecord {
  id?: string;
  studentId: string;
  courseId: string;
  date: string; // ISO date string for Firestore compatibility
  status: 'present' | 'absent' | 'late';
  markedBy?: string; // Teacher ID who marked attendance
  notes?: string;
  createdAt?: string;
}
