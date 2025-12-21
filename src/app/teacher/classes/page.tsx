"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getCoursesByTeacher } from "@/lib/firebaseServices";
import { useRouter } from "next/navigation";
import { Course } from "@/types";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { Card } from "@/components/ui/Card";

const teacherSidebarItems = [
  { name: "Dashboard", href: "/teacher", icon: "📊" },
  { name: "My Classes", href: "/teacher/classes", icon: "🏫" },
  { name: "Take Attendance", href: "/teacher/attendance", icon: "📋" },
  { name: "View Reports", href: "/teacher/reports", icon: "📈" },
  { name: "Students", href: "/teacher/students", icon: "👥" },
  { name: "Schedule", href: "/teacher/schedule", icon: "📅" },
  { name: "Profile", href: "/teacher/profile", icon: "👤" },
];

export default function TeacherClassesPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [selectedClass, setSelectedClass] = useState<Course | null>(null);
  const [teacherName, setTeacherName] = useState("Teacher");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        setTeacherName(user.displayName || user.email?.split('@')[0] || "Teacher");
        await loadClasses(user.uid);
      } else {
        setIsAuthenticated(false);
        router.push("/");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const loadClasses = async (teacherId: string) => {
    try {
      console.log('Loading classes for teacher:', teacherId);
      const coursesData = await getCoursesByTeacher(teacherId);
      console.log('Fetched courses:', coursesData.length, 'classes');
      setMyCourses(coursesData);
    } catch (error) {
      console.error("Failed to load classes:", error);
      alert("Failed to load classes. Please try refreshing the page.");
    }
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
      title="My Classes"
      userRole="teacher"
      userName={teacherName}
      sidebarItems={teacherSidebarItems}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
          <p className="text-gray-600">View all classes you're teaching this semester</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Classes</p>
                <p className="text-3xl font-bold text-blue-900">{myCourses.length}</p>
              </div>
              <span className="text-4xl">🏫</span>
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Total Students</p>
                <p className="text-3xl font-bold text-green-900">
                  {myCourses.reduce((sum, course) => sum + (course.studentIds?.length || 0), 0)}
                </p>
              </div>
              <span className="text-4xl">👥</span>
            </div>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Total Credits</p>
                <p className="text-3xl font-bold text-purple-900">
                  {myCourses.reduce((sum, course) => sum + (course.credits || 0), 0)}
                </p>
              </div>
              <span className="text-4xl">📚</span>
            </div>
          </div>
        </div>

        {/* Classes List */}
        {myCourses.length === 0 ? (
          <Card title="No Classes Yet">
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">🏫</span>
              <p className="text-gray-600 text-lg">You haven't been assigned to any classes yet.</p>
              <p className="text-gray-500 text-sm mt-2">Contact your administrator to get assigned to classes.</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedClass(course)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{course.name}</h3>
                    <p className="text-sm text-gray-500">{course.code}</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {course.credits} Credits
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <span className="mr-2">👥</span>
                    <span>{course.studentIds?.length || 0} Students Enrolled</span>
                  </div>

                  {course.schedule && (
                    <div className="flex items-center text-gray-600">
                      <span className="mr-2">📅</span>
                      <span>{course.schedule}</span>
                    </div>
                  )}

                  {course.department && (
                    <div className="flex items-center text-gray-600">
                      <span className="mr-2">🏢</span>
                      <span>{course.department}</span>
                    </div>
                  )}

                  {course.semester && (
                    <div className="flex items-center text-gray-600">
                      <span className="mr-2">📆</span>
                      <span>{course.semester}</span>
                    </div>
                  )}
                </div>

                {course.description && (
                  <p className="mt-4 text-sm text-gray-600 line-clamp-2">{course.description}</p>
                )}

                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/teacher/attendance?courseId=${course.id}`);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                  >
                    Take Attendance
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/teacher/reports?courseId=${course.id}`);
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                  >
                    View Reports
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Class Details Modal */}
        {selectedClass && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-8 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{selectedClass.name}</h2>
                <button
                  onClick={() => setSelectedClass(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Course Code</p>
                  <p className="font-medium">{selectedClass.code}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Enrolled Students</p>
                  <p className="font-medium">{selectedClass.studentIds?.length || 0} students</p>
                </div>

                {selectedClass.department && (
                  <div>
                    <p className="text-sm text-gray-600">Department</p>
                    <p className="font-medium">{selectedClass.department}</p>
                  </div>
                )}

                {selectedClass.schedule && (
                  <div>
                    <p className="text-sm text-gray-600">Schedule</p>
                    <p className="font-medium">{selectedClass.schedule}</p>
                  </div>
                )}

                {selectedClass.semester && (
                  <div>
                    <p className="text-sm text-gray-600">Semester</p>
                    <p className="font-medium">{selectedClass.semester}</p>
                  </div>
                )}

                {selectedClass.credits && (
                  <div>
                    <p className="text-sm text-gray-600">Credits</p>
                    <p className="font-medium">{selectedClass.credits}</p>
                  </div>
                )}

                {selectedClass.description && (
                  <div>
                    <p className="text-sm text-gray-600">Description</p>
                    <p className="text-sm text-gray-700">{selectedClass.description}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedClass(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setSelectedClass(null);
                    router.push(`/teacher/attendance?courseId=${selectedClass.id}`);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Take Attendance
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
