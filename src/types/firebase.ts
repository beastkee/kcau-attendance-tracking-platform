export interface User {
  id?: string; // Document ID from Firestore
  name: string;
  email: string;
  role: "admin" | "teacher" | "student"; 
  identificationNumber: string; // Changed from number to string for easier handling
  phoneNumber: string;
  accountStatus: "active" | "inactive" | "suspended";
  dateJoined: string; // Changed from Date to string for easier serialization
  dateCompleted?: string;
  department?: string;
  courses?: string[];
  courseCode?: string;
  isEmailVerified: boolean;
}
