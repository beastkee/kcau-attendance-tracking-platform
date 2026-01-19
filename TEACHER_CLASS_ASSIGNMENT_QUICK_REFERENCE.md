# Teacher-to-Class Assignment - Quick Reference

## What It Does
Automatically assigns qualified teachers to classes based on their expertise and balances workload across the team.

## Access
**URL:** `/admin/teacher-assignment`  
**Role:** Admin only  
**Location:** Admin Dashboard → "Assign Teachers to Classes"

## Quick Start (3 Steps)

### 1. Check Current Status
- Visit `/admin/teacher-assignment`
- View statistics: total classes, assigned, unassigned
- Review teacher workload distribution

### 2. Choose Strategy
| Strategy | Best For | Result |
|----------|----------|--------|
| **Expertise-First** ⭐ | Quality instruction | Matches experts to courses |
| **Load-Balanced** | Fair workload | Even distribution |
| **Availability-First** | Rapid assignment | Lightest-loaded teachers first |

### 3. Click "Assign Teachers to Classes"
- System matches teachers to unassigned classes
- View detailed results
- Verify assignments

## Assignment Methods

| Action | Purpose |
|--------|---------|
| **Assign Teachers** | Assign all unassigned classes |
| **Rebalance** | Optimize existing assignments |
| **View Results** | See detailed match scores |

## Key Metrics

- **Load Balance Score:** 0 (perfect) to 1 (imbalanced)
- **Utilization Rate:** % of teachers with assignments
- **Avg Classes/Teacher:** Mean workload
- **Match Score:** 0-100 how well teacher fits class

## Common Tasks

### Assign Unassigned Classes
1. Go to `/admin/teacher-assignment`
2. Verify "Unassigned" count
3. Select "Expertise-First" strategy ⭐
4. Click "Assign Teachers to Classes"

### Rebalance Workload
1. Check current distribution in chart
2. If uneven, click "Rebalance Assignments"
3. Select strategy (use "Load-Balanced")
4. Review new distribution

### Check Assignment Quality
1. After assignment, review results modal
2. Look at "Match Score" column
3. Scores 80+ indicate good match
4. Scores <70 may need review

## What Gets Assigned?

When you assign teachers to classes:
- ✅ Class gets a teacher
- ✅ Teacher now visible to students in that class
- ✅ Teacher can take attendance
- ✅ Course is "covered"

## Match Score Explained

| Score | Meaning | Action |
|-------|---------|--------|
| 90-100 | Excellent match | Perfect assignment ✅ |
| 80-89 | Good match | Acceptable assignment |
| 70-79 | Fair match | Review needed |
| <70 | Poor match | Consider reassignment |

**Score Factors:**
- Course code match (40 pts) - e.g., "CS" teacher for CS101
- Subject name match (30 pts) - e.g., "Math" teacher for Calculus
- Student count (20 pts) - Fit with class size
- Teacher availability (10 pts) - Light workload bonus

## Strategy Comparison

### Expertise-First
**Best For:** Quality instruction priority
```
Teachers:
- Dr. Smith (CS expert): 2 classes
- Dr. Johnson (Math expert): 1 class
- Dr. Williams (Science expert): 2 classes

Assign CS101, MATH201, BIO101:
✅ CS101 → Dr. Smith (95/100)
✅ MATH201 → Dr. Johnson (92/100)
✅ BIO101 → Dr. Williams (88/100)
```

### Load-Balanced
**Best For:** Fairness and equity
```
Same teachers as above (Smith 2, Johnson 1, Williams 2)

Assign same classes:
✅ CS101 → Dr. Smith (95, but has load penalty → 85)
✅ MATH201 → Dr. Johnson (92, light → 92)
✅ BIO101 → Dr. Johnson (85, balance priority)
Result: More even distribution
```

### Availability-First
**Best For:** Emergency/quick assignments
```
Same scenario:

Assign all 3 classes:
✅ CS101 → Dr. Johnson (light workload priority)
✅ MATH201 → Dr. Williams (light workload priority)
✅ BIO101 → Dr. Johnson (lightest)
Result: Very even distribution
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "No unassigned classes" | All classes have teachers - working correctly |
| "No teachers available" | Add teachers to system first |
| Some assignments show "Failed" | Check Firebase permissions, retry |
| Low match scores (< 70) | Limited expertise overlap - acceptable |
| Very uneven distribution | Run rebalance with "Load-Balanced" |

## Load Balance Examples

### Perfect Balance (Score: 0.0)
```
5 teachers, 10 classes
Each teacher: exactly 2 classes ✅
Score: 0.00 (perfectly balanced)
```

### Acceptable Balance (Score: 0.15)
```
5 teachers, 10 classes
Distribution: 1, 2, 2, 2, 3 classes
Score: 0.15 (good balance) ✅
```

### Poor Balance (Score: 0.80)
```
5 teachers, 10 classes
Distribution: 1, 1, 1, 1, 6 classes
Score: 0.80 (very unbalanced) ⚠️
Action: Rebalance immediately
```

## Before/After Assignment

### Before
```
Classes: 15 total
- Assigned: 12
- Unassigned: 3

Teachers: 5 total
- Distribution: A(3), B(2), C(3), D(2), E(2)
- Load Balance: 0.10
```

### After (Using Expertise-First)
```
Classes: 15 total
- Assigned: 15
- Unassigned: 0

Teachers: 5 total
- Distribution: A(3), B(3), C(3), D(3), E(3)
- Load Balance: 0.00 (perfect)
- Match Scores: All 85+
```

## Results Modal Content

After clicking "Assign Teachers to Classes":

| Field | Meaning |
|-------|---------|
| Successful | How many classes got assigned |
| Failed | How many assignments failed |
| Total Classes | All classes in system |
| Avg Classes/Teacher | Mean workload now |
| Distribution | Each teacher's final count |
| Assignment Details | List of each assignment + score |

## Tips for Best Results

1. ✅ Use **Expertise-First** by default
2. ✅ Review unassigned count first
3. ✅ Verify teachers exist and are active
4. ✅ Check match scores in results
5. ✅ Rebalance if distribution uneven
6. ✅ Monitor for curriculum changes

## Statistics Interpretation

**Utilization Rate: 90%**
- 90% of teachers have classes
- 10% unassigned (substitute/admin pool)
- Healthy range: 80-95%

**Avg Classes/Teacher: 3.2**
- Average workload
- Can vary by department
- Check distribution chart for details

**Load Balance: 0.25**
- Fairly balanced (0 = perfect)
- Acceptable range: 0-0.30
- Consider rebalancing if > 0.40

## Advanced Usage

### Using in Code
```typescript
import {
  assignTeachersToClasses,
  getTeacherAssignmentStatistics
} from '@/lib/teacherClassAssignment';

// Check stats
const stats = getTeacherAssignmentStatistics(courses, teachers);

// Perform assignment
const result = await assignTeachersToClasses(
  unassignedClasses,
  teachers,
  courses,
  updateCourse,
  { balanceStrategy: 'expertise-first' }
);
```

## See Also
- Full documentation: `TEACHER_CLASS_ASSIGNMENT_GUIDE.md`
- Student assignment: `/admin/assignment`
- Class management: `/admin/classes`
- Teacher management: `/admin/teachers`
