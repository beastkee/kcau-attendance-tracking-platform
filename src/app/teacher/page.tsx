"use client";

import DashboardLayout from "../../../components/ui/DashboardLayout";
import { Card, StatCard } from "../../../components/ui/Card";

const teacherSidebarItems = [
  { name: "Dashboard", href: "/teacher", icon: "📊" },
  { name: "My Classes", href: "/teacher/classes", icon: "🏫" },
  { name: "Take Attendance", href: "/teacher/attendance", icon: "📋" },
  { name: "View Reports", href: "/teacher/reports", icon: "📈" },
  { name: "Students", href: "/teacher/students", icon: "👥" },
  { name: "Schedule", href: "/teacher/schedule", icon: "📅" },
  { name: "Profile", href: "/teacher/profile", icon: "👤" },
];

export default function TeacherDashboard() {
  return (
    <DashboardLayout
      title="Teacher Portal"
      userRole="teacher"
      userName="Teacher Name"
      sidebarItems={teacherSidebarItems}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-gray-600">Manage your classes and track student attendance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="My Classes" value="6" icon="🏫" color="blue" />
          <StatCard title="Total Students" value="180" icon="👥" color="green" />
          <StatCard title="Today's Classes" value="3" icon="📅" color="yellow" />
          <StatCard title="Avg Attendance" value="92%" icon="📊" color="red" />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Schedule */}
          <Card title="Today's Schedule">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                <div>
                  <p className="font-medium text-green-900">Mathematics 101</p>
                  <p className="text-sm text-green-600">Room 205 • 9:00 AM - 10:30 AM</p>
                  <p className="text-xs text-green-500">32 students enrolled</p>
                </div>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                  Take Attendance
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <div>
                  <p className="font-medium text-blue-900">Algebra II</p>
                  <p className="text-sm text-blue-600">Room 301 • 11:00 AM - 12:30 PM</p>
                  <p className="text-xs text-blue-500">28 students enrolled</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                  Take Attendance
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                <div>
                  <p className="font-medium text-yellow-900">Calculus</p>
                  <p className="text-sm text-yellow-600">Room 205 • 2:00 PM - 3:30 PM</p>
                  <p className="text-xs text-yellow-500">24 students enrolled</p>
                </div>
                <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700">
                  Take Attendance
                </button>
              </div>
            </div>
          </Card>

          {/* Recent Attendance */}
          <Card title="Recent Attendance Records">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Mathematics 101</p>
                  <p className="text-xs text-gray-500">Yesterday • 30/32 present (94%)</p>
                </div>
                <span className="text-green-600 text-sm font-medium">94%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Algebra II</p>
                  <p className="text-xs text-gray-500">Yesterday • 26/28 present (93%)</p>
                </div>
                <span className="text-green-600 text-sm font-medium">93%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Calculus</p>
                  <p className="text-xs text-gray-500">Yesterday • 20/24 present (83%)</p>
                </div>
                <span className="text-yellow-600 text-sm font-medium">83%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Statistics</p>
                  <p className="text-xs text-gray-500">2 days ago • 18/22 present (82%)</p>
                </div>
                <span className="text-yellow-600 text-sm font-medium">82%</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions & Attendance Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Quick Actions">
            <div className="space-y-3">
              <button className="w-full p-3 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">📋</span>
                  <div>
                    <p className="font-medium text-green-900">Take Attendance</p>
                    <p className="text-xs text-green-600">Mark today's attendance</p>
                  </div>
                </div>
              </button>
              <button className="w-full p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">📈</span>
                  <div>
                    <p className="font-medium text-blue-900">View Reports</p>
                    <p className="text-xs text-blue-600">Generate class reports</p>
                  </div>
                </div>
              </button>
              <button className="w-full p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">👥</span>
                  <div>
                    <p className="font-medium text-purple-900">View Students</p>
                    <p className="text-xs text-purple-600">Manage student list</p>
                  </div>
                </div>
              </button>
            </div>
          </Card>

          <Card title="Attendance Trends" className="lg:col-span-2">
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">📊 Weekly Attendance Chart Placeholder</p>
            </div>
          </Card>
        </div>

        {/* Alerts & Notifications */}
        <Card title="Alerts & Notifications">
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
              <span className="text-red-600">⚠️</span>
              <div>
                <p className="text-sm font-medium text-red-900">Low Attendance Alert</p>
                <p className="text-xs text-red-600">Student John Doe has attended only 60% of classes this week</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
              <span className="text-yellow-600">📅</span>
              <div>
                <p className="text-sm font-medium text-yellow-900">Schedule Reminder</p>
                <p className="text-xs text-yellow-600">Mathematics 101 starts in 30 minutes (Room 205)</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <span className="text-blue-600">📋</span>
              <div>
                <p className="text-sm font-medium text-blue-900">Pending Action</p>
                <p className="text-xs text-blue-600">Please submit attendance for Calculus class from yesterday</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}