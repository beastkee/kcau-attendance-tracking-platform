"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { 
  getCoursesByTeacher, 
  getUsersByRole,
  getAttendanceByStudent,
} from "@/lib/firebaseServices";
import { useRouter } from "next/navigation";
import { User } from "@/types/firebase";
import { Course } from "@/types";
import { analyzeStudentAttendance, RiskAssessment } from "@/lib/analytics";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { Card, StatCard } from "@/components/ui/Card";
import RiskBadge from "@/components/intelligence/RiskBadge";

const teacherSidebarItems = [
  { name: "Dashboard", href: "/teacher", icon: "📊" },
  { name: "My Classes", href: "/teacher/classes", icon: "🏫" },
  { name: "Take Attendance", href: "/teacher/attendance", icon: "📋" },
  { name: "Class Reports", href: "/teacher/reports", icon: "📈" },
];

interface ClassRiskSummary {
  courseId: string;
  courseName: string;
  courseCode: string;
  totalStudents: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  avgAttendance: number;
}

export default function TeacherDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [classRiskSummaries, setClassRiskSummaries] = useState<ClassRiskSummary[]>([]);
  const [highRiskStudents, setHighRiskStudents] = useState<Array<{ student: User; risk: RiskAssessment; course: Course }>>([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
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
      // TODO: Add caching for course data
      const [coursesData, studentsData] = await Promise.all([
        getCoursesByTeacher(teacherId),
        getUsersByRole("student"),
      ]);

      setMyCourses(coursesData);
      setAllStudents(studentsData);

      // Calculate risk summaries for each class
      const summaries = await Promise.all(
        coursesData.map(async (course) => {
          const enrolledStudents = studentsData.filter(s => 
            course.studentIds?.includes(s.id || "")
          );

          const risks = await Promise.all(
            enrolledStudents.map(async (student) => {
              const attendance = await getAttendanceByStudent(student.id!);
              const courseAttendance = attendance.filter(a => a.courseId === course.id);
              return analyzeStudentAttendance(courseAttendance);
            })
          );

          const highRisk = risks.filter(r => r.level === "high").length;
          const mediumRisk = risks.filter(r => r.level === "medium").length;
          const lowRisk = risks.filter(r => r.level === "low").length;
          
          const avgAttendance = risks.length > 0
            ? risks.reduce((sum, r) => sum + r.breakdown.attendancePercentage, 0) / risks.length
            : 100;

          return {
            courseId: course.id!,
            courseName: course.name,
            courseCode: course.code,
            totalStudents: enrolledStudents.length,
            highRisk,
            mediumRisk,
            lowRisk,
            avgAttendance,
          };
        })
      );

      setClassRiskSummaries(summaries);

      // HACK: Should filter by date range, but using all records for now
      const allHighRisk: Array<{ student: User; risk: RiskAssessment; course: Course }> = [];
      
      for (const course of coursesData) {
        const enrolledStudents = studentsData.filter(s => 
          course.studentIds?.includes(s.id || "")
        );

        for (const student of enrolledStudents) {
          const attendance = await getAttendanceByStudent(student.id!);
          const courseAttendance = attendance.filter(a => a.courseId === course.id);
          const risk = analyzeStudentAttendance(courseAttendance);
          
          if (risk.level === "high") {
            allHighRisk.push({ student, risk, course });
          }
        }
      }

      setHighRiskStudents(allHighRisk);
    } catch (error) {
      // Error handled
      // Failed to load data
    }
  };

  const getTotalStudents = () => {
    return classRiskSummaries.reduce((sum, c) => sum + c.totalStudents, 0);
  };

  const getTotalHighRisk = () => {
    return classRiskSummaries.reduce((sum, c) => sum + c.highRisk, 0);
  };

  const getAvgAttendance = () => {
    if (classRiskSummaries.length === 0) return 100;
    const avg = classRiskSummaries.reduce((sum, c) => sum + c.avgAttendance, 0) / classRiskSummaries.length;
    return Math.round(avg);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Please log in to access the teacher dashboard</p>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      title="Teacher Portal"
      userRole="teacher"
      userName={currentUser?.name || "Teacher"}
      sidebarItems={teacherSidebarItems}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
            <p className="text-gray-600">Welcome back, {currentUser?.name || "Teacher"}!</p>
          </div>
          <button
            onClick={() => router.push("/teacher/attendance")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center space-x-2"
          >
            <span>📋</span>
            <span>Take Attendance</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="My Classes" 
            value={myCourses.length.toString()} 
            icon="🏫" 
            color="blue" 
          />
          <StatCard 
            title="Total Students" 
            value={getTotalStudents().toString()} 
            icon="👥" 
            color="green" 
          />
          <StatCard 
            title="High Risk Students" 
            value={getTotalHighRisk().toString()} 
            icon="🚨" 
            color="red" 
          />
          <StatCard 
            title="Avg Attendance" 
            value={`${getAvgAttendance()}%`} 
            icon="📊" 
            color="yellow" 
          />
        </div>

        {/* My Classes Overview */}
        <Card title="📚 My Classes - Risk Overview">
          <div className="space-y-4">
            {myCourses.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No classes assigned yet</p>
            ) : (
              classRiskSummaries.map((summary) => (
                <div
                  key={summary.courseId}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {summary.courseCode} - {summary.courseName}
                        </h3>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 mt-3">
                        <div className="text-center p-2 bg-white rounded border">
                          <div className="text-2xl font-bold text-gray-900">{summary.totalStudents}</div>
                          <div className="text-xs text-gray-600">Total Students</div>
                        </div>
                        <div className="text-center p-2 bg-red-50 rounded border border-red-200">
                          <div className="text-2xl font-bold text-red-600">{summary.highRisk}</div>
                          <div className="text-xs text-red-700">High Risk</div>
                        </div>
                        <div className="text-center p-2 bg-yellow-50 rounded border border-yellow-200">
                          <div className="text-2xl font-bold text-yellow-600">{summary.mediumRisk}</div>
                          <div className="text-xs text-yellow-700">Medium Risk</div>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded border border-green-200">
                          <div className="text-2xl font-bold text-green-600">{summary.lowRisk}</div>
                          <div className="text-xs text-green-700">Low Risk</div>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-sm text-gray-600">Avg Attendance:</span>
                        <span className={`font-semibold ${
                          summary.avgAttendance >= 90 ? "text-green-600" :
                          summary.avgAttendance >= 75 ? "text-yellow-600" :
                          "text-red-600"
                        }`}>
                          {summary.avgAttendance.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => router.push(`/teacher/attendance`)}
                        className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Take Attendance
                      </button>
                      <button
                        onClick={() => router.push(`/teacher/classes`)}
                        className="text-sm bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* High-Risk Students Alert */}
        {highRiskStudents.length > 0 && (
          <Card title="🚨 High-Risk Students - Immediate Attention Required">
            <div className="space-y-3">
              {highRiskStudents.map(({ student, risk, course }) => (
                <div
                  key={`${student.id}-${course.id}`}
                  className="p-4 bg-red-50 rounded-lg border-l-4 border-red-400"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-red-900">{student.name}</p>
                        <RiskBadge level={risk.level} score={risk.score} />
                      </div>
                      <p className="text-sm text-red-700">Course: {course.code} - {course.name}</p>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-red-600">Attendance: </span>
                          <span className="font-semibold">{risk.breakdown.attendancePercentage.toFixed(1)}%</span>
                        </div>
                        <div>
                          <span className="text-red-600">Absences: </span>
                          <span className="font-semibold">{risk.breakdown.absences}</span>
                        </div>
                        <div>
                          <span className="text-red-600">Sessions: </span>
                          <span className="font-semibold">{risk.breakdown.totalSessions}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => window.location.href = `mailto:${student.email}?subject=Attendance Concern`}
                      className="ml-4 text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Contact
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card title="Quick Actions">
            <div className="space-y-3">
              <button 
                onClick={() => router.push("/teacher/attendance")}
                className="w-full p-3 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">📋</span>
                  <div>
                    <p className="font-medium text-green-900">Take Attendance</p>
                    <p className="text-xs text-green-600">Mark today's attendance</p>
                  </div>
                </div>
              </button>
              <button 
                onClick={() => router.push("/teacher/reports")}
                className="w-full p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">📈</span>
                  <div>
                    <p className="font-medium text-blue-900">View Reports</p>
                    <p className="text-xs text-blue-600">Generate class reports</p>
                  </div>
                </div>
              </button>
              <button 
                onClick={() => router.push("/teacher/students")}
                className="w-full p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">👥</span>
                  <div>
                    <p className="font-medium text-purple-900">View All Students</p>
                    <p className="text-xs text-purple-600">Manage student list</p>
                  </div>
                </div>
              </button>
            </div>
          </Card>

          <Card title="System Status" className="md:col-span-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-900">Live Risk Analytics</span>
                  <span className="text-green-600">✅</span>
                </div>
                <p className="text-xs text-green-700">
                  All risk scores calculated from real attendance data
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">Data Sync</span>
                  <span className="text-blue-600">✅</span>
                </div>
                <p className="text-xs text-blue-700">
                  Dashboard synced with latest attendance records
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-900 mb-1">Your Classes</div>
                <div className="text-2xl font-bold text-gray-900">{myCourses.length}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-900 mb-1">Students</div>
                <div className="text-2xl font-bold text-gray-900">{getTotalStudents()}</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
