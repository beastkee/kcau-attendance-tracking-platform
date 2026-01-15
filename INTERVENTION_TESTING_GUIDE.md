# Intervention System Testing Guide

**Purpose:** Validate automated early intervention system functionality
**Estimated Time:** 2-3 hours
**Test Date:** [Your Date]

---

## Pre-Testing Checklist

- [ ] Firebase Firestore running
- [ ] Dev server running: `npm run dev`
- [ ] Access to admin dashboard: `http://localhost:3000/admin`
- [ ] Test user accounts created (3+ students, 1-2 teachers)
- [ ] All latest code pulled and compiled

---

## Test Suite 1: Core Intervention Logic

### Test 1.1: Risk Score Calculation

**Objective:** Verify risk scores are calculated correctly

**Setup:**
```bash
# Create test student with known attendance pattern
- Present: 10 sessions
- Absent: 5 sessions  
- Late: 2 sessions
- Expected attendance %: 50%
```

**Steps:**
1. Go to `/teacher` dashboard
2. Select test class
3. Mark attendance as above
4. Check RiskBadge shows calculated percentage

**Expected Result:**
- Attendance: ~50% ✓
- Risk Score: ~60-70 (medium-high) ✓
- Risk Level: "medium" badge ✓

**Pass/Fail:** ___

---

### Test 1.2: Intervention Trigger Decision

**Objective:** Verify interventions trigger at correct thresholds

**Setup:**
Create 4 test students with different risk scores:

| Student | Attendance | Expected Risk | Should Trigger |
|---------|-----------|----------------|----------------|
| Alice   | 90% (1 absence) | ~15 | NO |
| Bob     | 75% (5 absences) | ~45 | YES (email) |
| Charlie | 60% (8 absences) | ~65 | YES (email) |
| Diana   | 40% (12 absences) | ~80 | YES (counselor) |

**Steps:**
1. Create all 4 students in system
2. Mark attendance as specified
3. Run: `await scanAndTriggerInterventions()`
4. Check `/admin/interventions` dashboard

**Expected Result:**
- Alice: No intervention ✓
- Bob: email-alert ✓
- Charlie: email-alert ✓
- Diana: counselor-referral ✓
- Total triggered: 3 ✓

**Pass/Fail:** ___

---

### Test 1.3: Intervention Type Assignment

**Objective:** Verify correct intervention type based on risk

**Setup:**
Create students with scores: 25, 45, 65, 85

**Steps:**
1. Mark attendance to achieve scores
2. Run scan
3. Compare generated intervention types

**Expected Result:**
- Score 25: NO intervention (below threshold) ✓
- Score 45: type = 'email-alert' ✓
- Score 65: type = 'email-alert' ✓
- Score 85: type = 'counselor-referral' ✓

**Pass/Fail:** ___

---

## Test Suite 2: Database Operations

### Test 2.1: Create Intervention

**Objective:** Verify interventions are saved to Firestore

**Steps:**
1. Manually trigger intervention:
```typescript
const id = await createIntervention({
  studentId: 'test_001',
  studentName: 'Test Student',
  type: 'email-alert',
  status: 'triggered',
  riskScore: 55,
  reason: 'Test intervention',
  triggeredAt: new Date(),
  followUpRequired: false,
});
```
2. Check Firebase Console → Firestore → interventions collection
3. Verify document created with correct data

**Expected Result:**
- Document created ✓
- All fields present ✓
- Status = 'triggered' ✓
- Timestamp recorded ✓

**Pass/Fail:** ___

---

### Test 2.2: Update Intervention Status

**Objective:** Verify status updates work correctly

**Steps:**
1. Get an intervention ID from previous test
2. Update status:
```typescript
await updateInterventionStatus(id, 'acknowledged', 'Test notes');
```
3. Check Firebase and dashboard

**Expected Result:**
- Status updated to 'acknowledged' ✓
- Notes saved ✓
- acknowledgedAt timestamp set ✓
- Dashboard reflects change ✓

**Pass/Fail:** ___

---

### Test 2.3: Query Interventions

**Objective:** Verify query functions work

**Steps:**
```typescript
// Test each query
const active = await getActiveInterventions();
const highPriority = await getHighPriorityInterventions();
const stats = await getInterventionStats();
```

**Expected Result:**
- active: Returns array of non-resolved interventions ✓
- highPriority: Returns only score >= 70 ✓
- stats: Returns object with count properties ✓

**Pass/Fail:** ___

---

## Test Suite 3: UI Components

### Test 3.1: Admin Dashboard

**Objective:** Verify dashboard displays correctly

**Steps:**
1. Navigate to `/admin/interventions`
2. Check page loads without errors
3. Verify statistics cards display
4. Check filter buttons work
5. Verify interventions display

**Expected Result:**
- Page loads ✓
- Stats visible (total, active, resolved, escalated) ✓
- Filter buttons clickable ✓
- Interventions display as cards ✓
- Correct color coding by status ✓

**Pass/Fail:** ___

---

### Test 3.2: Intervention Alert Component

**Objective:** Verify component renders and actions work

**Steps:**
1. Check an intervention card on dashboard
2. Verify color matches status
3. Check risk score visible
4. Test "Acknowledge" button
5. Test "Mark Resolved" button with notes
6. Test "Escalate" button

**Expected Result:**
- Component renders correctly ✓
- Color matches status ✓
- Buttons work and trigger API calls ✓
- Status updates visible in real-time ✓
- Notes saved correctly ✓

**Pass/Fail:** ___

---

### Test 3.3: Filter Functionality

**Objective:** Verify filters work

**Steps:**
1. On admin dashboard, create 5+ interventions with different statuses
2. Click "TRIGGERED" filter
3. Click "ACKNOWLEDGED" filter
4. Click "HIGH-PRIORITY" filter
5. Click "ACTIVE" filter

**Expected Result:**
- TRIGGERED: Shows only triggered interventions ✓
- ACKNOWLEDGED: Shows only acknowledged ✓
- HIGH-PRIORITY: Shows score >= 70 ✓
- ACTIVE: Shows triggered + acknowledged + in-progress ✓

**Pass/Fail:** ___

---

## Test Suite 4: Intervention Workflow

### Test 4.1: Complete Intervention Cycle

**Objective:** Test full intervention lifecycle

**Scenario:**
John is a student with 80% attendance (at-risk)

**Steps:**
1. **Trigger Phase:**
   - Run: `await scanAndTriggerInterventions()`
   - Check: Intervention created with status = 'triggered'
   - ✓

2. **Acknowledge Phase:**
   - Teacher views intervention
   - Clicks "Acknowledge"
   - Check: Status → 'acknowledged'
   - ✓

3. **Action Phase:**
   - Teacher meets with student
   - Student improves attendance
   - Mark attendance as "present" for next 5 sessions
   - ✓

4. **Resolution Phase:**
   - Check new risk score (should be lower)
   - Teacher clicks "Mark Resolved"
   - Adds notes: "Attendance improved, student working with counselor"
   - Check: Status → 'resolved'
   - ✓

**Expected Result:**
- All phases complete successfully ✓
- Status transitions smooth ✓
- Notes saved ✓
- Timestamps recorded ✓

**Pass/Fail:** ___

---

### Test 4.2: Escalation Workflow

**Objective:** Test escalation process

**Scenario:**
Sarah has persistent high absence rate (70%)

**Steps:**
1. **Initial Intervention:**
   - Create intervention: type = 'email-alert', status = 'triggered'
   - ✓

2. **No Improvement:**
   - Mark attendance as still absent
   - Run scan again
   - Should NOT create duplicate (existing active) ✓

3. **Escalate:**
   - Click "Escalate" button
   - Enter reason: "No improvement after 2 weeks"
   - Check: Status → 'escalated'
   - ✓

4. **Verify:**
   - Check Firebase: escalationReason saved
   - Dashboard shows escalation indicator
   - ✓

**Expected Result:**
- No duplicates created ✓
- Escalation process smooth ✓
- Reason captured ✓
- Visual indicator shown ✓

**Pass/Fail:** ___

---

## Test Suite 5: Performance & Scale

### Test 5.1: Bulk Scanning

**Objective:** Test scanning with multiple students

**Setup:**
- Create 20+ test students
- Varied attendance patterns
- Mix of at-risk and not-at-risk

**Steps:**
1. Record start time
2. Run: `await scanAndTriggerInterventions()`
3. Record end time
4. Check results

**Expected Result:**
- Scan completes in < 30 seconds ✓
- Correct count of triggered ✓
- No errors in result.errors ✓
- Performance acceptable ✓

**Metrics:**
- Time elapsed: ___ seconds
- Students scanned: ___
- Interventions triggered: ___
- Errors: ___

**Pass/Fail:** ___

---

### Test 5.2: Dashboard Performance

**Objective:** Dashboard loads and filters quickly with many interventions

**Setup:**
- 50+ interventions in system
- Various statuses and risk levels

**Steps:**
1. Load `/admin/interventions`
2. Test each filter
3. Check dashboard responsiveness

**Expected Result:**
- Initial load < 2 seconds ✓
- Filters respond immediately ✓
- Smooth scrolling ✓
- No UI freezing ✓

**Pass/Fail:** ___

---

## Test Suite 6: Edge Cases

### Test 6.1: No Attendance Data

**Objective:** Handle students with no attendance records

**Steps:**
1. Create a student
2. Don't mark any attendance
3. Run: `await scanAndTriggerInterventions()`
4. Check: Should skip without error

**Expected Result:**
- Scan completes ✓
- result.skipped incremented ✓
- No error thrown ✓

**Pass/Fail:** ___

---

### Test 6.2: Duplicate Intervention Prevention

**Objective:** Don't create duplicate interventions

**Steps:**
1. Create intervention for Student A
2. Don't resolve it
3. Run scan again
4. Check: No new intervention created

**Expected Result:**
- Active intervention found ✓
- New intervention NOT created ✓
- Count remains same ✓

**Pass/Fail:** ___

---

### Test 6.3: Perfect Attendance

**Objective:** Handle perfect attendance students

**Steps:**
1. Create student
2. Mark all attendance as "present"
3. Run scan

**Expected Result:**
- Risk score = 0 ✓
- No intervention triggered ✓
- Skipped count incremented ✓

**Pass/Fail:** ___

---

### Test 6.4: Declining Trend Detection

**Objective:** Detect declining attendance trends

**Steps:**
1. Create student with attendance pattern:
   - Week 1: 80% (2 absences)
   - Week 2: 70% (3 absences)
   - Week 3: 60% (4 absences)
   - Trend: Declining ↓
2. Run scan

**Expected Result:**
- Trend slope detected as negative ✓
- Intervention triggered despite averages ✓
- Reason includes "Declining trend" ✓

**Pass/Fail:** ___

---

## Test Suite 7: Integration Tests

### Test 7.1: Analytics Integration

**Objective:** Verify intervention system uses analytics correctly

**Steps:**
1. Check that `calculateRiskAssessment` is called
2. Verify breakdown data used for intervention trigger
3. Confirm risk levels match badge colors

**Expected Result:**
- Analytics functions called ✓
- Risk calculations correct ✓
- Levels consistent ✓

**Pass/Fail:** ___

---

### Test 7.2: Firebase Integration

**Objective:** Verify Firestore CRUD operations work

**Steps:**
1. Create intervention
2. Query intervention
3. Update intervention
4. Verify changes in Firestore console

**Expected Result:**
- All CRUD operations work ✓
- Data persists ✓
- Timestamps correct ✓

**Pass/Fail:** ___

---

## Summary Report

| Test Suite | Tests | Passed | Failed | Notes |
|-----------|-------|--------|--------|-------|
| 1. Core Logic | 3 | ___ | ___ | |
| 2. Database Ops | 3 | ___ | ___ | |
| 3. UI Components | 3 | ___ | ___ | |
| 4. Workflows | 2 | ___ | ___ | |
| 5. Performance | 2 | ___ | ___ | |
| 6. Edge Cases | 4 | ___ | ___ | |
| 7. Integration | 2 | ___ | ___ | |
| **TOTAL** | **19** | ___ | ___ | |

---

## Issues Found

| ID | Description | Severity | Status |
|----|-------------|----------|--------|
| | | | |
| | | | |

---

## Sign-Off

**Tester Name:** _______________
**Date:** _______________
**Overall Status:** ✅ PASS / ⚠️ CONDITIONAL / ❌ FAIL

**Comments:**

---

*Test Plan Version: 1.0*
*Last Updated: January 15, 2026*
