# Teacher Access to Allocated Classes - Setup Guide

## Overview
Teachers can now fully access their allocated classes assigned by the admin. This guide explains how the system works and how to verify it's functioning correctly.

## How It Works

### 1. Admin Allocates Classes
- Admin logs in and navigates to **Classes** page (`/admin/classes`)
- Admin clicks **"Add Class"** to create a new class
- In the class creation form, admin selects a teacher from the **"Assign Teacher"** dropdown
- The teacher's ID is stored in the `teacherId` field of the course document

### 2. Teacher Views Allocated Classes
- Teacher logs in with their credentials
- System authenticates and gets their Firebase UID
- Teacher navigates to **"My Classes"** (`/teacher/classes`)
- System queries Firestore for all courses where `teacherId` matches their UID
- Classes are displayed with full details

## Features Available to Teachers

### My Classes Page (`/teacher/classes`)
- **View all allocated classes** with:
  - Course name and code
  - Number of enrolled students
  - Schedule, department, semester
  - Credits and description
  
- **Summary Statistics**:
  - Total number of classes
  - Total students across all classes
  - Total credits taught
  
- **Quick Actions per Class**:
  - Take Attendance button
  - View Reports button
  - Click card to see detailed modal

### Teacher Dashboard (`/teacher`)
- Real-time data showing:
  - Classes taught
  - Total students
  - High-risk students alerts
  - Class-by-class risk summaries

## Technical Implementation

### Database Structure
```javascript
// Course document in Firestore
{
  id: "course123",
  name: "Introduction to Computer Science",
  code: "CS101",
  teacherId: "teacherFirebaseUID", // ← Links to teacher
  studentIds: ["student1", "student2"],
  schedule: "Mon/Wed/Fri 9:00 AM",
  department: "Computer Science",
  semester: "Fall 2025",
  credits: 3,
  description: "...",
  teacherName: "Dr. Smith" // Auto-populated
}
```

### Key Functions

1. **`getCoursesByTeacher(teacherId)`** in `firebaseServices.ts`:
   - Queries courses where `teacherId == current teacher's UID`
   - Automatically fetches and adds teacher name to each course
   - Returns array of courses

2. **Teacher Classes Page** (`/teacher/classes/page.tsx`):
   - Gets current user's UID from Firebase Auth
   - Calls `getCoursesByTeacher()` with that UID
   - Displays courses in grid layout
   - Shows empty state if no classes assigned

## Verification Steps

### Step 1: Register a Teacher
1. Go to login page
2. Click "Register as Teacher"
3. Fill in teacher details
4. Submit registration

### Step 2: Admin Assigns Class
1. Login as admin
2. Go to Classes page
3. Click "Add Class"
4. Fill in course details
5. **Important**: Select the teacher from dropdown
6. Save the class

### Step 3: Teacher Checks Classes
1. Login as the teacher
2. Navigate to "My Classes" from sidebar
3. Verify the assigned class appears
4. Check that:
   - Course name and details are correct
   - Teacher can see enrolled students count
   - Quick action buttons work

### Step 4: Check Console Logs
Open browser console (F12) and look for:
```
Loading classes for teacher: [teacherUID]
Fetched courses: [number] classes
```

## Troubleshooting

### Teacher Sees No Classes
**Possible Causes**:
1. Admin didn't assign any classes to this teacher
2. TeacherId in course doesn't match teacher's Firebase UID
3. Firestore security rules blocking read access

**Solutions**:
1. Check browser console for errors
2. Verify admin selected correct teacher when creating class
3. Ensure teacher is logged in with correct account
4. Check Firestore rules allow authenticated reads:
   ```javascript
   match /courses/{courseId} {
     allow read: if request.auth != null;
   }
   ```

### Classes Not Loading
**Check**:
1. Browser console for error messages
2. Network tab - is Firestore query succeeding?
3. Firebase Auth - is teacher authenticated?
4. Firestore - does course document have correct `teacherId`?

### Teacher Name Not Showing
**Fix**: The system now auto-populates `teacherName` when fetching courses. If old courses don't have it:
1. Admin can edit the course (saves with teacher name)
2. Or run a migration script to add teacher names to existing courses

## Recent Improvements

### Enhanced Logging
- Added console logs in `loadClasses()` function
- Shows teacher ID and number of courses fetched
- Easier debugging for both teachers and developers

### Error Handling
- Alert shown if classes fail to load
- Helpful message prompts user to refresh
- Errors logged to console for troubleshooting

### Teacher Name Auto-Population
- `getCoursesByTeacher()` now fetches teacher's name from users collection
- Automatically adds `teacherName` field to each course
- Consistent display across all pages

## Integration Points

### With Student Enrollment
- When students enroll, they see teacher name on each course
- Teacher can see enrolled students count update in real-time

### With Attendance System
- "Take Attendance" button links to attendance page with courseId
- Teacher can mark attendance for their allocated classes only

### With Reports
- "View Reports" button shows analytics for that specific class
- Risk assessments and attendance trends per class

## Security Considerations

### Authentication Required
- All teacher pages require authentication
- Redirects to login if not authenticated
- Uses Firebase Auth `onAuthStateChanged`

### Authorization
- Teachers can only see courses where `teacherId` matches their UID
- Cannot access other teachers' classes
- Admin has full visibility of all classes

### Data Privacy
- Teacher sees student IDs and count, not full student details (unless navigating to students page)
- Course details visible only to assigned teacher and admins

## Future Enhancements

1. **Email Notifications**: Alert teachers when assigned to new class
2. **Class Analytics**: Per-class attendance trends and predictions
3. **Student Details**: View enrolled students' profiles and performance
4. **Grade Management**: Add grades and feedback per student
5. **Class Materials**: Upload and share resources with students

## Support

If teachers report issues:
1. Check browser console first
2. Verify Firestore data structure
3. Confirm teacher is logged in correctly
4. Review security rules
5. Check admin correctly assigned the class

---

**System Status**: ✅ Fully Functional
**Last Updated**: October 16, 2025
