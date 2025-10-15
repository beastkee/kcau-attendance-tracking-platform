"use client";

import Header from "./Header";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  userRole: "admin" | "teacher" | "student";
  userName?: string;
  sidebarItems: Array<{
    name: string;
    href: string;
    icon: string;
  }>;
}

export default function DashboardLayout({ 
  children, 
  title, 
  userRole, 
  userName = `Sample ${userRole}`,
  sidebarItems 
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={title} userRole={userRole} userName={userName} />
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar items={sidebarItems} userRole={userRole} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}