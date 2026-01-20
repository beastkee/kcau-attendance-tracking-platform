/**
 * Student Assignment Service
 * Handles automatic distribution of students to teachers with even load balancing
 */

import { User } from '@/types/firebase';
import { Course } from '@/types';

/**
 * Assignment strategy configuration
 */
export interface AssignmentConfig {
  maxStudentsPerTeacher?: number;
  balanceStrategy?: 'round-robin' | 'least-loaded';
  excludeUnassignedTeachers?: boolean;
}

/**
 * Result of assignment operation
 */
export interface AssignmentResult {
  success: boolean;
  assignmentsCreated: number;
  assignmentsFailed: number;
  details: {
    studentId: string;
    studentName: string;
    teacherId: string;
    teacherName: string;
    status: 'success' | 'failed';
    reason?: string;
  }[];
  summary: {
    totalStudents: number;
    totalTeachers: number;
    avgStudentsPerTeacher: number;
    distribution: Record<string, number>; // teacherId -> student count
  };
}

/**
 * Calculate the current student load per teacher
 */
export function calculateTeacherLoadDistribution(
  courses: Course[]
): Record<string, number> {
  const distribution: Record<string, number> = {};

  courses.forEach(course => {
    if (course.teacherId) {
      if (!distribution[course.teacherId]) {
        distribution[course.teacherId] = 0;
      }
      distribution[course.teacherId] += course.studentIds?.length || 0;
    }
  });

  return distribution;
}

/**
 * Find the teacher(s) with the least assigned students
 */
export function findLeastLoadedTeachers(
  teachers: User[],
  courses: Course[]
): User[] {
  const distribution = calculateTeacherLoadDistribution(courses);

  let minLoad = Infinity;
  let leastLoaded: User[] = [];

  teachers.forEach(teacher => {
    const load = distribution[teacher.id!] || 0;
    if (load < minLoad) {
      minLoad = load;
      leastLoaded = [teacher];
    } else if (load === minLoad) {
      leastLoaded.push(teacher);
    }
  });

  return leastLoaded;
}

/**
 * Assign unassigned students to teachers using least-loaded strategy
 * This assigns students directly to teachers (not through courses)
 */
export async function assignStudentsToTeachers(
  unassignedStudents: User[],
  allTeachers: User[],
  courses: Course[],
  assignmentCallback: (studentId: string, teacherId: string) => Promise<void>,
  config: AssignmentConfig = {}
): Promise<AssignmentResult> {
  const {
    maxStudentsPerTeacher = Infinity,
    balanceStrategy = 'least-loaded',
    excludeUnassignedTeachers = false,
  } = config;

  const details: AssignmentResult['details'] = [];
  let assignmentsCreated = 0;
  let assignmentsFailed = 0;

  if (unassignedStudents.length === 0) {
    return {
      success: true,
      assignmentsCreated: 0,
      assignmentsFailed: 0,
      details: [],
      summary: {
        totalStudents: 0,
        totalTeachers: allTeachers.length,
        avgStudentsPerTeacher: 0,
        distribution: calculateTeacherLoadDistribution(courses),
      },
    };
  }

  if (allTeachers.length === 0) {
    return {
      success: false,
      assignmentsCreated: 0,
      assignmentsFailed: unassignedStudents.length,
      details: unassignedStudents.map(student => ({
        studentId: student.id!,
        studentName: student.name || student.email,
        teacherId: '',
        teacherName: '',
        status: 'failed' as const,
        reason: 'No teachers available',
      })),
      summary: {
        totalStudents: unassignedStudents.length,
        totalTeachers: 0,
        avgStudentsPerTeacher: 0,
        distribution: {},
      },
    };
  }

  const distribution = calculateTeacherLoadDistribution(courses);
  let teacherIndex = 0;

  for (const student of unassignedStudents) {
    let assignedTeacher: User | null = null;

    if (balanceStrategy === 'least-loaded') {
      // Find the teacher with the least students
      const leastLoaded = findLeastLoadedTeachers(
        allTeachers,
        courses
      );

      // Filter by max capacity if configured
      const available = leastLoaded.filter(
        teacher => (distribution[teacher.id!] || 0) < maxStudentsPerTeacher
      );

      assignedTeacher = available.length > 0 ? available[0] : leastLoaded[0];
    } else {
      // Round-robin strategy
      const availableTeachers = allTeachers.filter(
        teacher => (distribution[teacher.id!] || 0) < maxStudentsPerTeacher
      );

      if (availableTeachers.length > 0) {
        assignedTeacher = availableTeachers[teacherIndex % availableTeachers.length];
        teacherIndex++;
      } else {
        assignedTeacher = allTeachers[teacherIndex % allTeachers.length];
        teacherIndex++;
      }
    }

    if (!assignedTeacher || !assignedTeacher.id) {
      assignmentsFailed++;
      details.push({
        studentId: student.id!,
        studentName: student.name || student.email,
        teacherId: '',
        teacherName: '',
        status: 'failed' as const,
        reason: 'No suitable teacher found',
      });
      continue;
    }

    try {
      // Call the assignment callback (e.g., update Firestore)
      await assignmentCallback(student.id!, assignedTeacher.id);

      // Update distribution tracking
      distribution[assignedTeacher.id] = (distribution[assignedTeacher.id] || 0) + 1;

      assignmentsCreated++;
      details.push({
        studentId: student.id!,
        studentName: student.name || student.email,
        teacherId: assignedTeacher.id,
        teacherName: assignedTeacher.name || assignedTeacher.email,
        status: 'success' as const,
      });
    } catch (error) {
      assignmentsFailed++;
      details.push({
        studentId: student.id!,
        studentName: student.name || student.email,
        teacherId: assignedTeacher.id,
        teacherName: assignedTeacher.name || assignedTeacher.email,
        status: 'failed' as const,
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  const totalStudents = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  const avgStudentsPerTeacher = allTeachers.length > 0 ? totalStudents / allTeachers.length : 0;

  return {
    success: assignmentsFailed === 0,
    assignmentsCreated,
    assignmentsFailed,
    details,
    summary: {
      totalStudents,
      totalTeachers: allTeachers.length,
      avgStudentsPerTeacher: Math.round(avgStudentsPerTeacher * 100) / 100,
      distribution,
    },
  };
}

/**
 * Distribute students across existing courses to balance teacher workload
 * This assigns students to courses (which are managed by teachers)
 */
export async function distributeStudentsAcrossCourses(
  unassignedStudents: User[],
  availableCourses: Course[],
  enrollCallback: (studentId: string, courseId: string) => Promise<void>,
  config: AssignmentConfig = {}
): Promise<AssignmentResult> {
  const { maxStudentsPerTeacher = Infinity, balanceStrategy = 'least-loaded' } = config;

  const details: AssignmentResult['details'] = [];
  let assignmentsCreated = 0;
  let assignmentsFailed = 0;

  if (unassignedStudents.length === 0 || availableCourses.length === 0) {
    return {
      success: true,
      assignmentsCreated: 0,
      assignmentsFailed: 0,
      details: [],
      summary: {
        totalStudents: 0,
        totalTeachers: new Set(availableCourses.map(c => c.teacherId)).size,
        avgStudentsPerTeacher: 0,
        distribution: calculateTeacherLoadDistribution(availableCourses),
      },
    };
  }

  const courseDistribution = new Map<string, number>();
  availableCourses.forEach(course => {
    courseDistribution.set(course.id!, course.studentIds?.length || 0);
  });

  let courseIndex = 0;

  for (const student of unassignedStudents) {
    let selectedCourse: Course | null = null;

    if (balanceStrategy === 'least-loaded') {
      // Find course with least students
      let minStudents = Infinity;
      let leastLoadedCourse: Course | null = null;

      for (const course of availableCourses) {
        const currentCount = courseDistribution.get(course.id!) || 0;
        if (currentCount < minStudents && currentCount < maxStudentsPerTeacher) {
          minStudents = currentCount;
          leastLoadedCourse = course;
        }
      }

      selectedCourse = leastLoadedCourse || availableCourses[0];
    } else {
      // Round-robin across courses
      selectedCourse = availableCourses[courseIndex % availableCourses.length];
      courseIndex++;
    }

    if (!selectedCourse || !selectedCourse.id) {
      assignmentsFailed++;
      details.push({
        studentId: student.id!,
        studentName: student.name || student.email,
        teacherId: selectedCourse?.teacherId || '',
        teacherName: '',
        status: 'failed' as const,
        reason: 'No suitable course found',
      });
      continue;
    }

    try {
      await enrollCallback(student.id!, selectedCourse.id);

      courseDistribution.set(
        selectedCourse.id,
        (courseDistribution.get(selectedCourse.id) || 0) + 1
      );

      assignmentsCreated++;
      details.push({
        studentId: student.id!,
        studentName: student.name || student.email,
        teacherId: selectedCourse.teacherId,
        teacherName: '',
        status: 'success' as const,
      });
    } catch (error) {
      assignmentsFailed++;
      details.push({
        studentId: student.id!,
        studentName: student.name || student.email,
        teacherId: selectedCourse.teacherId,
        teacherName: '',
        status: 'failed' as const,
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Calculate final distribution by teacher
  const teacherDistribution: Record<string, number> = {};
  availableCourses.forEach(course => {
    const count = courseDistribution.get(course.id!) || 0;
    if (course.teacherId) {
      teacherDistribution[course.teacherId] = (teacherDistribution[course.teacherId] || 0) + count;
    }
  });

  const totalStudents = Object.values(teacherDistribution).reduce((sum, count) => sum + count, 0);
  const uniqueTeachers = new Set(availableCourses.map(c => c.teacherId)).size;
  const avgStudentsPerTeacher = uniqueTeachers > 0 ? totalStudents / uniqueTeachers : 0;

  return {
    success: assignmentsFailed === 0,
    assignmentsCreated,
    assignmentsFailed,
    details,
    summary: {
      totalStudents,
      totalTeachers: uniqueTeachers,
      avgStudentsPerTeacher: Math.round(avgStudentsPerTeacher * 100) / 100,
      distribution: teacherDistribution,
    },
  };
}

/**
 * Get statistics about current assignment status
 */
export function getAssignmentStatistics(
  students: User[],
  teachers: User[],
  courses: Course[]
): {
  totalStudents: number;
  assignedStudents: number;
  unassignedStudents: number;
  totalTeachers: number;
  teacherLoadDistribution: Record<string, number>;
  avgStudentsPerTeacher: number;
  loadBalance: number; // 0-1, where 1 is perfectly balanced
} {
  const distribution = calculateTeacherLoadDistribution(courses);

  const allStudentIds = new Set<string>();
  courses.forEach(course => {
    course.studentIds?.forEach(id => allStudentIds.add(id));
  });

  const assignedStudents = allStudentIds.size;
  const unassignedStudents = students.length - assignedStudents;
  const totalTeachers = teachers.length;
  const totalStudents = students.length;

  const loads = Object.values(distribution);
  const avgLoad = totalTeachers > 0 ? totalStudents / totalTeachers : 0;

  // Calculate load balance (standard deviation from mean)
  let sumSquaredDiff = 0;
  loads.forEach(load => {
    sumSquaredDiff += Math.pow(load - avgLoad, 2);
  });

  const variance = totalTeachers > 0 ? sumSquaredDiff / totalTeachers : 0;
  const stdDeviation = Math.sqrt(variance);

  // Normalize to 0-1 scale (0 = perfectly balanced, 1 = very unbalanced)
  // Using max possible deviation as reference
  const maxDeviation = totalStudents;
  const loadBalance = maxDeviation > 0 ? Math.min(1, stdDeviation / maxDeviation) : 0;

  return {
    totalStudents,
    assignedStudents,
    unassignedStudents,
    totalTeachers,
    teacherLoadDistribution: distribution,
    avgStudentsPerTeacher: Math.round(avgLoad * 100) / 100,
    loadBalance: Math.round(loadBalance * 100) / 100,
  };
}
