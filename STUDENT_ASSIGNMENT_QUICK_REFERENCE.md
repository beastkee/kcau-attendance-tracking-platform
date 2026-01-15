# Student Auto-Assignment System - Quick Reference

## What It Does
Automatically distributes unassigned students to available teachers with intelligent load balancing, ensuring no teacher is overwhelmed.

## Access
**URL:** `/admin/assignment`  
**Role:** Admin only  
**Location:** Admin Dashboard → "Auto-Assign Students"

## Quick Start (3 Steps)

### 1. Check Current Status
- Visit `/admin/assignment`
- View "Total Students", "Assigned", "Unassigned" stats
- Review teacher load distribution chart

### 2. Choose Strategy
| Strategy | Best For | Result |
|----------|----------|--------|
| **Least-Loaded** | Existing data, balancing | Assigns to teachers with fewest students |
| **Round-Robin** | Fresh enrollment, equal | Distributes evenly in order |

### 3. Click "Start Assignment"
- Select strategy and method (recommend: Least-Loaded + Courses)
- Click "Start Assignment"
- View results in modal

## Assignment Methods

| Method | Purpose | Recommended |
|--------|---------|-------------|
| **Through Courses** | Enroll in available courses | ✅ Yes (recommended) |
| **Direct to Teachers** | Assign teacher advisors | For future use |

## Key Metrics

- **Unassigned Students:** Students not in any course
- **Load Balance Score:** 0 (perfect) to 1 (very unbalanced)
- **Avg Per Teacher:** Average students per teacher
- **Distribution:** Students count per teacher

## Common Tasks

### Assign All Unassigned Students
1. Go to `/admin/assignment`
2. Verify "Unassigned" count
3. Select "Least-Loaded" strategy
4. Select "Through Courses" method
5. Click "Start Assignment"

### Balance Existing Load
1. Note which teachers are overloaded in the chart
2. Use "Least-Loaded" strategy
3. This automatically helps balance new assignments

### View Detailed Results
1. After assignment, results modal shows:
   - Successful assignments (count)
   - Failed assignments (count)
   - Distribution by teacher
   - Detailed list of each assignment

### Retry Failed Assignments
1. Identify failed students from results modal
2. Manually assign them later
3. Or re-run assignment (least-loaded will try again)

## What Gets Assigned?

### When using "Through Courses":
- Students added to available courses
- Each course has a teacher
- Students can now see their courses
- Teacher can mark attendance

### When using "Direct to Teachers":
- Student advisor relationship created
- Currently not in course system
- For future implementation

## Load Distribution Examples

### Example 1: Fresh Start
```
Before: No students assigned
5 Teachers: A, B, C, D, E

Assign 20 students with Round-Robin:
Result: A(4), B(4), C(4), D(4), E(4) ✅ Perfect balance
```

### Example 2: Rebalancing
```
Before: A(5), B(15), C(3), D(2), E(5)
Assign 10 more students with Least-Loaded:

Assignment order: D, C, D, C, D, C, D, C, D, C
Result: A(5), B(15), C(8), D(7), E(5) ✅ Improved balance
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "No unassigned students to distribute" | All students already assigned - no action needed |
| "No teachers available" | Add teachers first in Teachers admin page |
| Some students show "failed" in results | Check Firebase error logs, retry later |
| Uneven distribution after assignment | Least-loaded adapts to existing load - is working correctly |

## Statistics Interpretation

**Load Balance Score: 0.15**
- Close to 0 = Well balanced ✅
- Close to 1 = Very unbalanced ⚠️

**Example:**
- A(10), B(12), C(11) = Score ~0.08 (excellent balance)
- A(2), B(25), C(3) = Score ~0.90 (very unbalanced)

## Important Notes

1. **No Rollback:** Assignments are final. Failed ones can be retried.
2. **Partial Success:** Some students may fail while others succeed.
3. **Course-Based Recommended:** Enroll through courses for full functionality.
4. **Courses Required:** Need available courses to assign through them.
5. **Teachers Required:** Need at least 1 teacher for any assignment.

## Results Modal Content

After clicking "Start Assignment":

| Field | Meaning |
|-------|---------|
| Successful | How many students were assigned |
| Failed | How many assignments failed |
| Total Students | All students in the system |
| Avg Per Teacher | Mean students per teacher now |
| Distribution | Shows each teacher's final count |
| Assignment Details | List of each student + status |

## Tips for Best Results

1. ✅ Use **Least-Loaded** for existing data
2. ✅ Use **Round-Robin** for fresh bulk enrollment
3. ✅ Check unassigned count before starting
4. ✅ Verify teachers exist before assigning
5. ✅ Review distribution chart before/after
6. ✅ Check results modal for any failures

## Advanced Usage

### To use in custom code:
```typescript
import {
  distributeStudentsAcrossCourses,
  getAssignmentStatistics,
} from '@/lib/studentAssignment';

// Get stats
const stats = getAssignmentStatistics(students, teachers, courses);

// Perform assignment
const result = await distributeStudentsAcrossCourses(
  unassignedStudents,
  courses,
  enrollStudent,
  { balanceStrategy: 'least-loaded' }
);
```

## See Also
- Full documentation: `STUDENT_ASSIGNMENT_GUIDE.md`
- Admin students page: `/admin/students`
- Admin classes page: `/admin/classes`
- Admin teachers page: `/admin/teachers`
