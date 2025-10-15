"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import AdminLogin from "@/components/auth/AdminLogin";
import DashboardLayout from "../../../components/ui/DashboardLayout";
import { Card, StatCard } from "../../../components/ui/Card";

const adminSidebarItems = [
  { name: "Intelligence Hub", href: "/admin", icon: "📊" },
  { name: "Students", href: "/admin/students", icon: "👥" },
  { name: "Teachers", href: "/admin/teachers", icon: "👨‍🏫" },
  { name: "Classes", href: "/admin/classes", icon: "🏫" },
  { name: "Analytics", href: "/admin/analytics", icon: "�" },
  { name: "Predictive Reports", href: "/admin/reports", icon: "🎯" },
  { name: "Settings", href: "/admin/settings", icon: "⚙️" },
];

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <DashboardLayout
      title="EduTrack Intelligence Hub"
      userRole="admin"
      userName="Admin User"
      sidebarItems={adminSidebarItems}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">EduTrack Intelligence Hub</h1>
          <p className="text-gray-600">Academic Intelligence & Predictive Analytics Dashboard</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Students" value="1,234" icon="👥" color="blue" />
          <StatCard title="Total Teachers" value="45" icon="👨‍🏫" color="green" />
          <StatCard title="Active Classes" value="28" icon="🏫" color="yellow" />
          <StatCard title="Risk Predictions" value="89%" icon="🎯" color="red" />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card title="Academic Intelligence Activity">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-green-600">✅</span>
                <div>
                  <p className="text-sm font-medium">Risk assessment updated</p>
                  <p className="text-xs text-gray-500">Student: John Doe - Math 101 - 2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-red-600">⚠️</span>
                <div>
                  <p className="text-sm font-medium">High-risk student identified</p>
                  <p className="text-xs text-gray-500">Jane Smith - Attendance pattern alert - 15 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-blue-600">�</span>
                <div>
                  <p className="text-sm font-medium">Predictive model updated</p>
                  <p className="text-xs text-gray-500">Physics 201 - Pattern analysis complete - 1 hour ago</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card title="Intelligence Actions">
            <div className="grid grid-cols-1 gap-3">
              <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">👥</span>
                  <div>
                    <p className="font-medium text-blue-900">Add New Student</p>
                    <p className="text-sm text-blue-600">Register with analytics tracking</p>
                  </div>
                </div>
              </button>
              <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">👨‍🏫</span>
                  <div>
                    <p className="font-medium text-green-900">Add New Teacher</p>
                    <p className="text-sm text-green-600">Enable analytics access</p>
                  </div>
                </div>
              </button>
              <button className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-left transition-colors">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🏫</span>
                  <div>
                    <p className="font-medium text-yellow-900">Create Smart Class</p>
                    <p className="text-sm text-yellow-600">Setup with pattern tracking</p>
                  </div>
                </div>
              </button>
              <button className="p-4 bg-red-50 hover:bg-red-100 rounded-lg text-left transition-colors">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <p className="font-medium text-red-900">Generate Predictive Report</p>
                    <p className="text-sm text-red-600">Risk assessment analytics</p>
                  </div>
                </div>
              </button>
            </div>
          </Card>
        </div>

        {/* Additional Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Academic Intelligence Overview" className="lg:col-span-2">
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">📊 Predictive Analytics Chart Placeholder</p>
            </div>
          </Card>
          
          <Card title="Intelligence System Status">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Analytics Engine</span>
                <span className="text-green-600 text-sm">✅ Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Pattern Recognition</span>
                <span className="text-green-600 text-sm">✅ Running</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Analysis</span>
                <span className="text-gray-600 text-sm">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Risk Assessments</span>
                <span className="text-blue-600 text-sm">234 processed</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}