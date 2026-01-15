"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getAttendanceByStudent, getCoursesByStudent } from "@/lib/firebaseServices";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { Card, StatCard } from "@/components/ui/Card";
import RiskBadge from "@/components/intelligence/RiskBadge";
import { AttendanceRecord } from "@/types";
import { Course } from "@/types";
import { analyzeStudentAttendance, RiskAssessment } from "@/lib/analytics";

const studentSidebarItems = [
  { name: "Dashboard", href: "/student", icon: "📊" },
  { name: "My Classes", href: "/student/classes", icon: "🏫" },
  { name: "Attendance History", href: "/student/attendance", icon: "📋" },
  { name: "Reports", href: "/student/reports", icon: "📈" },
];

interface CourseReport {
  course: Course;
  risk: RiskAssessment;
  attendanceRate: number;
  totalClasses: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
}

export default function StudentReportsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [overallRisk, setOverallRisk] = useState<RiskAssessment | null>(null);
  const [courseReports, setCourseReports] = useState<CourseReport[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
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

  const loadData = async (studentId: string) => {
    try {
      const [attendanceData, coursesData] = await Promise.all([
        getAttendanceByStudent(studentId),
        getCoursesByStudent(studentId),
      ]);

      setAttendance(attendanceData);

      // Calculate overall risk
      const overallRiskData = analyzeStudentAttendance(attendanceData);
      setOverallRisk(overallRiskData);

      // Calculate per-course reports
      const reports = coursesData.map(course => {
        const courseAttendance = attendanceData.filter(a => a.courseId === course.id);
        const courseRisk = analyzeStudentAttendance(courseAttendance);
        
        const presentCount = courseAttendance.filter(a => a.status === "present").length;
        const lateCount = courseAttendance.filter(a => a.status === "late").length;
        const absentCount = courseAttendance.filter(a => a.status === "absent").length;
        const attendanceRate = courseAttendance.length > 0 
          ? Math.round(((presentCount + lateCount) / courseAttendance.length) * 100)
          : 0;

        return {
          course,
          risk: courseRisk,
          attendanceRate,
          totalClasses: courseAttendance.length,
          presentCount,
          lateCount,
          absentCount,
        };
      }).sort((a, b) => b.risk.score - a.risk.score);

      setCourseReports(reports);
    } catch (error) {
      console.error("Failed to load report data:", error);
    }
  };

  const getTrendDirection = (trend: string): string => {
    switch (trend) {
      case "improving":
        return "📈 Improving";
      case "declining":
        return "📉 Declining";
      case "stable":
        return "➡️ Stable";
      default:
        return "➡️ Unknown";
    }
  };

  const getRiskColor = (level: string): string => {
    switch (level) {
      case "high":
        return "text-red-700 bg-red-50";
      case "medium":
        return "text-yellow-700 bg-yellow-50";
      case "low":
        return "text-green-700 bg-green-50";
      default:
        return "text-gray-700 bg-gray-50";
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        title="Reports"
        userRole="student"
        userName={currentUser?.displayName || "Student"}
        sidebarItems={studentSidebarItems}
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Reports"
      userRole="student"
      userName={currentUser?.displayName || "Student"}
      sidebarItems={studentSidebarItems}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Reports</h1>
          <p className="text-gray-600">View your attendance analytics and risk assessment</p>
        </div>

        {/* Overall Risk Summary */}
        {overallRisk && (
          <Card>
            <div className={`p-6 rounded-lg ${getRiskColor(overallRisk.level)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Overall Risk Assessment</h3>
                  <p className="text-sm opacity-90">
                    Based on {attendance.length} attendance records
                  </p>
                </div>
                <RiskBadge level={overallRisk.level} />
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm opacity-75">Trend</p>
                  <p className="text-lg font-semibold">{getTrendDirection(overallRisk.trend)}</p>
                </div>
                <div>
                  <p className="text-sm opacity-75">Attendance Rate</p>
                  <p className="text-lg font-semibold">{Math.round(overallRisk.breakdown.attendancePercentage)}%</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Total Classes"
            value={attendance.length.toString()}
            icon="📚"
            color="blue"
          />
          <StatCard
            title="Courses Enrolled"
            value={courseReports.length.toString()}
            icon="🏫"
            color="purple"
          />
          <StatCard
            title="Highest Risk Course"
            value={courseReports.length > 0 ? courseReports[0].course.name : "N/A"}
            icon="⚠️"
            color="red"
          />
        </div>

        {/* Course Reports */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Reports</h3>
            {courseReports.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No course data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {courseReports.map((report, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{report.course.name}</h4>
                        <p className="text-sm text-gray-600">{report.course.code}</p>
                      </div>
                      <RiskBadge level={report.risk.level} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Attendance Rate</p>
                        <p className="font-semibold text-gray-900">{report.attendanceRate}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Present</p>
                        <p className="font-semibold text-green-600">{report.presentCount}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Late</p>
                        <p className="font-semibold text-yellow-600">{report.lateCount}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Absent</p>
                        <p className="font-semibold text-red-600">{report.absentCount}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total Classes</p>
                        <p className="font-semibold text-gray-900">{report.totalClasses}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Recommendations */}
        {overallRisk && overallRisk.level !== "low" && (
          <Card>
            <div className="p-6 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Recommendations</h3>
              <ul className="space-y-2 text-blue-800">
                {overallRisk.level === "high" && (
                  <>
                    <li>• Attend all scheduled classes to improve your attendance rate</li>
                    <li>• Reach out to your instructors if you're facing challenges</li>
                    <li>• Contact your advisor to discuss intervention support options</li>
                  </>
                )}
                {overallRisk.level === "medium" && (
                  <>
                    <li>• Focus on improving attendance consistency</li>
                    <li>• Plan your schedule to minimize late arrivals</li>
                    <li>• Monitor your progress closely</li>
                  </>
                )}
                <li>• Refer to your attendance history for detailed insights</li>
              </ul>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
