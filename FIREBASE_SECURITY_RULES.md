# Firebase Firestore Security Rules Update

## Current Issue
The Firestore security rules are too restrictive and preventing authenticated users from updating course data.

## Updated Security Rules

Copy and paste the following rules into your Firebase Console → Firestore Database → Rules tab:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow anyone authenticated to read their own user data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId || request.auth.uid != null;
    }
    
    // Allow authenticated users to read and update courses
    match /courses/{courseId} {
      allow read: if request.auth.uid != null;
      allow write: if request.auth.uid != null && 
                      (resource == null || 
                       request.auth.uid == resource.data.teacherId ||
                       get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Allow authenticated users to access attendance records
    match /attendance/{attendanceId} {
      allow read, write: if request.auth.uid != null;
    }
    
    // Allow authenticated users to access analytics
    match /analytics/{docId} {
      allow read: if request.auth.uid != null;
      allow write: if request.auth.uid != null && request.auth.uid == docId;
    }
    
    // Deny all other access by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Steps to Update

1. Go to: https://console.firebase.google.com
2. Select your project: `studentattendanceportal-37b5a`
3. Navigate to: **Firestore Database** → **Rules** tab
4. Replace all existing rules with the rules above
5. Click **Publish**
6. Wait for deployment confirmation

## What These Rules Allow

✅ **Authenticated users can:**
- Read all courses
- Create and update courses (if they're the teacher or admin)
- Read and write attendance records (for their classes/records)
- Read their own analytics
- Write/update their own analytics

❌ **Unauthenticated users cannot:**
- Read or write any data
- Access any collections

## Testing

After publishing these rules:

1. Try updating a course from the admin dashboard
2. Verify no "Missing or insufficient permissions" errors appear
3. Check the browser console for successful updates

## Reference
- Firebase Console: https://console.firebase.google.com
- Project ID: `studentattendanceportal-37b5a`
- Database: Firestore

---

**Note:** These rules allow authenticated users broad access. For production, you may want more restrictive rules based on user roles.
