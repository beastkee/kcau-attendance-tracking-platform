"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  getUsersByRole,
  getAllCourses,
  updateCourse,
} from "@/lib/firebaseServices";
import { User } from "@/types/firebase";
import { Course } from "@/types";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { Card, StatCard } from "@/components/ui/Card";
import {
  assignTeachersToClasses,
  rebalanceTeacherAssignments,
  getTeacherAssignmentStatistics,
  ClassAssignmentResult,
} from "@/lib/teacherClassAssignment";

const adminSidebarItems = [
  { name: "Intelligence Hub", href: "/admin", icon: "📊" },
  { name: "Students", href: "/admin/students", icon: "👥" },
  { name: "Teachers", href: "/admin/teachers", icon: "👨‍🏫" },
  { name: "Classes", href: "/admin/classes", icon: "🏫" },
  { name: "Auto-Assign Students", href: "/admin/assignment", icon: "⚙️" },
  { name: "Assign Teachers to Classes", href: "/admin/teacher-assignment", icon: "🎓" },
  { name: "Analytics", href: "/admin/analytics", icon: "📈" },
  { name: "Predictive Reports", href: "/admin/reports", icon: "🎯" },
];

export default function TeacherAssignmentPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [unassignedClasses, setUnassignedClasses] = useState<Course[]>([]);
  const [assignmentResult, setAssignmentResult] = useState<ClassAssignmentResult | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [assignmentStrategy, setAssignmentStrategy] = useState<
    "expertise-first" | "load-balanced" | "availability-first"
  >("expertise-first");
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ uid: string } | null>(null);
  const router = useRouter();

  const stats = getTeacherAssignmentStatistics(courses, teachers);

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
      const [teachersData, coursesData] = await Promise.all([
        getUsersByRole("teacher"),
        getAllCourses(),
      ]);

      setTeachers(teachersData);
      setCourses(coursesData);

      // Find unassigned classes
      const unassigned = coursesData.filter(
        (course) => !course.teacherId || course.teacherId === ""
      );
      setUnassignedClasses(unassigned);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  const handleAssignTeachers = async () => {
    if (unassignedClasses.length === 0) {
      alert("No unassigned classes to assign");
      return;
    }

    setIsAssigning(true);
    try {
      const result = await assignTeachersToClasses(
        unassignedClasses,
        teachers,
        courses,
        async (classId: string, teacherId: string) => {
          await updateCourse(classId, { teacherId });
        },
        {
          balanceStrategy: assignmentStrategy,
          preferMatchingCourses: true,
          considerStudentCount: true,
        }
      );

      setAssignmentResult(result);
      setShowResultsModal(true);
      await loadData(); // Reload to reflect changes
    } catch (error) {
      console.error("Assignment failed:", error);
      alert("Failed to assign teachers. See console for details.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRebalance = async () => {
    setIsRebalancing(true);
    try {
      const result = await rebalanceTeacherAssignments(
        courses,
        teachers,
        async (classId: string, newTeacherId: string) => {
          await updateCourse(classId, { teacherId: newTeacherId });
        }
      );

      setAssignmentResult(result);
      setShowResultsModal(true);
      await loadData(); // Reload to reflect changes
    } catch (error) {
      console.error("Rebalancing failed:", error);
      alert("Failed to rebalance. See console for details.");
    } finally {
      setIsRebalancing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        title="Assign Teachers to Classes"
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
      title="Assign Teachers to Classes"
      userRole="admin"
      userName={currentUser?.displayName || "Admin"}
      sidebarItems={adminSidebarItems}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assign Teachers to Classes</h1>
          <p className="text-gray-600">
            Automatically assign teachers to classes based on expertise and availability
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <StatCard
            title="Total Classes"
            value={stats.totalCourses.toString()}
            icon="🏫"
            color="blue"
          />
          <StatCard
            title="Assigned"
            value={stats.assignedCourses.toString()}
            icon="✅"
            color="green"
          />
          <StatCard
            title="Unassigned"
            value={stats.unassignedCourses.toString()}
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
            title="Avg Classes"
            value={stats.avgCoursesPerTeacher.toFixed(1)}
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
                  onChange={(e) =>
                    setAssignmentStrategy(
                      e.target.value as "expertise-first" | "load-balanced" | "availability-first"
                    )
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isAssigning || isRebalancing}
                >
                  <option value="expertise-first">
                    Expertise First (Match courses)
                  </option>
                  <option value="load-balanced">Load Balanced (Even distribution)</option>
                  <option value="availability-first">Availability First (Least busy)</option>
                </select>
                <p className="text-xs text-gray-600 mt-2">
                  {assignmentStrategy === "expertise-first"
                    ? "Matches teachers to classes based on their expertise and courses taught"
                    : assignmentStrategy === "load-balanced"
                      ? "Distributes classes evenly across teachers"
                      : "Assigns to teachers with fewest current classes"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  System Status
                </label>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">
                    Balance Score: <strong>{(stats.loadBalance * 100).toFixed(0)}%</strong>
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    0% = Perfect balance, 100% = Very unbalanced
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Preview:</strong> This will assign{" "}
                <strong>{unassignedClasses.length} unassigned classes</strong> to{" "}
                <strong>{stats.totalTeachers} available teachers</strong> using{" "}
                <strong>{assignmentStrategy.replace("-", " ")}</strong> strategy.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleAssignTeachers}
                disabled={
                  isAssigning || isRebalancing || unassignedClasses.length === 0 || stats.totalTeachers === 0
                }
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isAssigning ? "Assigning..." : "Assign Unassigned Classes"}
              </button>

              <button
                onClick={handleRebalance}
                disabled={isAssigning || isRebalancing || stats.totalCourses === 0}
                className="px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isRebalancing ? "Rebalancing..." : "Rebalance All Classes"}
              </button>
            </div>
          </div>
        </Card>

        {/* Current Load Distribution */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Load Distribution</h3>
            {stats.totalTeachers === 0 ? (
              <p className="text-gray-600 text-center py-8">No teachers available</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(stats.teacherLoads).map(([teacherId, classCount]) => {
                  const teacher = teachers.find((t) => t.id === teacherId);
                  const percentage = Math.round(
                    (classCount / (stats.totalCourses || 1)) * 100
                  );
                  const isOverloaded = stats.overloadedTeachers.includes(teacherId);
                  const isUnderutilized = stats.underutilizedTeachers.includes(teacherId);

                  return (
                    <div key={teacherId}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {teacher?.name || "Unknown"}
                          {isOverloaded && <span className="text-red-600 ml-2">⚠️ Overloaded</span>}
                          {isUnderutilized && <span className="text-orange-600 ml-2">🔶 Underutilized</span>}
                        </span>
                        <span className="text-sm text-gray-600">
                          {classCount} class{classCount !== 1 ? "es" : ""} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            isOverloaded ? 'bg-red-500' : isUnderutilized ? 'bg-orange-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.max(percentage, 5)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Unassigned Classes List */}
        {unassignedClasses.length > 0 && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Unassigned Classes ({unassignedClasses.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Class Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Code</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Students</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unassignedClasses.slice(0, 10).map((cls) => (
                      <tr key={cls.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{cls.name}</td>
                        <td className="py-3 px-4 text-gray-600">{cls.code}</td>
                        <td className="py-3 px-4 text-gray-600">
                          {cls.studentIds?.length || 0} students
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            No Teacher
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {unassignedClasses.length > 10 && (
                <p className="text-xs text-gray-600 mt-4 text-center">
                  Showing 10 of {unassignedClasses.length} unassigned classes
                </p>
              )}
            </div>
          </Card>
        )}

        {/* Assignment Results Modal */}
        {showResultsModal && assignmentResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card>
              <div className="p-6 max-w-3xl max-h-[80vh] overflow-y-auto">
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
                      <p className="text-2xl font-bold text-red-900">
                        {assignmentResult.assignmentsFailed}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Summary</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Total Classes</p>
                      <p className="font-semibold text-gray-900">
                        {assignmentResult.summary.totalClasses}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Teachers</p>
                      <p className="font-semibold text-gray-900">
                        {assignmentResult.summary.totalTeachers}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Avg Per Teacher</p>
                      <p className="font-semibold text-gray-900">
                        {assignmentResult.summary.avgClassesPerTeacher}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Assigned</p>
                      <p className="font-semibold text-gray-900">
                        {assignmentResult.summary.classesAssigned}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Distribution by Teacher */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Distribution by Teacher</h4>
                  <div className="space-y-2">
                    {Object.entries(assignmentResult.summary.teacherDistribution).map(
                      ([teacherId, count]) => {
                        const teacher = teachers.find((t) => t.id === teacherId);
                        return (
                          <div key={teacherId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{teacher?.name || teacherId}</span>
                            <span className="font-semibold">
                              {count} class{count !== 1 ? "es" : ""}
                            </span>
                          </div>
                        );
                      }
                    )}
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
                              Class
                            </th>
                            <th className="text-left py-2 px-2 font-semibold text-gray-900">
                              Teacher
                            </th>
                            <th className="text-left py-2 px-2 font-semibold text-gray-900">
                              Match
                            </th>
                            <th className="text-left py-2 px-2 font-semibold text-gray-900">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {assignmentResult.details.map((detail, idx) => (
                            <tr key={idx} className="border-b border-gray-100">
                              <td className="py-2 px-2 text-gray-900">
                                {detail.className}
                              </td>
                              <td className="py-2 px-2 text-gray-600">{detail.newTeacherName || "-"}</td>
                              <td className="py-2 px-2 text-gray-600">
                                {detail.matchScore ? `${detail.matchScore}%` : "-"}
                              </td>
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
