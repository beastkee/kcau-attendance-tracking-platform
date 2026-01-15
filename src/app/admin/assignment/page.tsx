"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  getUsersByRole,
  getAllCourses,
  enrollStudent,
  unenrollStudent,
} from "@/lib/firebaseServices";
import { User } from "@/types/firebase";
import { Course } from "@/types";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { Card, StatCard } from "@/components/ui/Card";
import {
  assignStudentsToTeachers,
  distributeStudentsAcrossCourses,
  getAssignmentStatistics,
  AssignmentResult,
} from "@/lib/studentAssignment";

const adminSidebarItems = [
  { name: "Intelligence Hub", href: "/admin", icon: "📊" },
  { name: "Students", href: "/admin/students", icon: "👥" },
  { name: "Teachers", href: "/admin/teachers", icon: "👨‍🏫" },
  { name: "Classes", href: "/admin/classes", icon: "🏫" },
  { name: "Auto-Assign Students", href: "/admin/assignment", icon: "⚙️" },
  { name: "Analytics", href: "/admin/analytics", icon: "📈" },
  { name: "Predictive Reports", href: "/admin/reports", icon: "🎯" },
];

export default function StudentAssignmentPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<User[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<User[]>([]);
  const [assignmentResult, setAssignmentResult] = useState<AssignmentResult | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignmentStrategy, setAssignmentStrategy] = useState<"least-loaded" | "round-robin">(
    "least-loaded"
  );
  const [assignmentMethod, setAssignmentMethod] = useState<"direct" | "courses">("courses");
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  const stats = getAssignmentStatistics(students, teachers, courses);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        setCurrentUser(user);
        loadData();
      } else {
        setIsAuthenticated(false);
        router.push("/admin");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const loadData = async () => {
    try {
      const [studentsData, teachersData, coursesData] = await Promise.all([
        getUsersByRole("student"),
        getUsersByRole("teacher"),
        getAllCourses(),
      ]);

      setStudents(studentsData);
      setTeachers(teachersData);
      setCourses(coursesData);

      // Find unassigned students
      const assignedStudentIds = new Set<string>();
      coursesData.forEach((course) => {
        course.studentIds?.forEach((id) => assignedStudentIds.add(id));
      });

      const unassigned = studentsData.filter((student) => !assignedStudentIds.has(student.id!));
      setUnassignedStudents(unassigned);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  const handleAssignStudents = async () => {
    if (unassignedStudents.length === 0) {
      alert("No unassigned students to distribute");
      return;
    }

    setIsAssigning(true);
    try {
      let result: AssignmentResult;

      if (assignmentMethod === "direct") {
        // Direct assignment to teachers (not implemented in current system)
        result = await assignStudentsToTeachers(
          unassignedStudents,
          teachers,
          courses,
          async (studentId: string, teacherId: string) => {
            // In a real system, you'd update teacher-student relationship
            console.log(`Assigned student ${studentId} to teacher ${teacherId}`);
          },
          { balanceStrategy: assignmentStrategy }
        );
      } else {
        // Assignment through course enrollment
        result = await distributeStudentsAcrossCourses(
          unassignedStudents,
          courses.filter((c) => c.studentIds && c.studentIds.length >= 0), // All courses
          async (studentId: string, courseId: string) => {
            await enrollStudent(courseId, studentId);
          },
          { balanceStrategy: assignmentStrategy }
        );
      }

      setAssignmentResult(result);
      setShowResultsModal(true);
      await loadData(); // Reload to reflect changes
    } catch (error) {
      console.error("Assignment failed:", error);
      alert("Failed to assign students. See console for details.");
    } finally {
      setIsAssigning(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        title="Auto-Assign Students"
        userRole="admin"
        userName={currentUser?.displayName || "Admin"}
        sidebarItems={adminSidebarItems}
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout
      title="Auto-Assign Students"
      userRole="admin"
      userName={currentUser?.displayName || "Admin"}
      sidebarItems={adminSidebarItems}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Auto-Assign Students</h1>
          <p className="text-gray-600">
            Automatically distribute students to teachers with even load balancing
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <StatCard
            title="Total Students"
            value={stats.totalStudents.toString()}
            icon="👥"
            color="blue"
          />
          <StatCard
            title="Assigned"
            value={stats.assignedStudents.toString()}
            icon="✅"
            color="green"
          />
          <StatCard
            title="Unassigned"
            value={stats.unassignedStudents.toString()}
            icon="⚠️"
            color="yellow"
          />
          <StatCard
            title="Total Teachers"
            value={stats.totalTeachers.toString()}
            icon="👨‍🏫"
            color="purple"
          />
          <StatCard
            title="Avg Per Teacher"
            value={stats.avgStudentsPerTeacher.toFixed(1)}
            icon="📊"
            color="blue"
          />
        </div>

        {/* Assignment Configuration */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment Configuration</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment Strategy
                </label>
                <select
                  value={assignmentStrategy}
                  onChange={(e) => setAssignmentStrategy(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isAssigning}
                >
                  <option value="least-loaded">
                    Least-Loaded (Balance by current load)
                  </option>
                  <option value="round-robin">Round-Robin (Distribute evenly)</option>
                </select>
                <p className="text-xs text-gray-600 mt-2">
                  {assignmentStrategy === "least-loaded"
                    ? "Assigns students to the teacher with fewest current students"
                    : "Distributes students evenly in a rotating pattern"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment Method
                </label>
                <select
                  value={assignmentMethod}
                  onChange={(e) => setAssignmentMethod(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isAssigning}
                >
                  <option value="courses">Through Courses (Recommended)</option>
                  <option value="direct">Direct to Teachers</option>
                </select>
                <p className="text-xs text-gray-600 mt-2">
                  {assignmentMethod === "courses"
                    ? "Assigns students to available courses"
                    : "Assigns students directly to teacher advisors"}
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Preview:</strong> This will assign{" "}
                <strong>{unassignedStudents.length} unassigned students</strong> across{" "}
                <strong>{stats.totalTeachers} teachers</strong> using <strong>{assignmentStrategy}</strong> strategy.
              </p>
            </div>

            <button
              onClick={handleAssignStudents}
              disabled={isAssigning || unassignedStudents.length === 0 || stats.totalTeachers === 0}
              className="mt-6 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isAssigning ? "Assigning..." : "Start Assignment"}
            </button>
          </div>
        </Card>

        {/* Current Load Distribution */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Load Distribution</h3>
            <p className="text-sm text-gray-600 mb-4">
              Load Balance Score: <strong>{stats.loadBalance.toFixed(2)}</strong> (0 = perfect,
              1 = unbalanced)
            </p>

            {stats.totalTeachers === 0 ? (
              <p className="text-gray-600 text-center py-8">No teachers available</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(stats.teacherLoadDistribution).map(([teacherId, studentCount]) => {
                  const teacher = teachers.find((t) => t.id === teacherId);
                  const percentage = Math.round(
                    (studentCount / (stats.totalStudents || 1)) * 100
                  );

                  return (
                    <div key={teacherId}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {teacher?.displayName || teacher?.email || "Unknown"}
                        </span>
                        <span className="text-sm text-gray-600">
                          {studentCount} student{studentCount !== 1 ? "s" : ""} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Unassigned Students List */}
        {unassignedStudents.length > 0 && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Unassigned Students ({unassignedStudents.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unassignedStudents.slice(0, 10).map((student) => (
                      <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {student.displayName || "Unknown"}
                        </td>
                        <td className="py-3 px-4 text-gray-600">{student.email}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending Assignment
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {unassignedStudents.length > 10 && (
                <p className="text-xs text-gray-600 mt-4 text-center">
                  Showing 10 of {unassignedStudents.length} unassigned students
                </p>
              )}
            </div>
          </Card>
        )}

        {/* Assignment Results Modal */}
        {showResultsModal && assignmentResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card>
              <div className="p-6 max-w-2xl max-h-[80vh] overflow-y-auto">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Assignment Results</h3>
                  <div className="flex gap-4 mt-4">
                    <div className="bg-green-50 p-3 rounded-lg flex-1">
                      <p className="text-green-700 text-sm">Successful</p>
                      <p className="text-2xl font-bold text-green-900">
                        {assignmentResult.assignmentsCreated}
                      </p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg flex-1">
                      <p className="text-red-700 text-sm">Failed</p>
                      <p className="text-2xl font-bold text-red-900">{assignmentResult.assignmentsFailed}</p>
                    </div>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Summary</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Total Students</p>
                      <p className="font-semibold text-gray-900">{assignmentResult.summary.totalStudents}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Teachers</p>
                      <p className="font-semibold text-gray-900">{assignmentResult.summary.totalTeachers}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Avg Per Teacher</p>
                      <p className="font-semibold text-gray-900">
                        {assignmentResult.summary.avgStudentsPerTeacher}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Distribution</p>
                      <p className="font-semibold text-gray-900">
                        {Object.keys(assignmentResult.summary.distribution).length} teachers
                      </p>
                    </div>
                  </div>
                </div>

                {/* Distribution by Teacher */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Distribution by Teacher</h4>
                  <div className="space-y-2">
                    {Object.entries(assignmentResult.summary.distribution).map(([teacherId, count]) => {
                      const teacher = teachers.find((t) => t.id === teacherId);
                      return (
                        <div key={teacherId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{teacher?.displayName || teacherId}</span>
                          <span className="font-semibold">{count} students</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Detailed Results */}
                {assignmentResult.details.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Assignment Details</h4>
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-2 font-semibold text-gray-900">
                              Student
                            </th>
                            <th className="text-left py-2 px-2 font-semibold text-gray-900">
                              Teacher
                            </th>
                            <th className="text-left py-2 px-2 font-semibold text-gray-900">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {assignmentResult.details.map((detail, idx) => (
                            <tr key={idx} className="border-b border-gray-100">
                              <td className="py-2 px-2 text-gray-900">{detail.studentName}</td>
                              <td className="py-2 px-2 text-gray-600">{detail.teacherName || "-"}</td>
                              <td className="py-2 px-2">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                                    detail.status === "success"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {detail.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setShowResultsModal(false)}
                  className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
