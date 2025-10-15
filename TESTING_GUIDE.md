# Testing Guide - Analytics & Risk Assessment

## Prerequisites
Before testing the analytics features, ensure you have:
- Firebase project configured
- At least one admin account
- At least one teacher account
- Several student accounts

## Step-by-Step Testing Flow

### 1. Register Users (Admin Portal)
**Path**: `/admin/students` or `/admin/teachers`

#### Register Students
1. Click **"Add Student"** button
2. Fill in the form:
   - Name: John Doe
   - Email: john.doe@example.com
   - Password: (minimum 6 characters)
   - Phone: +1234567890
   - ID Number: S001
   - Department: Computer Science
   - Account Status: Active
3. Click **"Save"**
4. Repeat for 5-10 students to get meaningful data

#### Register Teachers
1. Click **"Add Teacher"** button (on `/admin/teachers`)
2. Fill in similar information
3. Assign department
4. Save

**Expected Result**: Users appear in their respective tables

---

### 2. Create Classes
**Path**: `/admin/classes`

1. Click **"Add Class"** button
2. Fill in class details:
   - Course Code: CS101
   - Course Name: Introduction to Programming
   - Select Teacher: (from dropdown)
   - Schedule: Mon/Wed 10:00-12:00
   - Department: Computer Science
   - Semester: Fall 2024
   - Credits: 3
   - Description: Basic programming concepts
3. Click **"Create Class"**
4. Repeat for 2-3 different classes

**Expected Result**: Classes appear in the table with teacher names

---

### 3. Enroll Students in Classes
**Path**: `/admin/classes`

1. Find a class in the list
2. Click **"Enroll Students"** button
3. Select multiple students from the modal
4. Click **"Enroll Selected"**
5. Repeat for each class

**Expected Result**: Student count updates for each class

---

### 4. Mark Attendance (Teacher Portal)
**Path**: `/teacher/attendance`

1. Login as a teacher
2. Select a class from the dropdown
3. You'll see all enrolled students
4. For each student, choose:
   - **Present** (green button)
   - **Late** (yellow button)
   - **Absent** (red button)
5. Click **"Save Attendance"** at the bottom

**Tips for Testing Risk Levels**:
- **Create a Low-Risk Student**: Mark as Present for all sessions
- **Create a Medium-Risk Student**: Mix of Present (60%), Late (20%), Absent (20%)
- **Create a High-Risk Student**: Mark as Absent for 50%+ of sessions

**Repeat** this for multiple dates:
```
Date 1: Mix of attendance
Date 2: Different patterns
Date 3: Show trends (improving/declining)
```

**Expected Result**: Success message, attendance records saved

---

### 5. View Risk Assessment (Admin Portal)
**Path**: `/admin/students`

#### Statistics Dashboard
At the top of the page, you should see:
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Total       │ High Risk   │ Medium Risk │ Low Risk    │
│ Students    │    🚨       │    ⚠️       │    ✅       │
│    10       │     2       │     3       │     5       │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

**Expected Result**: Risk counts match attendance patterns

#### Student Table
Each student row should show:
- Name, email, ID, department
- Account status badge
- **Risk badge** (colored: red/yellow/green)
- Risk score percentage (if available)

**Expected Results**:
- Students with poor attendance show **HIGH** risk (red badge)
- Students with mixed attendance show **MEDIUM** risk (yellow badge)
- Students with good attendance show **LOW** risk (green badge)

#### Student Details Modal
1. Click **"View"** on any student
2. Scroll to the **Risk Assessment** card
3. You should see:
   ```
   Risk Assessment
   ├─ Risk Level: HIGH (red badge)
   ├─ Risk Score: 65.3%
   └─ Breakdown:
      ├─ Attendance Rate: 55.0%
      ├─ Total Absences: 5
      ├─ Times Late: 2
      ├─ Total Sessions: 10
      └─ Recent Trend: ↘ Declining
   ```

**Expected Result**: 
- All metrics match actual attendance data
- Trend indicator shows ↗ Improving, ↘ Declining, or → Stable

---

## Validation Tests

### Test Case 1: No Attendance Data
**Setup**: Create a new student with no attendance records
**Expected**: 
- Risk badge shows "Low" (neutral/fallback)
- No score displayed
- Details modal shows minimal info

### Test Case 2: Perfect Attendance
**Setup**: Mark student as Present for 10 sessions
**Expected**:
- Risk Level: LOW
- Risk Score: ~5% (very low)
- Attendance Rate: 100%
- Absences: 0
- Trend: → Stable or ↗ Improving

### Test Case 3: Poor Attendance
**Setup**: Mark student as Absent for 7/10 sessions
**Expected**:
- Risk Level: HIGH
- Risk Score: 60%+ 
- Attendance Rate: 30%
- Absences: 7
- Trend: ↘ Declining (likely)

### Test Case 4: Improving Trend
**Setup**: 
- First 5 sessions: mostly Absent
- Next 5 sessions: mostly Present
**Expected**:
- Risk Level: MEDIUM or LOW
- Recent Trend: ↗ Improving (positive slope)

### Test Case 5: Declining Trend
**Setup**:
- First 5 sessions: mostly Present
- Next 5 sessions: mostly Absent
**Expected**:
- Risk Level: MEDIUM or HIGH
- Recent Trend: ↘ Declining (negative slope)

---

## Edge Cases to Test

### Empty Data
- [ ] No students registered
- [ ] No classes created
- [ ] No attendance records
- [ ] Student never enrolled in any class

### Large Datasets
- [ ] 100+ students
- [ ] 50+ classes
- [ ] 1000+ attendance records

### Concurrent Updates
- [ ] Multiple teachers marking attendance simultaneously
- [ ] Admin viewing risks while teacher marks attendance

---

## Performance Checks

### Page Load Times
- [ ] Admin students page loads within 3 seconds
- [ ] Risk calculations complete within 5 seconds
- [ ] No UI freezing during data fetch

### Data Accuracy
- [ ] Risk scores match manual calculations
- [ ] Trend indicators reflect actual patterns
- [ ] Statistics sum correctly

---

## Debugging Tips

### If Risk Badges Don't Show
1. Open browser console (F12)
2. Check for errors related to:
   - `getAttendanceByStudent`
   - `analyzeStudentAttendance`
   - Firebase connection
3. Verify attendance records exist in Firestore
4. Check that student IDs match between users and attendance

### If Statistics Are Incorrect
1. Refresh the page
2. Check `studentRisks` state in React DevTools
3. Verify `loadRiskAssessments` is being called
4. Confirm attendance records have correct `studentId`

### If Trends Seem Wrong
1. Ensure attendance records are sorted by date
2. Check that dates are in ISO string format
3. Verify at least 10 records exist for trend calculation

---

## Success Criteria

✅ **Feature Complete When**:
1. Students display with colored risk badges
2. Statistics show accurate risk distribution
3. Risk scores reflect attendance patterns
4. Trends indicate improving/declining correctly
5. Details modal shows comprehensive breakdown
6. Performance is acceptable (<5s load time)
7. No console errors
8. Data persists after page refresh

---

## Next Steps After Testing

Once basic functionality is validated:
1. Push changes to GitHub
2. Test with real students and teachers
3. Gather feedback on risk thresholds
4. Adjust weights if needed (absence/lateness/trend)
5. Add email alerts for high-risk students
6. Create weekly risk reports
7. Build predictive models for dropout risk

---

**Happy Testing! 🚀**

If you encounter issues, check:
- `ANALYTICS_INTEGRATION.md` for implementation details
- Browser console for errors
- Firebase console for data structure
- TypeScript compiler for type errors
