// TODO: Add request caching layer
import { db } from './firebase';
import { User } from '../types/firebase';

// Import Firestore functions
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc,
  setDoc, 
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
    return userCredential.user;
  } catch (error) {
      // Error handled
    throw new Error('Failed to login');
  }
};

// Create a new user in Firestore
export const createUser = async (userData: User): Promise<string> => {
  try {
    console.log('Creating Firestore user document with data:', userData);
    // Add document to 'users' collection
    const docRef = await addDoc(collection(db, 'users'), userData);
    console.log('Firestore document created with ID:', docRef.id);
    return docRef.id; // Return the auto-generated document ID
  } catch (error: any) {
    console.error('Firestore createUser error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    throw new Error(`Failed to create user: ${error.message}`);
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
      // Error handled
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
    console.log('Step 1: Creating Firebase Auth user...');
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    firebaseUser = userCredential.user;
    console.log('Step 1 complete: Firebase Auth user created', firebaseUser.uid);

    // Update display name
    console.log('Step 2: Updating display name...');
    await updateProfile(firebaseUser, {
      displayName: userData.name
    });
    console.log('Step 2 complete: Display name updated');

    // Send email verification
    console.log('Step 3: Sending verification email...');
    await sendEmailVerification(firebaseUser);
    console.log('Step 3 complete: Verification email sent');

    // Create user document in Firestore with the Firebase UID
    console.log('Step 4: Creating Firestore user document...');
    
    // Remove undefined fields (Firestore doesn't support undefined)
    const cleanUserData: any = {};
    Object.keys(userData).forEach(key => {
      const value = (userData as any)[key];
      if (value !== undefined) {
        cleanUserData[key] = value;
      }
    });
    
    const userDocData = {
      ...cleanUserData,
      id: firebaseUser.uid, // Add the UID to the user data
      isEmailVerified: false
    };
    
    // Use setDoc with the Firebase UID as the document ID
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    await setDoc(userDocRef, userDocData);
    console.log('Step 4 complete: Firestore user document created with UID:', firebaseUser.uid);

    return firebaseUser.uid;
  } catch (error: any) {
    console.error('Registration failed at some step:', error);
    // If Firestore user creation fails after Auth user is created, delete the Auth user
    if (firebaseUser && !firebaseUser.emailVerified) {
      try {
        await deleteAuthUser(firebaseUser);
        console.warn('Auth user deleted due to Firestore registration failure');
      } catch (delErr) {
        console.error('Failed to delete auth user:', delErr);
      }
    }
    // Handle specific Firebase errors
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('This email is already registered');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password should be at least 6 characters');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address');
    }
    throw new Error(error.message || 'Failed to register user');
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
      // Error handled
    return false;
  }
};

// Resend email verification
export const resendEmailVerification = async (): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');
    
    await sendEmailVerification(user);
  } catch (error) {
      // Error handled
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
      // Error handled
    throw new Error('Failed to get user');
  }
};

// - updateUser
export const updateUser = async (userId: string, userData: Partial<User>): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, userData);
  } catch (error) {
      // Error handled
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
  } catch (error) {
      // Error handled
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
      // Error handled
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
    
    return users;
  } catch (error) {
      // Error handled
    throw new Error(`Failed to get ${role}s`);
  }
};

// Get students count
export const getStudentsCount = async (): Promise<number> => {
  try {
    const students = await getUsersByRole('student');
    return students.length;
  } catch (error) {
      // Error handled
    return 0;
  }
};

// Get teachers count
export const getTeachersCount = async (): Promise<number> => {
  try {
    const teachers = await getUsersByRole('teacher');
    return teachers.length;
  } catch (error) {
      // Error handled
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
      // Error handled
    throw new Error('Failed to get user by email');
  }
};

// Update user account status
export const updateUserStatus = async (userId: string, status: 'active' | 'inactive' | 'suspended'): Promise<void> => {
  try {
    await updateUser(userId, { accountStatus: status });
  } catch (error) {
      // Error handled
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
    return docRef.id;
  } catch (error) {
      // Error handled
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
      // Error handled
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
    
    return courses;
  } catch (error) {
      // Error handled
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
    
    // Get teacher name
    const teacherDoc = await getDoc(doc(db, 'users', teacherId));
    const teacherName = teacherDoc.exists() ? teacherDoc.data().name : 'Unknown Teacher';
    
    querySnapshot.forEach((doc) => {
      courses.push({ 
        id: doc.id, 
        ...doc.data(),
        teacherName: teacherName // Add teacher name to each course
      } as Course);
    });
    
    return courses;
  } catch (error) {
    console.error('Error fetching courses by teacher:', error);
    throw new Error('Failed to get courses by teacher');
  }
};

// Get courses by student ID
export const getCoursesByStudent = async (studentId: string): Promise<Course[]> => {
  try {
    const coursesRef = collection(db, 'courses');
    const q = query(coursesRef, where('studentIds', 'array-contains', studentId));
    
    const querySnapshot = await getDocs(q);
    const courses: Course[] = [];
    
    querySnapshot.forEach((doc) => {
      courses.push({ id: doc.id, ...doc.data() } as Course);
    });
    
    return courses;
  } catch (error) {
      // Error handled
    throw new Error('Failed to get courses by student');
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
  } catch (error) {
    console.error('Error updating course:', error);
    throw new Error(`Failed to update course: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Delete a course
export const deleteCourse = async (courseId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'courses', courseId);
    await deleteDoc(docRef);
  } catch (error) {
      // Error handled
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
      }
    }
  } catch (error) {
      // Error handled
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
    }
  } catch (error) {
      // Error handled
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
    
    return ids;
  } catch (error) {
      // Error handled
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
    
    return records;
  } catch (error) {
      // Error handled
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
    
    return records;
  } catch (error) {
      // Error handled
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
      // Error handled
    throw new Error('Failed to get attendance records');
  }
};

// Update attendance record
export const updateAttendanceRecord = async (recordId: string, data: Partial<AttendanceRecord>): Promise<void> => {
  try {
    const docRef = doc(db, 'attendance', recordId);
    await updateDoc(docRef, data);
  } catch (error) {
      // Error handled
    throw new Error('Failed to update attendance record');
  }
};

// Delete attendance record
export const deleteAttendanceRecord = async (recordId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'attendance', recordId);
    await deleteDoc(docRef);
  } catch (error) {
      // Error handled
    throw new Error('Failed to delete attendance record');
  }
};
