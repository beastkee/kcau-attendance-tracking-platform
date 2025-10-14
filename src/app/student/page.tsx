"use client";

import DashboardLayout from "../../../components/ui/DashboardLayout";
import { Card, StatCard } from "../../../components/ui/Card";

const studentSidebarItems = [
  { name: "Dashboard", href: "/student", icon: "📊" },
  { name: "My Classes", href: "/student/classes", icon: "🏫" },
  { name: "Attendance", href: "/student/attendance", icon: "📋" },
  { name: "Schedule", href: "/student/schedule", icon: "📅" },
  { name: "Reports", href: "/student/reports", icon: "📈" },
  { name: "Profile", href: "/student/profile", icon: "👤" },
];

export default function StudentDashboard() {
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Enrolled Classes" value="5" icon="🏫" color="blue" />
          <StatCard title="Overall Attendance" value="94%" icon="📊" color="green" />
          <StatCard title="This Week" value="4/5" icon="📅" color="yellow" />
          <StatCard title="Absent Days" value="3" icon="❌" color="red" />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Schedule */}
          <Card title="Today's Schedule">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                <div>
                  <p className="font-medium text-green-900">Mathematics 101</p>
                  <p className="text-sm text-green-600">Prof. Smith • Room 205</p>
                  <p className="text-xs text-green-500">9:00 AM - 10:30 AM</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Present
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <div>
                  <p className="font-medium text-blue-900">Physics 201</p>
                  <p className="text-sm text-blue-600">Prof. Johnson • Lab 301</p>
                  <p className="text-xs text-blue-500">11:00 AM - 12:30 PM</p>
                </div>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                  Upcoming
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                <div>
                  <p className="font-medium text-purple-900">Chemistry Lab</p>
                  <p className="text-sm text-purple-600">Prof. Davis • Lab 205</p>
                  <p className="text-xs text-purple-500">2:00 PM - 4:00 PM</p>
                </div>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                  Upcoming
                </span>
              </div>
            </div>
          </Card>

          {/* Attendance Summary */}
          <Card title="Attendance Summary">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Mathematics 101</p>
                  <p className="text-xs text-gray-500">30/32 classes attended</p>
                </div>
                <div className="text-right">
                  <p className="text-green-600 font-medium">94%</p>
                  <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                    <div className="bg-green-600 h-2 rounded-full" style={{width: '94%'}}></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Physics 201</p>
                  <p className="text-xs text-gray-500">28/30 classes attended</p>
                </div>
                <div className="text-right">
                  <p className="text-green-600 font-medium">93%</p>
                  <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                    <div className="bg-green-600 h-2 rounded-full" style={{width: '93%'}}></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Chemistry Lab</p>
                  <p className="text-xs text-gray-500">25/28 classes attended</p>
                </div>
                <div className="text-right">
                  <p className="text-yellow-600 font-medium">89%</p>
                  <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                    <div className="bg-yellow-600 h-2 rounded-full" style={{width: '89%'}}></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">English Literature</p>
                  <p className="text-xs text-gray-500">26/30 classes attended</p>
                </div>
                <div className="text-right">
                  <p className="text-yellow-600 font-medium">87%</p>
                  <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                    <div className="bg-yellow-600 h-2 rounded-full" style={{width: '87%'}}></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">History</p>
                  <p className="text-xs text-gray-500">22/26 classes attended</p>
                </div>
                <div className="text-right">
                  <p className="text-red-600 font-medium">85%</p>
                  <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                    <div className="bg-red-600 h-2 rounded-full" style={{width: '85%'}}></div>
                  </div>
                </div>
              </div>
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
          <Card title="Recent Activity">
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <span className="text-green-600">✅</span>
                <div>
                  <p className="text-sm font-medium">Attended Mathematics 101</p>
                  <p className="text-xs text-gray-500">Today at 9:00 AM</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <span className="text-green-600">✅</span>
                <div>
                  <p className="text-sm font-medium">Attended Physics 201</p>
                  <p className="text-xs text-gray-500">Yesterday at 11:00 AM</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                <span className="text-red-600">❌</span>
                <div>
                  <p className="text-sm font-medium">Missed Chemistry Lab</p>
                  <p className="text-xs text-gray-500">2 days ago at 2:00 PM</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <span className="text-green-600">✅</span>
                <div>
                  <p className="text-sm font-medium">Attended English Literature</p>
                  <p className="text-xs text-gray-500">3 days ago at 1:00 PM</p>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Notifications & Reminders">
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <span className="text-blue-600">📅</span>
                <div>
                  <p className="text-sm font-medium text-blue-900">Upcoming Class</p>
                  <p className="text-xs text-blue-600">Physics 201 starts in 30 minutes</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                <span className="text-yellow-600">⚠️</span>
                <div>
                  <p className="text-sm font-medium text-yellow-900">Attendance Warning</p>
                  <p className="text-xs text-yellow-600">History class attendance below 90%</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                <span className="text-green-600">🎉</span>
                <div>
                  <p className="text-sm font-medium text-green-900">Achievement</p>
                  <p className="text-xs text-green-600">Perfect attendance this month!</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                <span className="text-purple-600">📋</span>
                <div>
                  <p className="text-sm font-medium text-purple-900">Assignment Due</p>
                  <p className="text-xs text-purple-600">Math homework due tomorrow</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}