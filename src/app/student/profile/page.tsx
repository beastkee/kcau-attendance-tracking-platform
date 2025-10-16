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

export default function StudentProfilePage() {
  return (
    <DashboardLayout
      title="Profile"
      userRole="student"
      userName="Student"
      sidebarItems={studentSidebarItems}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">Manage your account settings and personal information</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <span className="text-6xl mb-4 block">👤</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h2>
          <p className="text-gray-600">Profile settings and account management will be available here</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
