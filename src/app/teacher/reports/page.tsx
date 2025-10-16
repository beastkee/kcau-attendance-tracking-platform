"use client";

import DashboardLayout from "@/components/ui/DashboardLayout";

const teacherSidebarItems = [
  { name: "Dashboard", href: "/teacher", icon: "📊" },
  { name: "My Classes", href: "/teacher/classes", icon: "🏫" },
  { name: "Take Attendance", href: "/teacher/attendance", icon: "📋" },
  { name: "View Reports", href: "/teacher/reports", icon: "📈" },
  { name: "Students", href: "/teacher/students", icon: "👥" },
  { name: "Schedule", href: "/teacher/schedule", icon: "📅" },
  { name: "Profile", href: "/teacher/profile", icon: "👤" },
];

export default function TeacherReportsPage() {
  return (
    <DashboardLayout
      title="View Reports"
      userRole="teacher"
      userName="Teacher"
      sidebarItems={teacherSidebarItems}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Reports</h1>
          <p className="text-gray-600">View and analyze attendance data for your classes</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <span className="text-6xl mb-4 block">📈</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h2>
          <p className="text-gray-600">Detailed attendance reports and analytics will be available here</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
