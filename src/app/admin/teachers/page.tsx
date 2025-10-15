"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUsersByRole, deleteUser } from "@/lib/firebaseServices";
import { User } from "@/types/firebase";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/ui/DashboardLayout";
import UserTable from "@/components/ui/UserTable";

const adminSidebarItems = [
  { name: "Intelligence Hub", href: "/admin", icon: "📊" },
  { name: "Students", href: "/admin/students", icon: "👥" },
  { name: "Teachers", href: "/admin/teachers", icon: "👨‍🏫" },
  { name: "Classes", href: "/admin/classes", icon: "🏫" },
  { name: "Analytics", href: "/admin/analytics", icon: "📈" },
  { name: "Predictive Reports", href: "/admin/reports", icon: "🎯" },
  { name: "Settings", href: "/admin/settings", icon: "⚙️" },
];

export default function AdminTeachersPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<User | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        loadTeachers();
      } else {
        setIsAuthenticated(false);
        router.push("/admin");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const loadTeachers = async () => {
    try {
      const teachersData = await getUsersByRole("teacher");
      setTeachers(teachersData);
    } catch (error) {
      console.error("Error loading teachers:", error);
    }
  };

  const handleEdit = (teacher: User) => {
    setSelectedTeacher(teacher);
    // TODO: Open edit modal
    alert(`Edit functionality for ${teacher.name} will be implemented next`);
  };

  const handleDelete = async (userId: string) => {
    try {
      await deleteUser(userId);
      // Reload teachers after deletion
      await loadTeachers();
      alert("Teacher deleted successfully");
    } catch (error) {
      console.error("Error deleting teacher:", error);
      alert("Failed to delete teacher");
    }
  };

  const handleViewDetails = (teacher: User) => {
    setSelectedTeacher(teacher);
    setShowDetails(true);
  };

  const handleAddTeacher = () => {
    // TODO: Open add teacher modal
    alert("Add teacher functionality will be implemented next");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout
      title="Teacher Management"
      userRole="admin"
      userName="Admin User"
      sidebarItems={adminSidebarItems}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Teacher Management</h1>
            <p className="text-gray-600">View and manage all registered teachers</p>
          </div>
          <button
            onClick={handleAddTeacher}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Add Teacher</span>
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Teachers</p>
                <p className="text-2xl font-bold text-gray-900">{teachers.length}</p>
              </div>
              <div className="text-3xl">👨‍🏫</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {teachers.filter((t) => t.accountStatus === "active").length}
                </p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Suspended</p>
                <p className="text-2xl font-bold text-red-600">
                  {teachers.filter((t) => t.accountStatus === "suspended").length}
                </p>
              </div>
              <div className="text-3xl">🚫</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Email Verified</p>
                <p className="text-2xl font-bold text-blue-600">
                  {teachers.filter((t) => t.isEmailVerified).length}
                </p>
              </div>
              <div className="text-3xl">📧</div>
            </div>
          </div>
        </div>

        {/* User Table */}
        <UserTable
          users={teachers}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewDetails={handleViewDetails}
        />

        {/* Teacher Details Modal */}
        {showDetails && selectedTeacher && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Teacher Details</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-4 pb-4 border-b">
                  <div className="h-16 w-16 rounded-full bg-green-500 flex items-center justify-center text-white text-2xl font-semibold">
                    {selectedTeacher.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{selectedTeacher.name}</h3>
                    <p className="text-gray-600">{selectedTeacher.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Teacher ID</p>
                    <p className="font-medium">{selectedTeacher.identificationNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone Number</p>
                    <p className="font-medium">{selectedTeacher.phoneNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Department</p>
                    <p className="font-medium">{selectedTeacher.department || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Account Status</p>
                    <p className="font-medium capitalize">{selectedTeacher.accountStatus}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email Verified</p>
                    <p className="font-medium">{selectedTeacher.isEmailVerified ? "Yes" : "No"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date Joined</p>
                    <p className="font-medium">
                      {new Date(selectedTeacher.dateJoined).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {selectedTeacher.courses && selectedTeacher.courses.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Teaching Courses</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTeacher.courses.map((course, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                        >
                          {course}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    handleEdit(selectedTeacher);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Edit Teacher
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
