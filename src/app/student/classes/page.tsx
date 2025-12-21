"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getCoursesByStudent, getAllCourses, updateCourse } from "@/lib/firebaseServices";
import { useRouter } from "next/navigation";
import { Course } from "@/types";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { Card } from "@/components/ui/Card";

const studentSidebarItems = [
  { name: "Dashboard", href: "/student", icon: "📊" },
  { name: "My Classes", href: "/student/classes", icon: "🏫" },
  { name: "Attendance", href: "/student/attendance", icon: "📋" },
  { name: "Schedule", href: "/student/schedule", icon: "📅" },
  { name: "Reports", href: "/student/reports", icon: "📈" },
  { name: "Profile", href: "/student/profile", icon: "👤" },
];

export default function StudentClassesPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentStudentId, setCurrentStudentId] = useState<string>("");
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [selectedClass, setSelectedClass] = useState<Course | null>(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        setCurrentStudentId(user.uid);
        await loadData(user.uid);
      } else {
        setIsAuthenticated(false);
        router.push("/");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const loadData = async (studentId: string) => {
    try {
      const [enrolledCourses, allCourses] = await Promise.all([
        getCoursesByStudent(studentId),
        getAllCourses(),
      ]);
      
      setMyCourses(enrolledCourses);
      
      // Filter out already enrolled courses
      const available = allCourses.filter(
        course => !course.studentIds?.includes(studentId)
      );
      setAvailableCourses(available);
    } catch (error) {
      console.error("Failed to load classes:", error);
    }
  };

  const handleEnroll = async (courseId: string) => {
    if (!currentStudentId || !courseId) return;
    
    setEnrolling(true);
    try {
      const course = availableCourses.find(c => c.id === courseId);
      if (!course) return;

      const updatedStudentIds = [...(course.studentIds || []), currentStudentId];
      
      await updateCourse(courseId, { studentIds: updatedStudentIds });
      await loadData(currentStudentId);
      
      alert("Successfully enrolled in " + course.name);
      setShowEnrollModal(false);
    } catch (error) {
      console.error("Failed to enroll:", error);
      alert("Failed to enroll in class. Please try again.");
    } finally {
      setEnrolling(false);
    }
  };

  const handleUnenroll = async (courseId: string) => {
    if (!currentStudentId || !courseId) return;
    
    const confirmed = confirm("Are you sure you want to drop this class?");
    if (!confirmed) return;

    try {
      const course = myCourses.find(c => c.id === courseId);
      if (!course) return;

      const updatedStudentIds = (course.studentIds || []).filter(
        id => id !== currentStudentId
      );
      
      await updateCourse(courseId, { studentIds: updatedStudentIds });
      await loadData(currentStudentId);
      
      alert("Successfully dropped " + course.name);
    } catch (error) {
      console.error("Failed to unenroll:", error);
      alert("Failed to drop class. Please try again.");
    }
  };

  // Filter available courses based on search and department
  const filteredCourses = availableCourses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.teacherName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !filterDepartment || course.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  // Get unique departments
  const departments = Array.from(new Set(availableCourses.map(c => c.department).filter(Boolean)));

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
      userRole="student"
      userName="Student"
      sidebarItems={studentSidebarItems}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
            <p className="text-gray-600">View and manage your enrolled classes</p>
          </div>
          <button
            onClick={() => setShowEnrollModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Enroll in Class</span>
          </button>
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

          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Active Semester</p>
                <p className="text-lg font-bold text-green-900">
                  {myCourses[0]?.semester || "Current"}
                </p>
              </div>
              <span className="text-4xl">📆</span>
            </div>
          </div>
        </div>

        {/* Classes List */}
        {myCourses.length === 0 ? (
          <Card title="No Classes Yet">
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">🏫</span>
              <p className="text-gray-600 text-lg">You're not enrolled in any classes yet.</p>
              <p className="text-gray-500 text-sm mt-2">Contact your administrator to get enrolled.</p>
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
                    <span className="mr-2">👨‍🏫</span>
                    <span>{course.teacherName || "Teacher TBA"}</span>
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
                      router.push(`/student/attendance?courseId=${course.id}`);
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                  >
                    View Attendance
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnenroll(course.id!);
                    }}
                    className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
                  >
                    Drop
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Enrollment Modal */}
        {showEnrollModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Enroll in Classes</h2>
                  <p className="text-gray-600 text-sm">Browse and enroll in available courses</p>
                </div>
                <button
                  onClick={() => setShowEnrollModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Search and Filter */}
              <div className="mb-6 space-y-3">
                <input
                  type="text"
                  placeholder="Search by course name, code, or teacher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Available Courses */}
              <div className="space-y-3">
                {filteredCourses.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-4xl mb-2 block">📚</span>
                    <p className="text-gray-600">
                      {searchTerm || filterDepartment 
                        ? "No courses match your search"
                        : "No courses available for enrollment"}
                    </p>
                  </div>
                ) : (
                  filteredCourses.map((course) => (
                    <div
                      key={course.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-bold text-gray-900">{course.name}</h3>
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                              {course.code}
                            </span>
                            {course.credits && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                {course.credits} Credits
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-600">
                            {course.teacherName && (
                              <div className="flex items-center">
                                <span className="mr-2">👨‍🏫</span>
                                <span>{course.teacherName}</span>
                              </div>
                            )}
                            {course.department && (
                              <div className="flex items-center">
                                <span className="mr-2">🏢</span>
                                <span>{course.department}</span>
                              </div>
                            )}
                            {course.schedule && (
                              <div className="flex items-center">
                                <span className="mr-2">📅</span>
                                <span>{course.schedule}</span>
                              </div>
                            )}
                            {course.semester && (
                              <div className="flex items-center">
                                <span className="mr-2">📆</span>
                                <span>{course.semester}</span>
                              </div>
                            )}
                          </div>

                          {course.description && (
                            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                              {course.description}
                            </p>
                          )}

                          <div className="mt-2 text-xs text-gray-500">
                            {course.studentIds?.length || 0} students enrolled
                          </div>
                        </div>

                        <button
                          onClick={() => handleEnroll(course.id!)}
                          disabled={enrolling}
                          className="ml-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {enrolling ? "Enrolling..." : "Enroll"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowEnrollModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
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
                  <p className="text-sm text-gray-600">Instructor</p>
                  <p className="font-medium">{selectedClass.teacherName || "TBA"}</p>
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
                    router.push(`/student/attendance?courseId=${selectedClass.id}`);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  View Attendance
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
