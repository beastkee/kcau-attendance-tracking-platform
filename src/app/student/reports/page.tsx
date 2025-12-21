"use client";

import DashboardLayout from "@/components/ui/DashboardLayout";

const studentSidebarItems = [
  { name: "Dashboard", href: "/student", icon: "📊" },
  { name: "My Classes", href: "/student/classes", icon: "🏫" },
  { name: "Attendance", href: "/student/attendance", icon: "📋" },
  { name: "Schedule", href: "/student/schedule", icon: "📅" },
  { name: "Reports", href: "/student/reports", icon: "📈" },
  { name: "Profile", href: "/student/profile", icon: "👤" },
];

export default function StudentReportsPage() {
  return (
    <DashboardLayout
      title="Reports"
      userRole="student"
      userName="Student"
      sidebarItems={studentSidebarItems}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Reports</h1>
          <p className="text-gray-600">View your academic performance and attendance reports</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <span className="text-6xl mb-4 block">📈</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h2>
          <p className="text-gray-600">Academic reports and analytics will be available here</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
