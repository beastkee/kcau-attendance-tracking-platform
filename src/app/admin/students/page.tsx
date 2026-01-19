"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUsersByRole, deleteUser, createUser, updateUser, getAttendanceByStudent } from "@/lib/firebaseServices";
import { User } from "@/types/firebase";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/ui/DashboardLayout";
import UserTable from "@/components/ui/UserTable";
import UserModal from "@/components/ui/UserModal";
import { analyzeStudentAttendance, RiskAssessment } from "@/lib/analytics";

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

export default function AdminStudentsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<User[]>([]);
  const [studentRisks, setStudentRisks] = useState<Record<string, RiskAssessment>>({});
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        loadStudents();
      } else {
        setIsAuthenticated(false);
        router.push("/admin");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const loadStudents = async () => {
    try {
      const studentsData = await getUsersByRole("student");
      setStudents(studentsData);
      
      // Calculate risk scores for all students
      await loadRisks(studentsData);
    } catch (error) {
      // Error handled
    }
  };

  const loadRisks = async (studentsData: User[]) => {
    try {
      const riskMap: Record<string, RiskAssessment> = {};
      
      // Fetch attendance and calculate risk for each student
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
      // Error handled
    }
  };

  const handleEdit = (student: User) => {
    setSelectedStudent(student);
    setModalMode("edit");
    setShowModal(true);
  };

  const handleDelete = async (userId: string) => {
    try {
      await deleteUser(userId);
      // Reload students after deletion
      await loadStudents();
      alert("Student deleted successfully");
    } catch (error) {
      // Error handled
      alert("Failed to delete student");
    }
  };

  const handleViewDetails = (student: User) => {
    setSelectedStudent(student);
    setShowDetails(true);
  };

  const handleAddStudent = () => {
    setSelectedStudent(null);
    setModalMode("add");
    setShowModal(true);
  };

  const handleSaveUser = async (userData: Partial<User>) => {
    try {
      if (modalMode === "add") {
        const newUser: User = {
          ...userData,
          role: "student",
          dateJoined: new Date().toISOString(),
          isEmailVerified: false,
        } as User;
        await createUser(newUser);
      } else if (selectedStudent?.id) {
        await updateUser(selectedStudent.id, userData);
      }
      await loadStudents();
      setShowModal(false);
    } catch (error) {
      // Error handled
      throw new Error("Failed to save student");
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
      title="Student Management"
      userRole="admin"
      userName="Admin User"
      sidebarItems={adminSidebarItems}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
            <p className="text-gray-600">View and manage all registered students</p>
          </div>
          <button
            onClick={handleAddStudent}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Add Student</span>
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{students.length}</p>
              </div>
              <div className="text-3xl">👥</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Risk</p>
                <p className="text-2xl font-bold text-red-600">
                  {Object.values(studentRisks).filter((r) => r.level === "high").length}
                </p>
              </div>
              <div className="text-3xl">🚨</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Medium Risk</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {Object.values(studentRisks).filter((r) => r.level === "medium").length}
                </p>
              </div>
              <div className="text-3xl">⚠️</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Risk</p>
                <p className="text-2xl font-bold text-green-600">
                  {Object.values(studentRisks).filter((r) => r.level === "low").length}
                </p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>
        </div>

        {/* User Table */}
        <UserTable
          users={students}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewDetails={handleViewDetails}
          riskData={studentRisks}
        />

        {/* Student Details Modal */}
        {showDetails && selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Student Details</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-4 pb-4 border-b">
                  <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-semibold">
                    {selectedStudent.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{selectedStudent.name}</h3>
                    <p className="text-gray-600">{selectedStudent.email}</p>
                  </div>
                </div>

                {/* Risk Assessment Card */}
                {selectedStudent.id && studentRisks[selectedStudent.id] && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Risk Assessment</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Risk Level:</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          studentRisks[selectedStudent.id].level === "high"
                            ? "bg-red-100 text-red-700"
                            : studentRisks[selectedStudent.id].level === "medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}>
                          {studentRisks[selectedStudent.id].level.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Risk Score:</span>
                        <span className="font-semibold">{studentRisks[selectedStudent.id].score.toFixed(1)}%</span>
                      </div>
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-2">Breakdown:</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Attendance Rate:</span>
                            <span className="font-medium">{studentRisks[selectedStudent.id].breakdown.attendancePercentage.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Absences:</span>
                            <span className="font-medium">{studentRisks[selectedStudent.id].breakdown.absences}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Times Late:</span>
                            <span className="font-medium">{studentRisks[selectedStudent.id].breakdown.lates}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Sessions:</span>
                            <span className="font-medium">{studentRisks[selectedStudent.id].breakdown.totalSessions}</span>
                          </div>
                          {studentRisks[selectedStudent.id].breakdown.recentTrendSlope !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Recent Trend:</span>
                              <span className={`font-medium ${
                                studentRisks[selectedStudent.id].breakdown.recentTrendSlope! > 0 
                                  ? "text-green-600" 
                                  : studentRisks[selectedStudent.id].breakdown.recentTrendSlope! < 0 
                                  ? "text-red-600" 
                                  : "text-gray-600"
                              }`}>
                                {studentRisks[selectedStudent.id].breakdown.recentTrendSlope! > 0 ? "↗ Improving" : 
                                 studentRisks[selectedStudent.id].breakdown.recentTrendSlope! < 0 ? "↘ Declining" : 
                                 "→ Stable"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Student ID</p>
                    <p className="font-medium">{selectedStudent.identificationNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone Number</p>
                    <p className="font-medium">{selectedStudent.phoneNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Department</p>
                    <p className="font-medium">{selectedStudent.department || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Account Status</p>
                    <p className="font-medium capitalize">{selectedStudent.accountStatus}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email Verified</p>
                    <p className="font-medium">{selectedStudent.isEmailVerified ? "Yes" : "No"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date Joined</p>
                    <p className="font-medium">
                      {new Date(selectedStudent.dateJoined).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {selectedStudent.courses && selectedStudent.courses.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Enrolled Courses</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedStudent.courses.map((course, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
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
                    handleEdit(selectedStudent);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit Student
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Student Modal */}
        <UserModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleSaveUser}
          initialData={selectedStudent || undefined}
          mode={modalMode}
          role="student"
        />
      </div>
    </DashboardLayout>
  );
}
