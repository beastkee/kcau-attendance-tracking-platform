"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { 
  getCoursesByStudent, 
  getAttendanceByStudent,
} from "@/lib/firebaseServices";
import { useRouter } from "next/navigation";
import { User } from "@/types/firebase";
import { Course, AttendanceRecord } from "@/types";
import { analyzeStudentAttendance, RiskAssessment } from "@/lib/analytics";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { Card, StatCard } from "@/components/ui/Card";
import RiskBadge from "@/components/intelligence/RiskBadge";

const studentSidebarItems = [
  { name: "Dashboard", href: "/student", icon: "📊" },
  { name: "My Classes", href: "/student/classes", icon: "🏫" },
  { name: "Attendance History", href: "/student/attendance", icon: "📋" },
  { name: "Reports", href: "/student/reports", icon: "📈" },
];

export default function StudentDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [myAttendance, setMyAttendance] = useState<AttendanceRecord[]>([]);
  const [myRisk, setMyRisk] = useState<RiskAssessment | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        await loadStudentData(user.uid);
      } else {
        setIsAuthenticated(false);
        router.push("/");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const loadStudentData = async (studentId: string) => {
    try {
      const [coursesData, attendanceData] = await Promise.all([
        getCoursesByStudent(studentId),
        getAttendanceByStudent(studentId),
      ]);

      setMyCourses(coursesData);
      setMyAttendance(attendanceData);

      const risk = analyzeStudentAttendance(attendanceData);
      setMyRisk(risk);
    } catch (error) {
      // Failed to load data
    }
  };

  const getOverallAttendanceRate = () => {
    if (myAttendance.length === 0) return 0;
    const presentCount = myAttendance.filter(a => a.status === "present" || a.status === "late").length;
    return Math.round((presentCount / myAttendance.length) * 100);
  };

  const getThisWeekAttendance = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weekAttendance = myAttendance.filter(a => new Date(a.date) >= oneWeekAgo);
    const presentCount = weekAttendance.filter(a => a.status === "present" || a.status === "late").length;
    
    return { present: presentCount, total: weekAttendance.length };
  };

  const getAbsentCount = () => {
    return myAttendance.filter(a => a.status === "absent").length;
  };

  const getCourseAttendanceRate = (courseId: string) => {
    const courseAttendance = myAttendance.filter(a => a.courseId === courseId);
    if (courseAttendance.length === 0) return 0;
    
    const presentCount = courseAttendance.filter(a => a.status === "present" || a.status === "late").length;
    return Math.round((presentCount / courseAttendance.length) * 100);
  };

  const getRecentAttendance = () => {
    return myAttendance
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  };

  const weekAttendance = getThisWeekAttendance();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }
  return (
    <DashboardLayout
      title="Student Portal"
      userRole="student"
      userName="Student Name"
      sidebarItems={studentSidebarItems}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600">Track your attendance and academic progress</p>
        </div>

        {/* Risk Assessment Alert */}
        {myRisk && myRisk.level === "high" && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
            <div className="flex items-start">
              <span className="text-2xl mr-3">⚠️</span>
              <div>
                <h3 className="text-red-900 font-semibold">Attendance Alert - High Risk</h3>
                <p className="text-red-700 text-sm mt-1">
                  Your attendance rate is {getOverallAttendanceRate()}%. 
                  Please improve your attendance to stay on track.
                </p>
                <div className="mt-2 text-xs text-red-600">
                  Risk Score: {myRisk.score.toFixed(0)}/100
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Enrolled Classes" 
            value={myCourses.length.toString()} 
            icon="🏫" 
            color="blue" 
          />
          <StatCard 
            title="Overall Attendance" 
            value={`${getOverallAttendanceRate()}%`} 
            icon="📊" 
            color={getOverallAttendanceRate() >= 75 ? "green" : "red"} 
          />
          <StatCard 
            title="This Week" 
            value={(() => {
              const weekAttendance = getThisWeekAttendance();
              return `${weekAttendance.present}/${weekAttendance.total}`;
            })()} 
            icon="📅" 
            color="yellow" 
          />
          <StatCard 
            title="Absent Days" 
            value={getAbsentCount().toString()} 
            icon="❌" 
            color="red" 
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enrolled Courses */}
          <Card title="Enrolled Courses">
            <div className="space-y-4">
              {myCourses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg">📚</p>
                  <p className="text-sm mt-2">No courses enrolled yet</p>
                </div>
              ) : (
                myCourses.map(course => {
                  const courseRate = getCourseAttendanceRate(course.id || '');
                  const colorClass = courseRate >= 90 ? 'green' : courseRate >= 75 ? 'blue' : courseRate >= 60 ? 'yellow' : 'red';
                  
                  return (
                    <div key={course.id} className={`flex items-center justify-between p-4 bg-${colorClass}-50 rounded-lg border-l-4 border-${colorClass}-400`}>
                      <div>
                        <p className={`font-medium text-${colorClass}-900`}>{course.name}</p>
                        <p className={`text-sm text-${colorClass}-600`}>
                          {course.code} • {course.teacherName || 'Teacher TBA'}
                        </p>
                        {course.schedule && (
                          <p className={`text-xs text-${colorClass}-500`}>{course.schedule}</p>
                        )}
                      </div>
                      <span className={`px-3 py-1 bg-${colorClass}-100 text-${colorClass}-800 rounded-full text-sm font-medium`}>
                        {courseRate}%
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* My Courses */}
          <Card title="My Courses">
            <div className="space-y-4">
              {myCourses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg">📚</p>
                  <p className="text-sm mt-2">No courses enrolled yet</p>
                </div>
              ) : (
                myCourses.map(course => {
                  const courseRate = getCourseAttendanceRate(course.id || '');
                  const courseRecords = myAttendance.filter(r => r.courseId === course.id);
                  const present = courseRecords.filter(r => r.status === 'present').length;
                  const total = courseRecords.length;
                  
                  return (
                    <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{course.name}</p>
                        <p className="text-xs text-gray-500">
                          {total > 0 ? `${present}/${total} classes attended` : 'No attendance records yet'}
                        </p>
                      </div>
                      {total > 0 && (
                        <div className="text-right">
                          <p className={`font-medium ${courseRate >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                            {courseRate}%
                          </p>
                          <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className={`h-2 rounded-full ${courseRate >= 75 ? 'bg-green-600' : 'bg-red-600'}`} 
                              style={{width: `${Math.min(courseRate, 100)}%`}}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Quick Actions & Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Quick Actions">
            <div className="space-y-3">
              <button className="w-full p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">📅</span>
                  <div>
                    <p className="font-medium text-blue-900">View Schedule</p>
                    <p className="text-xs text-blue-600">Check today's classes</p>
                  </div>
                </div>
              </button>
              <button className="w-full p-3 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">📊</span>
                  <div>
                    <p className="font-medium text-green-900">Attendance Report</p>
                    <p className="text-xs text-green-600">View detailed reports</p>
                  </div>
                </div>
              </button>
              <button className="w-full p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">👤</span>
                  <div>
                    <p className="font-medium text-purple-900">Update Profile</p>
                    <p className="text-xs text-purple-600">Edit personal info</p>
                  </div>
                </div>
              </button>
            </div>
          </Card>

          <Card title="Weekly Progress" className="lg:col-span-2">
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">📊 Weekly Attendance Progress Chart Placeholder</p>
            </div>
          </Card>
        </div>

        {/* Recent Activity & Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Recent Attendance">
            <div className="space-y-3">
              {(() => {
                const recentRecords = getRecentAttendance();
                
                if (recentRecords.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-lg">📋</p>
                      <p className="text-sm mt-2">No attendance records yet</p>
                    </div>
                  );
                }
                
                return recentRecords.map(record => {
                  const course = myCourses.find(c => c.id === record.courseId);
                  const statusConfig = {
                    present: { icon: '✅', color: 'green', label: 'Present' },
                    absent: { icon: '❌', color: 'red', label: 'Absent' },
                    late: { icon: '⏰', color: 'yellow', label: 'Late' }
                  };
                  const config = statusConfig[record.status];
                  
                  return (
                    <div key={record.id} className={`flex items-center space-x-3 p-3 bg-${config.color}-50 rounded-lg`}>
                      <span className={`text-${config.color}-600`}>{config.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{config.label} - {course?.name || 'Unknown Course'}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(record.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </Card>

          <Card title="Performance Overview">
            <div className="space-y-4">
              {myRisk && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Risk Assessment</span>
                    <RiskBadge level={myRisk.level} />
                  </div>
                  <div className="text-xs text-gray-600">
                    Risk Score: {myRisk.score.toFixed(0)}/100
                  </div>
                </div>
              )}
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Overall Attendance</p>
                    <p className="text-xs text-blue-600">{myAttendance.length} total records</p>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {getOverallAttendanceRate()}%
                  </div>
                </div>
              </div>

              {myCourses.length > 0 && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-900">Enrolled Courses</p>
                      <p className="text-xs text-green-600">Active this semester</p>
                    </div>
                    <div className="text-2xl font-bold text-green-900">
                      {myCourses.length}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}