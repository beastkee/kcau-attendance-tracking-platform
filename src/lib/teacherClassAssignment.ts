/**
 * Teacher Class Assignment Service
 * Automatically assigns teachers to classes based on their expertise and availability
 */

import { User } from '@/types/firebase';
import { Course } from '@/types';

/**
 * Teacher expertise assessment
 */
export interface TeacherExpertise {
  teacherId: string;
  teacherName: string;
  courses: string[]; // Courses they teach
  expertise: string[]; // Subject areas they're qualified for
  qualifications: number; // Number of matching qualifications
}

/**
 * Class assignment configuration
 */
export interface ClassAssignmentConfig {
  preferMatchingCourses?: boolean; // Match by course taught
  maxClassesPerTeacher?: number; // Maximum classes per teacher
  balanceStrategy?: 'expertise-first' | 'load-balanced' | 'availability-first';
  considerStudentCount?: boolean; // Consider number of students in class
  requireExactMatch?: boolean; // Require exact course match
}

/**
 * Result of class assignment
 */
export interface ClassAssignmentResult {
  success: boolean;
  assignmentsCreated: number;
  assignmentsFailed: number;
  details: {
    classId: string;
    className: string;
    courseCode: string;
    previousTeacherId?: string;
    newTeacherId: string;
    newTeacherName: string;
    status: 'success' | 'failed';
    reason?: string;
    matchScore?: number; // 0-100 how well teacher matches class
  }[];
  summary: {
    totalClasses: number;
    totalTeachers: number;
    classesAssigned: number;
    avgClassesPerTeacher: number;
    teacherDistribution: Record<string, number>; // teacherId -> class count
    unassignedClasses: string[]; // Class IDs that couldn't be assigned
  };
}

/**
 * Extract course codes from course names and descriptions
 */
function extractCourseIdentifiers(
  courseName: string,
  courseCode?: string
): string[] {
  const identifiers = new Set<string>();

  // Add course code
  if (courseCode) {
    identifiers.add(courseCode.toUpperCase());
    // Extract subject area (e.g., "CS" from "CS101")
    const match = courseCode.match(/^([A-Z]+)/);
    if (match) {
      identifiers.add(match[1]);
    }
  }

  // Extract from course name
  const nameTokens = courseName.toUpperCase().split(/\s+/);
  nameTokens.forEach(token => {
    // Look for patterns like "CS", "MATH", "ENG"
    if (/^[A-Z]{2,}$/.test(token)) {
      identifiers.add(token);
    }
  });

  return Array.from(identifiers);
}

/**
 * Calculate match score between teacher and class
 */
function calculateMatchScore(
  teacher: User,
  teacherCourses: string[],
  classCode: string,
  className: string,
  studentCount: number,
  config: ClassAssignmentConfig
): number {
  let score = 0;
  const maxScore = 100;

  // 1. Exact course match (40 points)
  const classIdentifiers = extractCourseIdentifiers(className, classCode);
  const teacherIdentifiers = new Set<string>();

  teacherCourses.forEach(course => {
    const courseIdentifiers = extractCourseIdentifiers(course);
    courseIdentifiers.forEach(id => teacherIdentifiers.add(id));
  });

  // Add teacher's department if available
  if (teacher.department) {
    const deptIdentifiers = extractCourseIdentifiers(teacher.department);
    deptIdentifiers.forEach(id => teacherIdentifiers.add(id));
  }

  const matches = classIdentifiers.filter(id =>
    teacherIdentifiers.has(id)
  ).length;

  if (matches > 0) {
    score += (matches / classIdentifiers.length) * 40;
  }

  // 2. Class size consideration (30 points)
  if (config.considerStudentCount) {
    if (studentCount < 20) {
      score += 20; // Small classes preferred
    } else if (studentCount < 40) {
      score += 25; // Medium classes
    } else {
      score += 30; // Large classes
    }
  } else {
    score += 30; // Full points if not considering size
  }

  // 3. Availability/workload bonus (30 points)
  // This is evaluated later based on current assignments
  score += 30;

  return Math.round((score / maxScore) * 100);
}

/**
 * Get teacher's current and past courses
 */
function getTeacherCourses(teacher: User): string[] {
  const courses = new Set<string>();

  // Add courses from department
  if (teacher.department) {
    courses.add(teacher.department);
  }

  // Add courses from courses array
  if (teacher.courses) {
    teacher.courses.forEach(course => courses.add(course));
  }

  return Array.from(courses);
}

/**
 * Find best teacher for a class using specified strategy
 */
function findBestTeacherForClass(
  classItem: Course,
  availableTeachers: User[],
  teacherLoads: Record<string, number>,
  config: ClassAssignmentConfig
): { teacher: User; matchScore: number } | null {
  const candidateScores: Array<{
    teacher: User;
    score: number;
    matchScore: number;
  }> = [];

  for (const teacher of availableTeachers) {
    const teacherCourses = getTeacherCourses(teacher);
    const matchScore = calculateMatchScore(
      teacher,
      teacherCourses,
      classItem.code,
      classItem.name,
      classItem.studentIds?.length || 0,
      config
    );

    // If exact match required and score < threshold, skip
    if (config.requireExactMatch && matchScore < 50) {
      continue;
    }

    let finalScore = matchScore;

    // Apply strategy adjustments
    const currentLoad = teacherLoads[teacher.id!] || 0;
    const maxClasses = config.maxClassesPerTeacher || Infinity;

    // Check capacity
    if (currentLoad >= maxClasses) {
      continue;
    }

    if (config.balanceStrategy === 'load-balanced') {
      // Prefer teachers with fewer classes
      const loadPenalty = (currentLoad / (maxClasses || 5)) * 20;
      finalScore -= loadPenalty;
    } else if (config.balanceStrategy === 'availability-first') {
      // Strongly prefer teachers with less load
      finalScore = finalScore * (1 - currentLoad * 0.15);
    }
    // 'expertise-first' uses matchScore as-is

    candidateScores.push({
      teacher,
      score: finalScore,
      matchScore,
    });
  }

  if (candidateScores.length === 0) {
    return null;
  }

  // Sort by final score (highest first)
  candidateScores.sort((a, b) => b.score - a.score);

  return {
    teacher: candidateScores[0].teacher,
    matchScore: candidateScores[0].matchScore,
  };
}

/**
 * Assign unassigned teachers to classes
 */
export async function assignTeachersToClasses(
  unassignedClasses: Course[],
  availableTeachers: User[],
  allCourses: Course[],
  assignmentCallback: (classId: string, teacherId: string) => Promise<void>,
  config: ClassAssignmentConfig = {}
): Promise<ClassAssignmentResult> {
  const {
    preferMatchingCourses = true,
    maxClassesPerTeacher = Infinity,
    balanceStrategy = 'expertise-first',
    considerStudentCount = true,
    requireExactMatch = false,
  } = config;

  const details: ClassAssignmentResult['details'] = [];
  let assignmentsCreated = 0;
  let assignmentsFailed = 0;

  if (unassignedClasses.length === 0) {
    return {
      success: true,
      assignmentsCreated: 0,
      assignmentsFailed: 0,
      details: [],
      summary: {
        totalClasses: 0,
        totalTeachers: availableTeachers.length,
        classesAssigned: 0,
        avgClassesPerTeacher: 0,
        teacherDistribution: {},
        unassignedClasses: [],
      },
    };
  }

  if (availableTeachers.length === 0) {
    return {
      success: false,
      assignmentsCreated: 0,
      assignmentsFailed: unassignedClasses.length,
      details: unassignedClasses.map(cls => ({
        classId: cls.id!,
        className: cls.name,
        courseCode: cls.code,
        newTeacherId: '',
        newTeacherName: '',
        status: 'failed' as const,
        reason: 'No teachers available',
      })),
      summary: {
        totalClasses: unassignedClasses.length,
        totalTeachers: 0,
        classesAssigned: 0,
        avgClassesPerTeacher: 0,
        teacherDistribution: {},
        unassignedClasses: unassignedClasses.map(c => c.id!),
      },
    };
  }

  // Calculate current teacher loads
  const teacherLoads: Record<string, number> = {};
  availableTeachers.forEach(teacher => {
    teacherLoads[teacher.id!] = 0;
  });

  allCourses.forEach(course => {
    if (course.teacherId) {
      teacherLoads[course.teacherId] = (teacherLoads[course.teacherId] || 0) + 1;
    }
  });

  const unassignedClassIds: string[] = [];

  for (const classItem of unassignedClasses) {
    const best = findBestTeacherForClass(
      classItem,
      availableTeachers,
      teacherLoads,
      {
        preferMatchingCourses,
        maxClassesPerTeacher,
        balanceStrategy,
        considerStudentCount,
        requireExactMatch,
      }
    );

    if (!best || !best.teacher.id) {
      assignmentsFailed++;
      unassignedClassIds.push(classItem.id!);
      details.push({
        classId: classItem.id!,
        className: classItem.name,
        courseCode: classItem.code,
        newTeacherId: '',
        newTeacherName: '',
        status: 'failed' as const,
        reason: 'No suitable teacher found',
      });
      continue;
    }

    try {
      await assignmentCallback(classItem.id!, best.teacher.id);

      // Update load tracking
      teacherLoads[best.teacher.id] = (teacherLoads[best.teacher.id] || 0) + 1;

      assignmentsCreated++;
      details.push({
        classId: classItem.id!,
        className: classItem.name,
        courseCode: classItem.code,
        previousTeacherId: classItem.teacherId,
        newTeacherId: best.teacher.id,
        newTeacherName: best.teacher.name,
        status: 'success' as const,
        matchScore: best.matchScore,
      });
    } catch (error) {
      assignmentsFailed++;
      unassignedClassIds.push(classItem.id!);
      details.push({
        classId: classItem.id!,
        className: classItem.name,
        courseCode: classItem.code,
        newTeacherId: best.teacher.id,
        newTeacherName: best.teacher.name,
        status: 'failed' as const,
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Calculate final distribution
  const finalDistribution: Record<string, number> = {};
  availableTeachers.forEach(teacher => {
    finalDistribution[teacher.id!] = teacherLoads[teacher.id!] || 0;
  });

  const totalClassesAssigned = Object.values(finalDistribution).reduce((sum, count) => sum + count, 0);
  const avgClassesPerTeacher = availableTeachers.length > 0 ? totalClassesAssigned / availableTeachers.length : 0;

  return {
    success: assignmentsFailed === 0,
    assignmentsCreated,
    assignmentsFailed,
    details,
    summary: {
      totalClasses: unassignedClasses.length,
      totalTeachers: availableTeachers.length,
      classesAssigned: assignmentsCreated,
      avgClassesPerTeacher: Math.round(avgClassesPerTeacher * 100) / 100,
      teacherDistribution: finalDistribution,
      unassignedClasses: unassignedClassIds,
    },
  };
}

/**
 * Rebalance teacher-to-class assignments
 * Redistributes classes to achieve better balance
 */
export async function rebalanceTeacherAssignments(
  allCourses: Course[],
  teachers: User[],
  rebalanceCallback: (classId: string, newTeacherId: string) => Promise<void>,
  config: ClassAssignmentConfig = {}
): Promise<ClassAssignmentResult> {
  // Find classes with heavily loaded teachers
  const teacherLoads: Record<string, Course[]> = {};

  teachers.forEach(teacher => {
    teacherLoads[teacher.id!] = [];
  });

  allCourses.forEach(course => {
    if (course.teacherId) {
      if (!teacherLoads[course.teacherId]) {
        teacherLoads[course.teacherId] = [];
      }
      teacherLoads[course.teacherId].push(course);
    }
  });

  // Identify overloaded teachers (top 20%)
  const avgLoad = allCourses.length / teachers.length;
  const overloadedTeachers = Object.entries(teacherLoads)
    .filter(([_, courses]) => courses.length > avgLoad * 1.2)
    .map(([teacherId, _]) => teacherId);

  if (overloadedTeachers.length === 0) {
    return {
      success: true,
      assignmentsCreated: 0,
      assignmentsFailed: 0,
      details: [],
      summary: {
        totalClasses: allCourses.length,
        totalTeachers: teachers.length,
        classesAssigned: 0,
        avgClassesPerTeacher: avgLoad,
        teacherDistribution: Object.fromEntries(
          Object.entries(teacherLoads).map(([id, courses]) => [id, courses.length])
        ),
        unassignedClasses: [],
      },
    };
  }

  // Move one class from each overloaded teacher
  const classesToReassign: Course[] = [];
  for (const teacherId of overloadedTeachers) {
    const courses = teacherLoads[teacherId];
    if (courses.length > 0) {
      // Select the last class (arbitrary choice)
      classesToReassign.push(courses[courses.length - 1]);
    }
  }

  // Reassign these classes
  const details: ClassAssignmentResult['details'] = [];
  let assignmentsCreated = 0;
  let assignmentsFailed = 0;

  for (const classItem of classesToReassign) {
    const underloadedTeachers = teachers.filter(
      t => (teacherLoads[t.id!]?.length || 0) < avgLoad * 0.8
    );

    if (underloadedTeachers.length === 0) {
      assignmentsFailed++;
      details.push({
        classId: classItem.id!,
        className: classItem.name,
        courseCode: classItem.code,
        previousTeacherId: classItem.teacherId,
        newTeacherId: '',
        newTeacherName: '',
        status: 'failed' as const,
        reason: 'No underloaded teachers available',
      });
      continue;
    }

    const bestTeacher = underloadedTeachers[0]; // Prefer first available

    try {
      await rebalanceCallback(classItem.id!, bestTeacher.id!);

      // Update load tracking
      const oldTeacherId = classItem.teacherId;
      if (oldTeacherId) {
        teacherLoads[oldTeacherId] = teacherLoads[oldTeacherId].filter(
          c => c.id !== classItem.id
        );
      }
      teacherLoads[bestTeacher.id!] = [...(teacherLoads[bestTeacher.id!] || []), classItem];

      assignmentsCreated++;
      details.push({
        classId: classItem.id!,
        className: classItem.name,
        courseCode: classItem.code,
        previousTeacherId: classItem.teacherId,
        newTeacherId: bestTeacher.id!,
        newTeacherName: bestTeacher.name,
        status: 'success' as const,
      });
    } catch (error) {
      assignmentsFailed++;
      details.push({
        classId: classItem.id!,
        className: classItem.name,
        courseCode: classItem.code,
        previousTeacherId: classItem.teacherId,
        newTeacherId: bestTeacher.id!,
        newTeacherName: bestTeacher.name,
        status: 'failed' as const,
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Calculate final distribution
  const finalDistribution: Record<string, number> = {};
  Object.entries(teacherLoads).forEach(([teacherId, courses]) => {
    finalDistribution[teacherId] = courses.length;
  });

  const totalClasses = Object.values(finalDistribution).reduce((sum, count) => sum + count, 0);
  const avgClassesPerTeacher = teachers.length > 0 ? totalClasses / teachers.length : 0;

  return {
    success: assignmentsFailed === 0,
    assignmentsCreated,
    assignmentsFailed,
    details,
    summary: {
      totalClasses: allCourses.length,
      totalTeachers: teachers.length,
      classesAssigned: assignmentsCreated,
      avgClassesPerTeacher: Math.round(avgClassesPerTeacher * 100) / 100,
      teacherDistribution: finalDistribution,
      unassignedClasses: [],
    },
  };
}

/**
 * Get teacher assignment statistics
 */
export function getTeacherAssignmentStatistics(
  courses: Course[],
  teachers: User[]
): {
  totalCourses: number;
  assignedCourses: number;
  unassignedCourses: number;
  totalTeachers: number;
  teacherLoads: Record<string, number>;
  avgCoursesPerTeacher: number;
  loadBalance: number; // 0-1, where 1 is perfectly balanced
  overloadedTeachers: string[]; // Teachers with > average load
  underutilizedTeachers: string[]; // Teachers with < average load
} {
  const teacherLoads: Record<string, number> = {};

  teachers.forEach(teacher => {
    teacherLoads[teacher.id!] = 0;
  });

  const assignedCourses = new Set<string>();

  courses.forEach(course => {
    if (course.teacherId) {
      teacherLoads[course.teacherId] = (teacherLoads[course.teacherId] || 0) + 1;
      assignedCourses.add(course.id!);
    }
  });

  const totalCourses = courses.length;
  const unassignedCourses = totalCourses - assignedCourses.size;
  const avgLoad = totalCourses / teachers.length;

  // Calculate load balance (standard deviation)
  const loads = Object.values(teacherLoads);
  const sumSquaredDiff = loads.reduce((sum, load) => sum + Math.pow(load - avgLoad, 2), 0);
  const variance = sumSquaredDiff / teachers.length;
  const stdDeviation = Math.sqrt(variance);
  const maxDeviation = totalCourses;
  const loadBalance = maxDeviation > 0 ? Math.min(1, stdDeviation / maxDeviation) : 0;

  const overloadedTeachers = Object.entries(teacherLoads)
    .filter(([_, load]) => load > avgLoad * 1.2)
    .map(([teacherId, _]) => teacherId);

  const underutilizedTeachers = Object.entries(teacherLoads)
    .filter(([_, load]) => load < avgLoad * 0.8)
    .map(([teacherId, _]) => teacherId);

  return {
    totalCourses,
    assignedCourses: assignedCourses.size,
    unassignedCourses,
    totalTeachers: teachers.length,
    teacherLoads,
    avgCoursesPerTeacher: Math.round(avgLoad * 100) / 100,
    loadBalance: Math.round(loadBalance * 100) / 100,
    overloadedTeachers,
    underutilizedTeachers,
  };
}
