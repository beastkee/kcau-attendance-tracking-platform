// Import database connection
import { db } from './firebase';

// Import User type
import { User } from '../types/firebase';

// Import Firestore functions
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  getDocs,
  query,
  where 
} from 'firebase/firestore';

// Import Auth functions
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  updateProfile,
  deleteUser as deleteAuthUser
} from 'firebase/auth';

// Import auth from firebase config
import { auth } from './firebase';

// Login function
export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('User logged in:', userCredential.user.email);
    return userCredential.user;
  } catch (error) {
    console.error('Error logging in:', error);
    throw new Error('Failed to login');
  }
};

// Create a new user in Firestore
export const createUser = async (userData: User): Promise<string> => {
  try {
    // Add document to 'users' collection
    const docRef = await addDoc(collection(db, 'users'), userData);
    console.log('User created with ID:', docRef.id);
    return docRef.id; // Return the auto-generated document ID
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error('Failed to create user');
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    console.log('User logged out successfully');
  } catch (error) {
    console.error('Error logging out:', error);
    throw new Error('Failed to logout');
  }
};

// Register new user with email verification
export const registerUser = async (
  email: string, 
  password: string, 
  userData: Omit<User, 'isEmailVerified'>
): Promise<string> => {
  let firebaseUser: import('firebase/auth').User | null = null;
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    firebaseUser = userCredential.user;

    // Update display name
    await updateProfile(firebaseUser, {
      displayName: userData.name
    });

    // Send email verification
    await sendEmailVerification(firebaseUser);

    // Create user document in Firestore with the Firebase UID
    const userDocData = {
      ...userData,
      isEmailVerified: false
    };
    await createUser(userDocData);

    console.log('User registered successfully:', email);
    return firebaseUser.uid;
  } catch (error: any) {
    // If Firestore user creation fails after Auth user is created, delete the Auth user
    if (firebaseUser && !firebaseUser.emailVerified) {
      try {
        await deleteAuthUser(firebaseUser);
        console.warn('Auth user deleted due to Firestore registration failure');
      } catch (delErr) {
        console.error('Failed to delete orphaned Auth user:', delErr);
      }
    }
    console.error('Error registering user:', error);
    // Handle specific Firebase errors
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('This email is already registered');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password should be at least 6 characters');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address');
    }
    throw new Error('Failed to register user');
  }
};

// Check if email is verified
export const checkEmailVerification = async (): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) return false;
    
    await user.reload(); // Refresh user data
    return user.emailVerified;
  } catch (error) {
    console.error('Error checking email verification:', error);
    return false;
  }
};

// Resend email verification
export const resendEmailVerification = async (): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');
    
    await sendEmailVerification(user);
    console.log('Verification email sent');
  } catch (error) {
    console.error('Error resending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

// TODO: You'll write the next functions here
// - getUserById
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    // Step 1: Get reference to the document
    const docRef = doc(db, 'users', userId);
    
    // Step 2: Get the document
    const docSnap = await getDoc(docRef);
    
    // Step 3: Check if it exists and return data
    if (docSnap.exists()) {
      return docSnap.data() as User;
    } else {
      return null; // User not found
    }
  } catch (error) {
    console.error('Error getting user:', error);
    throw new Error('Failed to get user');
  }
};

// - updateUser
export const updateUser = async (userId: string, userData: Partial<User>): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, userData);
    console.log('User updated with ID:', userId);
  } catch (error) {
    console.error('Error updating user:', error);
    throw new Error('Failed to update user');
  }
};

// - deleteUser
// - getAllUsers
// Delete user
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId);
    await deleteDoc(docRef);
    console.log('User deleted with ID:', userId);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error('Failed to delete user');
  }
};

// Get all users with optional role filter
export const getAllUsers = async (roleFilter?: string): Promise<User[]> => {
  try {
    const usersRef = collection(db, 'users');
    let q;
    
    if (roleFilter) {
      q = query(usersRef, where('role', '==', roleFilter));
    } else {
      q = query(usersRef);
    }
    
    const querySnapshot = await getDocs(q);
    const users: User[] = [];
    
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() } as User);
    });
    
    return users;
  } catch (error) {
    console.error('Error getting users:', error);
    throw new Error('Failed to get users');
  }
};

// Get users by role (students or teachers)
export const getUsersByRole = async (role: 'student' | 'teacher' | 'admin'): Promise<User[]> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', role));
    
    const querySnapshot = await getDocs(q);
    const users: User[] = [];
    
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() } as User);
    });
    
    console.log(`Found ${users.length} ${role}s`);
    return users;
  } catch (error) {
    console.error(`Error getting ${role}s:`, error);
    throw new Error(`Failed to get ${role}s`);
  }
};

// Get students count
export const getStudentsCount = async (): Promise<number> => {
  try {
    const students = await getUsersByRole('student');
    return students.length;
  } catch (error) {
    console.error('Error getting students count:', error);
    return 0;
  }
};

// Get teachers count
export const getTeachersCount = async (): Promise<number> => {
  try {
    const teachers = await getUsersByRole('teacher');
    return teachers.length;
  } catch (error) {
    console.error('Error getting teachers count:', error);
    return 0;
  }
};

// Get user by email
export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as User;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw new Error('Failed to get user by email');
  }
};

// Update user account status
export const updateUserStatus = async (userId: string, status: 'active' | 'inactive' | 'suspended'): Promise<void> => {
  try {
    await updateUser(userId, { accountStatus: status });
    console.log(`User ${userId} status updated to ${status}`);
  } catch (error) {
    console.error('Error updating user status:', error);
    throw new Error('Failed to update user status');
  }
};

// ============================================
// CLASS/COURSE MANAGEMENT FUNCTIONS
// ============================================

import { Course } from '../types';

// Create a new class/course
export const createCourse = async (courseData: Omit<Course, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'courses'), {
      ...courseData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log('Course created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating course:', error);
    throw new Error('Failed to create course');
  }
};

// Get a course by ID
export const getCourseById = async (courseId: string): Promise<Course | null> => {
  try {
    const docRef = doc(db, 'courses', courseId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Course;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting course:', error);
    throw new Error('Failed to get course');
  }
};

// Get all courses
export const getAllCourses = async (): Promise<Course[]> => {
  try {
    const coursesRef = collection(db, 'courses');
    const querySnapshot = await getDocs(coursesRef);
    const courses: Course[] = [];
    
    querySnapshot.forEach((doc) => {
      courses.push({ id: doc.id, ...doc.data() } as Course);
    });
    
    console.log(`Found ${courses.length} courses`);
    return courses;
  } catch (error) {
    console.error('Error getting courses:', error);
    throw new Error('Failed to get courses');
  }
};

// Get courses by teacher ID
export const getCoursesByTeacher = async (teacherId: string): Promise<Course[]> => {
  try {
    const coursesRef = collection(db, 'courses');
    const q = query(coursesRef, where('teacherId', '==', teacherId));
    
    const querySnapshot = await getDocs(q);
    const courses: Course[] = [];
    
    querySnapshot.forEach((doc) => {
      courses.push({ id: doc.id, ...doc.data() } as Course);
    });
    
    console.log(`Found ${courses.length} courses for teacher ${teacherId}`);
    return courses;
  } catch (error) {
    console.error('Error getting courses by teacher:', error);
    throw new Error('Failed to get courses by teacher');
  }
};

// Update a course
export const updateCourse = async (courseId: string, courseData: Partial<Course>): Promise<void> => {
  try {
    const docRef = doc(db, 'courses', courseId);
    await updateDoc(docRef, {
      ...courseData,
      updatedAt: new Date().toISOString(),
    });
    console.log('Course updated with ID:', courseId);
  } catch (error) {
    console.error('Error updating course:', error);
    throw new Error('Failed to update course');
  }
};

// Delete a course
export const deleteCourse = async (courseId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'courses', courseId);
    await deleteDoc(docRef);
    console.log('Course deleted with ID:', courseId);
  } catch (error) {
    console.error('Error deleting course:', error);
    throw new Error('Failed to delete course');
  }
};

// Enroll a student in a course
export const enrollStudent = async (courseId: string, studentId: string): Promise<void> => {
  try {
    const courseRef = doc(db, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);
    
    if (courseSnap.exists()) {
      const course = courseSnap.data() as Course;
      const studentIds = course.studentIds || [];
      
      if (!studentIds.includes(studentId)) {
        studentIds.push(studentId);
        await updateDoc(courseRef, { studentIds, updatedAt: new Date().toISOString() });
        console.log(`Student ${studentId} enrolled in course ${courseId}`);
      }
    }
  } catch (error) {
    console.error('Error enrolling student:', error);
    throw new Error('Failed to enroll student');
  }
};

// Unenroll a student from a course
export const unenrollStudent = async (courseId: string, studentId: string): Promise<void> => {
  try {
    const courseRef = doc(db, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);
    
    if (courseSnap.exists()) {
      const course = courseSnap.data() as Course;
      const studentIds = (course.studentIds || []).filter(id => id !== studentId);
      
      await updateDoc(courseRef, { studentIds, updatedAt: new Date().toISOString() });
      console.log(`Student ${studentId} unenrolled from course ${courseId}`);
    }
  } catch (error) {
    console.error('Error unenrolling student:', error);
    throw new Error('Failed to unenroll student');
  }
};

// ============================================
// ATTENDANCE MANAGEMENT FUNCTIONS
// ============================================

import { AttendanceRecord } from '../types';

// Create attendance record(s) - can be single or batch
export const createAttendanceRecords = async (records: Omit<AttendanceRecord, 'id'>[]): Promise<string[]> => {
  try {
    const ids: string[] = [];
    const attendanceRef = collection(db, 'attendance');
    
    for (const record of records) {
      const docRef = await addDoc(attendanceRef, {
        ...record,
        createdAt: new Date().toISOString(),
      });
      ids.push(docRef.id);
    }
    
    console.log(`Created ${ids.length} attendance record(s)`);
    return ids;
  } catch (error) {
    console.error('Error creating attendance records:', error);
    throw new Error('Failed to create attendance records');
  }
};

// Get attendance records for a student
export const getAttendanceByStudent = async (studentId: string): Promise<AttendanceRecord[]> => {
  try {
    const attendanceRef = collection(db, 'attendance');
    const q = query(attendanceRef, where('studentId', '==', studentId));
    
    const querySnapshot = await getDocs(q);
    const records: AttendanceRecord[] = [];
    
    querySnapshot.forEach((doc) => {
      records.push({ id: doc.id, ...doc.data() } as AttendanceRecord);
    });
    
    console.log(`Found ${records.length} attendance records for student ${studentId}`);
    return records;
  } catch (error) {
    console.error('Error getting attendance by student:', error);
    throw new Error('Failed to get attendance records');
  }
};

// Get attendance records for a course
export const getAttendanceByCourse = async (courseId: string): Promise<AttendanceRecord[]> => {
  try {
    const attendanceRef = collection(db, 'attendance');
    const q = query(attendanceRef, where('courseId', '==', courseId));
    
    const querySnapshot = await getDocs(q);
    const records: AttendanceRecord[] = [];
    
    querySnapshot.forEach((doc) => {
      records.push({ id: doc.id, ...doc.data() } as AttendanceRecord);
    });
    
    console.log(`Found ${records.length} attendance records for course ${courseId}`);
    return records;
  } catch (error) {
    console.error('Error getting attendance by course:', error);
    throw new Error('Failed to get attendance records');
  }
};

// Get attendance for a specific course and date
export const getAttendanceByDate = async (courseId: string, date: string): Promise<AttendanceRecord[]> => {
  try {
    const attendanceRef = collection(db, 'attendance');
    const q = query(
      attendanceRef, 
      where('courseId', '==', courseId),
      where('date', '==', date)
    );
    
    const querySnapshot = await getDocs(q);
    const records: AttendanceRecord[] = [];
    
    querySnapshot.forEach((doc) => {
      records.push({ id: doc.id, ...doc.data() } as AttendanceRecord);
    });
    
    return records;
  } catch (error) {
    console.error('Error getting attendance by date:', error);
    throw new Error('Failed to get attendance records');
  }
};

// Update attendance record
export const updateAttendanceRecord = async (recordId: string, data: Partial<AttendanceRecord>): Promise<void> => {
  try {
    const docRef = doc(db, 'attendance', recordId);
    await updateDoc(docRef, data);
    console.log('Attendance record updated:', recordId);
  } catch (error) {
    console.error('Error updating attendance record:', error);
    throw new Error('Failed to update attendance record');
  }
};

// Delete attendance record
export const deleteAttendanceRecord = async (recordId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'attendance', recordId);
    await deleteDoc(docRef);
    console.log('Attendance record deleted:', recordId);
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    throw new Error('Failed to delete attendance record');
  }
};
