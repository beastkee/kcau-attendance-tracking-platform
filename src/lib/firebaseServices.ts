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
  updateProfile
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
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

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