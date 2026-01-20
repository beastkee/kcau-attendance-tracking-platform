"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getAllCourses, deleteCourse, getUsersByRole, createCourse, updateCourse } from "@/lib/firebaseServices";
import { Course } from "@/types";
import { User } from "@/types/firebase";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/ui/DashboardLayout";
import ClassModal from "@/components/ui/ClassModal";

const adminSidebarItems = [
  { name: "Intelligence Hub", href: "/admin", icon: "📊" },
  { name: "Students", href: "/admin/students", icon: "👥" },
  { name: "Teachers", href: "/admin/teachers", icon: "👨‍🏫" },
  { name: "Classes", href: "/admin/classes", icon: "🏫" },
  { name: "Auto-Assign Students", href: "/admin/assignment", icon: "⚙️" },
  { name: "Assign Teachers to Classes", href: "/admin/teacher-assignment", icon: "🎓" },
  { name: "Analytics", href: "/admin/analytics", icon: "📈" },
  { name: "Predictive Reports", href: "/admin/reports", icon: "🎯" },
];

export default function AdminClassesPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [selectedClass, setSelectedClass] = useState<Course | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        loadData();
      } else {
        setIsAuthenticated(false);
        router.push("/admin");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const loadData = async () => {
    try {
      const [coursesData, teachersData] = await Promise.all([
        getAllCourses(),
        getUsersByRole("teacher"),
      ]);
      setClasses(coursesData);
      setTeachers(teachersData);
    } catch (error) {
      // Error handled
    }
  };

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    return teacher?.name || "Unassigned";
  };

  const handleAddClass = () => {
    setSelectedClass(null);
    setModalMode("add");
    setShowModal(true);
  };

  const handleEdit = (course: Course) => {
    setSelectedClass(course);
    setModalMode("edit");
    setShowModal(true);
  };

  const handleSaveCourse = async (courseData: Partial<Course>) => {
    try {
      if (modalMode === "add") {
        await createCourse(courseData as Omit<Course, 'id'>);
      } else if (selectedClass?.id) {
        await updateCourse(selectedClass.id, courseData);
      }
      await loadData();
      setShowModal(false);
    } catch (error) {
      // Error handled
      throw new Error("Failed to save course");
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!courseId) return;
    
    const confirmed = confirm("Are you sure you want to delete this class?");
    if (!confirmed) return;

    try {
      await deleteCourse(courseId);
      await loadData();
      alert("Class deleted successfully");
    } catch (error) {
      // Error handled
      alert("Failed to delete class");
    }
  };

  const handleViewDetails = (course: Course) => {
    setSelectedClass(course);
    setShowDetails(true);
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
      title="Class Management"
      userRole="admin"
      userName="Admin User"
      sidebarItems={adminSidebarItems}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Class Management</h1>
            <p className="text-gray-600">Create and manage classes, assign teachers, and enroll students</p>
          </div>
          <button
            onClick={handleAddClass}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Add Class</span>
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Classes</p>
                <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
              </div>
              <div className="text-3xl">🏫</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Teachers</p>
                <p className="text-2xl font-bold text-green-600">{teachers.length}</p>
              </div>
              <div className="text-3xl">👨‍🏫</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Enrollment</p>
                <p className="text-2xl font-bold text-blue-600">
                  {classes.length > 0 
                    ? Math.round(classes.reduce((sum, c) => sum + (c.studentIds?.length || 0), 0) / classes.length)
                    : 0}
                </p>
              </div>
              <div className="text-3xl">👥</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Enrollments</p>
                <p className="text-2xl font-bold text-purple-600">
                  {classes.reduce((sum, c) => sum + (c.studentIds?.length || 0), 0)}
                </p>
              </div>
              <div className="text-3xl">📚</div>
            </div>
          </div>
        </div>

        {/* Classes Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enrolled
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Schedule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {classes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No classes created yet. Click &quot;Add Class&quot; to get started.
                    </td>
                  </tr>
                ) : (
                  classes.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{course.code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{course.name}</div>
                        {course.department && (
                          <div className="text-xs text-gray-500">{course.department}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getTeacherName(course.teacherId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {course.studentIds?.length || 0} students
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {course.schedule || "Not set"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleViewDetails(course)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEdit(course)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(course.id!)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Class Details Modal */}
        {showDetails && selectedClass && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Class Details</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Course Code</p>
                    <p className="font-medium">{selectedClass.code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Course Name</p>
                    <p className="font-medium">{selectedClass.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Teacher</p>
                    <p className="font-medium">{getTeacherName(selectedClass.teacherId)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Enrolled Students</p>
                    <p className="font-medium">{selectedClass.studentIds?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Department</p>
                    <p className="font-medium">{selectedClass.department || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Schedule</p>
                    <p className="font-medium">{selectedClass.schedule || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Semester</p>
                    <p className="font-medium">{selectedClass.semester || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Credits</p>
                    <p className="font-medium">{selectedClass.credits || "N/A"}</p>
                  </div>
                </div>

                {selectedClass.description && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Description</p>
                    <p className="text-sm text-gray-700">{selectedClass.description}</p>
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
                    handleEdit(selectedClass);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Edit Class
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Class Modal */}
        <ClassModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleSaveCourse}
          initialData={selectedClass || undefined}
          mode={modalMode}
          teachers={teachers}
        />
      </div>
    </DashboardLayout>
  );
}
