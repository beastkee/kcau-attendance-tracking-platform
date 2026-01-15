"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getAttendanceByStudent, getCoursesByStudent } from "@/lib/firebaseServices";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { Card, StatCard } from "@/components/ui/Card";
import { AttendanceRecord } from "@/types";
import { Course } from "@/types";

const studentSidebarItems = [
  { name: "Dashboard", href: "/student", icon: "📊" },
  { name: "My Classes", href: "/student/classes", icon: "🏫" },
  { name: "Attendance History", href: "/student/attendance", icon: "📋" },
  { name: "Reports", href: "/student/reports", icon: "📈" },
];

interface FilteredAttendanceRecord extends AttendanceRecord {
  courseName?: string;
}

export default function StudentAttendancePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<FilteredAttendanceRecord[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<any>(null);
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

      // Enrich attendance records with course names
      const enrichedAttendance = attendanceData.map(record => ({
        ...record,
        courseName: coursesData.find(c => c.id === record.courseId)?.name || "Unknown Course",
      }));

      setAttendance(enrichedAttendance.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ));
      setCourses(coursesData);

      // Set default date range to last 30 days
      const end = new Date();
      const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      setEndDate(end.toISOString().split('T')[0]);
      setStartDate(start.toISOString().split('T')[0]);
    } catch (error) {
      console.error("Failed to load attendance data:", error);
    }
  };

  const getFilteredAttendance = () => {
    return attendance.filter(record => {
      const recordDate = new Date(record.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      const matchesCourse = selectedCourse === "all" || record.courseId === selectedCourse;
      const matchesDateRange = 
        (!start || recordDate >= start) && 
        (!end || recordDate <= end);

      return matchesCourse && matchesDateRange;
    });
  };

  const getAttendanceStats = () => {
    const filtered = getFilteredAttendance();
    const present = filtered.filter(r => r.status === "present").length;
    const late = filtered.filter(r => r.status === "late").length;
    const absent = filtered.filter(r => r.status === "absent").length;
    const rate = filtered.length > 0 
      ? Math.round(((present + late) / filtered.length) * 100)
      : 0;

    return { present, late, absent, rate, total: filtered.length };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800";
      case "late":
        return "bg-yellow-100 text-yellow-800";
      case "absent":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case "present":
        return "✅";
      case "late":
        return "⏰";
      case "absent":
        return "❌";
      default:
        return "❓";
    }
  };

  const stats = getAttendanceStats();
  const filteredAttendance = getFilteredAttendance();

  if (loading) {
    return (
      <DashboardLayout
        title="Attendance History"
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
      title="Attendance History"
      userRole="student"
      userName={currentUser?.displayName || "Student"}
      sidebarItems={studentSidebarItems}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance History</h1>
          <p className="text-gray-600">View and track your attendance records</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Attendance Rate"
            value={`${stats.rate}%`}
            icon="📊"
            color="blue"
          />
          <StatCard
            title="Present"
            value={stats.present.toString()}
            icon="✅"
            color="green"
          />
          <StatCard
            title="Late"
            value={stats.late.toString()}
            icon="⏰"
            color="yellow"
          />
          <StatCard
            title="Absent"
            value={stats.absent.toString()}
            icon="❌"
            color="red"
          />
        </div>

        {/* Filters */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Courses</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Attendance Records Table */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Attendance Records ({filteredAttendance.length})
            </h3>
            {filteredAttendance.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No attendance records found for the selected filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Course</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAttendance.map((record, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          {new Date(record.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="py-3 px-4 text-gray-700">{record.courseName}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(record.status)}`}>
                            {getStatusEmoji(record.status)} {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{record.notes || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
