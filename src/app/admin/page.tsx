"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { 
  getUsersByRole, 
  getAllCourses,
  updateUser,
  deleteUser,
  getAttendanceByStudent,
  enrollStudent,
  unenrollStudent
} from "@/lib/firebaseServices";
import { User } from "@/types/firebase";
import { Course } from "@/types";
import { analyzeStudentAttendance, RiskAssessment } from "@/lib/analytics";
import AdminLogin from "@/components/auth/AdminLogin";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { Card, StatCard } from "@/components/ui/Card";
import RiskBadge from "@/components/intelligence/RiskBadge";

const adminSidebarItems = [
  { name: "Intelligence Hub", href: "/admin", icon: "📊" },
  { name: "Students", href: "/admin/students", icon: "👥" },
  { name: "Teachers", href: "/admin/teachers", icon: "👨‍🏫" },
  { name: "Classes", href: "/admin/classes", icon: "🏫" },
  { name: "Analytics", href: "/admin/analytics", icon: "📈" },
  { name: "Predictive Reports", href: "/admin/reports", icon: "🎯" },
  { name: "Settings", href: "/admin/settings", icon: "⚙️" },
];

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<User[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [studentRisks, setStudentRisks] = useState<Record<string, RiskAssessment>>({});
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editRole, setEditRole] = useState<string>("");
  const [editStatus, setEditStatus] = useState<string>("");
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollingStudent, setEnrollingStudent] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setLoading(false);
      
      if (user) {
        loadData();
      }
    });

    return () => unsubscribe();
  }, []);

  const loadData = async () => {
    try {
      // BUG: This loads all data on mount - should paginate for scale
      const [studentsData, teachersData, coursesData] = await Promise.all([
        getUsersByRole("student"),
        getUsersByRole("teacher"),
        getAllCourses(),
      ]);
      
      setStudents(studentsData);
      setTeachers(teachersData);
      setCourses(coursesData);
      
      // Calculate risk for all students
      await loadRisks(studentsData);
    } catch (error) {
    }
  };

  const loadRisks = async (studentsData: User[]) => {
    try {
      const riskMap: Record<string, RiskAssessment> = {};
      
      await Promise.all(
        studentsData.map(async (student) => {
          if (student.id) {
            const attendanceRecords = await getAttendanceByStudent(student.id);
            const riskAssessment = analyzeStudentAttendance(attendanceRecords);
            riskMap[student.id] = riskAssessment;
          }
        })
      );
      
      setStudentRisks(riskMap);
    } catch (error) {
    }
  };

  const editUser = (user: User) => {
    setSelectedUser(user);
    setEditRole(user.role);
    setEditStatus(user.accountStatus);
    setShowEditModal(true);
  };

  // TODO: Add optimistic updates for better UX
  const handleSaveEdit = async () => {
    if (!selectedUser || !selectedUser.id) return;

    try {
      await updateUser(selectedUser.id, {
        role: editRole as "student" | "teacher" | "admin",
        accountStatus: editStatus as "active" | "inactive" | "suspended",
      });
      
      alert("User updated successfully!");
      setShowEditModal(false);
      loadData(); // Reload to reflect changes
    } catch (error) {
      alert("Failed to update user");
    }
  };

  const handleEnrollCourses = (student: User) => {
    setEnrollingStudent(student);
    setSelectedCourses(student.courses || []);
    setShowEnrollModal(true);
  };

  const handleSaveEnrollment = async () => {
    if (!enrollingStudent || !enrollingStudent.id) return;

    try {
      const currentCourses = enrollingStudent.courses || [];
      
      // Find courses to add and remove
      const toAdd = selectedCourses.filter(c => !currentCourses.includes(c));
      const toRemove = currentCourses.filter(c => !selectedCourses.includes(c));
      
      // Enroll in new courses
      for (const courseId of toAdd) {
        await enrollStudent(courseId, enrollingStudent.id);
      }
      
      // Unenroll from removed courses
      for (const courseId of toRemove) {
        await unenrollStudent(courseId, enrollingStudent.id);
      }
      
      alert("Course enrollment updated!");
      setShowEnrollModal(false);
      loadData();
    } catch (error) {
      alert("Failed to update enrollment");
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteUser(userId);
      alert("User deleted successfully");
      loadData();
    } catch (error) {
      alert("Failed to delete user");
    }
  };

  const getCoursesByStudent = (studentId: string) => {
    return courses.filter(course => course.studentIds?.includes(studentId));
  };

  const getHighRiskCount = () => {
    return Object.values(studentRisks).filter(r => r.level === "high").length;
  };

  const getMediumRiskCount = () => {
    return Object.values(studentRisks).filter(r => r.level === "medium").length;
  };

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
          <p className="text-gray-600">Automated User Categorization & Real-Time Analytics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Students" value={students.length.toString()} icon="👥" color="blue" />
          <StatCard title="Total Teachers" value={teachers.length.toString()} icon="👨‍🏫" color="green" />
          <StatCard title="Active Classes" value={courses.length.toString()} icon="🏫" color="yellow" />
          <StatCard 
            title="High Risk Students" 
            value={getHighRiskCount().toString()} 
            icon="🚨" 
            color="red" 
          />
        </div>

        {/* Auto-Categorized Users Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Students Section */}
          <Card title="📚 Students (Auto-Categorized)">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {students.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No students registered yet</p>
              ) : (
                students.slice(0, 10).map((student) => {
                  const enrolledCourses = getCoursesByStudent(student.id || "");
                  const risk = student.id ? studentRisks[student.id] : null;
                  
                  return (
                    <div
                      key={student.id}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{student.name}</p>
                            {risk && <RiskBadge level={risk.level} score={risk.score} />}
                          </div>
                          <p className="text-xs text-gray-500">{student.email}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            ID: {student.identificationNumber} | {student.department || "No dept"}
                          </p>
                          {enrolledCourses.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {enrolledCourses.map((course) => (
                                <span
                                  key={course.id}
                                  className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded"
                                >
                                  {course.code}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 mt-1 italic">Not enrolled in any course</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 ml-2">
                          <button
                            onClick={() => editUser(student)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                            title="Quick Edit"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleEnrollCourses(student)}
                            className="text-xs text-green-600 hover:text-green-800"
                            title="Manage Courses"
                          >
                            Courses
                          </button>
                          <button
                            onClick={() => handleDeleteUser(student.id!, student.name)}
                            className="text-xs text-red-600 hover:text-red-800"
                            title="Delete User"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              {students.length > 10 && (
                <button
                  onClick={() => window.location.href = '/admin/students'}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-800 py-2"
                >
                  View all {students.length} students →
                </button>
              )}
            </div>
          </Card>

          {/* Teachers Section */}
          <Card title="👨‍🏫 Teachers (Auto-Categorized)">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {teachers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No teachers registered yet</p>
              ) : (
                teachers.map((teacher) => {
                  const teachingCourses = courses.filter(c => c.teacherId === teacher.id);
                  
                  return (
                    <div
                      key={teacher.id}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{teacher.name}</p>
                          <p className="text-xs text-gray-500">{teacher.email}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            ID: {teacher.identificationNumber} | {teacher.department || "No dept"}
                          </p>
                          {teachingCourses.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {teachingCourses.map((course) => (
                                <span
                                  key={course.id}
                                  className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded"
                                >
                                  {course.code}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 mt-1 italic">Not assigned to any course</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 ml-2">
                          <button
                            onClick={() => editUser(teacher)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                            title="Quick Edit"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(teacher.id!, teacher.name)}
                            className="text-xs text-red-600 hover:text-red-800"
                            title="Delete User"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              {teachers.length > 10 && (
                <button
                  onClick={() => window.location.href = '/admin/teachers'}
                  className="w-full text-center text-sm text-green-600 hover:text-green-800 py-2"
                >
                  View all {teachers.length} teachers →
                </button>
              )}
            </div>
          </Card>
        </div>

        {/* Risk Distribution & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Risk Distribution */}
          <Card title="🎯 Risk Distribution" className="lg:col-span-2">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-3xl font-bold text-red-600">{getHighRiskCount()}</div>
                <div className="text-sm text-red-700 mt-1">High Risk</div>
                <div className="text-xs text-red-600 mt-1">Immediate Attention</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-3xl font-bold text-yellow-600">{getMediumRiskCount()}</div>
                <div className="text-sm text-yellow-700 mt-1">Medium Risk</div>
                <div className="text-xs text-yellow-600 mt-1">Monitoring Required</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">
                  {students.length - getHighRiskCount() - getMediumRiskCount()}
                </div>
                <div className="text-sm text-green-700 mt-1">Low Risk</div>
                <div className="text-xs text-green-600 mt-1">Good Standing</div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900 font-medium">📊 Real-Time Analytics</p>
              <p className="text-xs text-blue-700 mt-1">
                All risk scores automatically calculated from attendance patterns. 
                System updates in real-time as teachers mark attendance.
              </p>
            </div>
          </Card>

          {/* System Status */}
          <Card title="⚙️ System Status">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                <span className="text-sm font-medium">Auto-Categorization</span>
                <span className="text-green-600 text-sm">✅ Active</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                <span className="text-sm font-medium">Risk Analytics</span>
                <span className="text-green-600 text-sm">✅ Running</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">Total Users</span>
                <span className="text-gray-700 text-sm font-medium">
                  {students.length + teachers.length}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">Active Courses</span>
                <span className="text-gray-700 text-sm font-medium">{courses.length}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Edit Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Edit: {selectedUser.name}</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800">
                    ⚠️ <strong>Note:</strong> Changing role will re-categorize this user. 
                    They will appear in the appropriate section (Students/Teachers).
                  </p>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Course Enrollment Modal */}
        {showEnrollModal && enrollingStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Manage Courses: {enrollingStudent.name}
              </h3>
              
              <div className="space-y-3 mb-6">
                {courses.length === 0 ? (
                  <p className="text-gray-500 text-sm">No courses available. Create courses first.</p>
                ) : (
                  courses.map((course) => (
                    <label
                      key={course.id}
                      className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCourses.includes(course.id!)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCourses([...selectedCourses, course.id!]);
                          } else {
                            setSelectedCourses(selectedCourses.filter(id => id !== course.id));
                          }
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{course.name}</p>
                        <p className="text-xs text-gray-500">{course.code} | {course.department}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          Teacher: {teachers.find(t => t.id === course.teacherId)?.name || "Unassigned"}
                        </p>
                      </div>
                    </label>
                  ))
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleSaveEnrollment}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Save Enrollment
                </button>
                <button
                  onClick={() => setShowEnrollModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
