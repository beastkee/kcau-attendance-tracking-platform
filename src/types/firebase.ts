export interface User {
  // Start with the basic required fields
  name: string;
  email: string;
  role: "admin" | "teacher" | "student"; 
  identificationNumber: number;
  phoneNumber: string;
  accountStatus: "active"|"graduated"|"deferred";
  dateJoined: Date;
  dateCompleted?: Date;
  department?: string;
  courses?: string[];
  courseCode: number;
  isEmailVerified: boolean;

  // Think: what are the 3 possible values?  
  // Continue with the rest...
  // Remember: some fields might be optional (use ?)
  // Think about the data types for each field
}