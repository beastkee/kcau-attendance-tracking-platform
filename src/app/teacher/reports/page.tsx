"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getCoursesByTeacher, getUsersByRole, getAttendanceByStudent } from "@/lib/firebaseServices";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { Card, StatCard } from "@/components/ui/Card";
import RiskBadge from "@/components/intelligence/RiskBadge";
import { Course } from "@/types";
import { User } from "@/types/firebase";
import { analyzeStudentAttendance, RiskAssessment } from "@/lib/analytics";

const teacherSidebarItems = [
  { name: "Dashboard", href: "/teacher", icon: "📊" },
  { name: "My Classes", href: "/teacher/classes", icon: "🏫" },
  { name: "Take Attendance", href: "/teacher/attendance", icon: "📋" },
  { name: "Class Reports", href: "/teacher/reports", icon: "📈" },
];

interface ClassAnalytics {
  course: Course;
  totalStudents: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  avgAttendanceRate: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  studentsData: Array<{
    student: User;
    risk: RiskAssessment;
    attendanceRate: number;
  }>;
}

export default function TeacherReportsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [classAnalytics, setClassAnalytics] = useState<ClassAnalytics[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        setCurrentUser(user);
        await loadData(user.uid);
      } else {
        setIsAuthenticated(false);
        router.push("/");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const loadData = async (teacherId: string) => {
    try {
      const [coursesData, studentsData] = await Promise.all([
        getCoursesByTeacher(teacherId),
        getUsersByRole("student"),
      ]);

      // Calculate analytics for each class
      const analytics = await Promise.all(
        coursesData.map(async (course) => {
          const enrolledStudents = studentsData.filter(s =>
            course.studentIds?.includes(s.id || "")
          );

          const studentsAnalytics = await Promise.all(
            enrolledStudents.map(async (student) => {
              const attendance = await getAttendanceByStudent(student.id!);
              const courseAttendance = attendance.filter(a => a.courseId === course.id);
              const risk = analyzeStudentAttendance(courseAttendance);
              const attendanceRate = courseAttendance.length > 0
                ? Math.round(
                    ((courseAttendance.filter(a => a.status === "present" || a.status === "late").length /
                      courseAttendance.length) * 100)
                  )
                : 0;

              return { student, risk, attendanceRate };
            })
          );

          const highRiskCount = studentsAnalytics.filter(s => s.risk.level === "high").length;
          const mediumRiskCount = studentsAnalytics.filter(s => s.risk.level === "medium").length;
          const lowRiskCount = studentsAnalytics.filter(s => s.risk.level === "low").length;

          const avgAttendanceRate =
            studentsAnalytics.length > 0
              ? Math.round(
                  studentsAnalytics.reduce((sum, s) => sum + s.attendanceRate, 0) /
                    studentsAnalytics.length
                )
              : 0;

          // Get aggregate attendance stats
          const allAttendance = await Promise.all(
            enrolledStudents.map(s => getAttendanceByStudent(s.id!))
          ).then(results => results.flat().filter(a => a.courseId === course.id));

          const presentCount = allAttendance.filter(a => a.status === "present").length;
          const lateCount = allAttendance.filter(a => a.status === "late").length;
          const absentCount = allAttendance.filter(a => a.status === "absent").length;

          return {
            course,
            totalStudents: enrolledStudents.length,
            highRiskCount,
            mediumRiskCount,
            lowRiskCount,
            avgAttendanceRate,
            presentCount,
            lateCount,
            absentCount,
            studentsData: studentsAnalytics.sort((a, b) => b.risk.score - a.risk.score),
          };
        })
      );

      setClassAnalytics(analytics.sort((a, b) => b.highRiskCount - a.highRiskCount));
      if (analytics.length > 0) {
        setSelectedCourse(analytics[0].course.id || "");
      }
    } catch (error) {
      console.error("Failed to load report data:", error);
    }
  };

  const selectedClassData = classAnalytics.find(c => c.course.id === selectedCourse);

  if (loading) {
    return (
      <DashboardLayout
        title="Class Reports"
        userRole="teacher"
        userName={currentUser?.displayName || "Teacher"}
        sidebarItems={teacherSidebarItems}
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Class Reports"
      userRole="teacher"
      userName={currentUser?.displayName || "Teacher"}
      sidebarItems={teacherSidebarItems}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Class Reports</h1>
          <p className="text-gray-600">Analyze attendance and risk metrics for your classes</p>
        </div>

        {/* Course Selection */}
        <Card title="Select Class">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Class
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {classAnalytics.map(analytics => (
                <option key={analytics.course.id} value={analytics.course.id}>
                  {analytics.course.name} ({analytics.totalStudents} students)
                </option>
              ))}
            </select>
        </Card>

        {selectedClassData && (
          <>
            {/* Class Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard
                title="Total Students"
                value={selectedClassData.totalStudents.toString()}
                icon="👥"
                color="blue"
              />
              <StatCard
                title="High Risk"
                value={selectedClassData.highRiskCount.toString()}
                icon="⚠️"
                color="red"
              />
              <StatCard
                title="Medium Risk"
                value={selectedClassData.mediumRiskCount.toString()}
                icon="⚡"
                color="yellow"
              />
              <StatCard
                title="Low Risk"
                value={selectedClassData.lowRiskCount.toString()}
                icon="✅"
                color="green"
              />
            </div>

            {/* Attendance Stats */}
            <Card title="Attendance Summary">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-green-700 text-sm">Present</p>
                    <p className="text-2xl font-bold text-green-900">{selectedClassData.presentCount}</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-yellow-700 text-sm">Late</p>
                    <p className="text-2xl font-bold text-yellow-900">{selectedClassData.lateCount}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-red-700 text-sm">Absent</p>
                    <p className="text-2xl font-bold text-red-900">{selectedClassData.absentCount}</p>
                  </div>
                </div>
            </Card>

            {/* Risk Distribution Chart */}
            <Card title="Student Risk Distribution">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">High Risk</span>
                      <span className="text-sm font-semibold text-red-600">
                        {selectedClassData.highRiskCount} ({Math.round((selectedClassData.highRiskCount / selectedClassData.totalStudents) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{
                          width: `${Math.round((selectedClassData.highRiskCount / selectedClassData.totalStudents) * 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Medium Risk</span>
                      <span className="text-sm font-semibold text-yellow-600">
                        {selectedClassData.mediumRiskCount} ({Math.round((selectedClassData.mediumRiskCount / selectedClassData.totalStudents) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{
                          width: `${Math.round((selectedClassData.mediumRiskCount / selectedClassData.totalStudents) * 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Low Risk</span>
                      <span className="text-sm font-semibold text-green-600">
                        {selectedClassData.lowRiskCount} ({Math.round((selectedClassData.lowRiskCount / selectedClassData.totalStudents) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${Math.round((selectedClassData.lowRiskCount / selectedClassData.totalStudents) * 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
            </Card>

            {/* Student Details Table */}
            <Card title="Student Attendance Details">
                {selectedClassData.studentsData.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No student data available</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Student Name</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Risk Level</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Attendance Rate</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedClassData.studentsData.map((data, idx) => (
                          <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <p className="font-medium text-gray-900">{data.student.name || "Unknown"}</p>
                              <p className="text-xs text-gray-600">{data.student.email}</p>
                            </td>
                            <td className="py-3 px-4">
                              <RiskBadge level={data.risk.level} />
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-medium text-gray-900">{data.attendanceRate}%</p>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                                  data.risk.level === "high"
                                    ? "bg-red-100 text-red-800"
                                    : data.risk.level === "medium"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-green-100 text-green-800"
                                }`}
                              >
                                {data.risk.level === "high"
                                  ? "Needs Intervention"
                                  : data.risk.level === "medium"
                                    ? "Monitor"
                                    : "Good Standing"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
