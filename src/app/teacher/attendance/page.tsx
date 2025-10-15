"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { 
  getCoursesByTeacher, 
  getUsersByRole, 
  createAttendanceRecords,
  getAttendanceByDate 
} from "@/lib/firebaseServices";
import { Course, AttendanceRecord } from "@/types";
import { User } from "@/types/firebase";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/ui/DashboardLayout";

const teacherSidebarItems = [
  { name: "Dashboard", href: "/teacher", icon: "📊" },
  { name: "My Classes", href: "/teacher/classes", icon: "🏫" },
  { name: "Take Attendance", href: "/teacher/attendance", icon: "📋" },
  { name: "View Reports", href: "/teacher/reports", icon: "📈" },
  { name: "Students", href: "/teacher/students", icon: "👥" },
  { name: "Profile", href: "/teacher/profile", icon: "👤" },
];

export default function TeacherAttendancePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [saving, setSaving] = useState(false);
  const [currentTeacherId, setCurrentTeacherId] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        setCurrentTeacherId(user.uid);
        await loadTeacherCourses(user.uid);
      } else {
        setIsAuthenticated(false);
        router.push("/");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const loadTeacherCourses = async (teacherId: string) => {
    try {
      const coursesData = await getCoursesByTeacher(teacherId);
      setCourses(coursesData);
    } catch (error) {
    }
  };

  const handleCourseSelect = async (course: Course) => {
    setSelectedCourse(course);
    setAttendanceData({});
    
    // Load students enrolled in this course
    try {
      const allStudents = await getUsersByRole("student");
      const enrolledStudents = allStudents.filter(s => 
        course.studentIds?.includes(s.id || "")
      );
      setStudents(enrolledStudents);
      
      // Check if attendance already exists for this date
      const existingAttendance = await getAttendanceByDate(course.id!, attendanceDate);
      const existingData: Record<string, 'present' | 'absent' | 'late'> = {};
      existingAttendance.forEach(record => {
        existingData[record.studentId] = record.status;
      });
      setAttendanceData(existingData);
    } catch (error) {
    }
  };

  const handleAttendanceChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleMarkAll = (status: 'present' | 'absent' | 'late') => {
    const newData: Record<string, 'present' | 'absent' | 'late'> = {};
    students.forEach(student => {
      if (student.id) {
        newData[student.id] = status;
      }
    });
    setAttendanceData(newData);
  };

  const saveAttendance = async () => {
    if (!selectedCourse?.id) return;
    
    setSaving(true);
    try {
      const records: Omit<AttendanceRecord, 'id'>[] = [];
      
      students.forEach(student => {
        if (student.id && attendanceData[student.id]) {
          records.push({
            studentId: student.id,
            courseId: selectedCourse.id!,
            date: attendanceDate,
            status: attendanceData[student.id],
            markedBy: currentTeacherId,
          });
        }
      });
      
      if (records.length > 0) {
        await createAttendanceRecords(records);
        alert(`Attendance saved successfully for ${records.length} students!`);
      } else {
        alert("Please mark attendance for at least one student");
      }
    } catch (error) {
      alert("Failed to save attendance. Please try again.");
    } finally {
      setSaving(false);
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
      title="Take Attendance"
      userRole="teacher"
      userName="Teacher"
      sidebarItems={teacherSidebarItems}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Take Attendance</h1>
          <p className="text-gray-600">Mark student attendance for your classes</p>
        </div>

        {/* Course Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Class & Date</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
              <select 
                value={selectedCourse?.id || ""} 
                onChange={(e) => {
                  const course = courses.find(c => c.id === e.target.value);
                  if (course) handleCourseSelect(course);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              >
                <option value="">Select a class</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name} ({course.studentIds?.length || 0} students)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input 
                type="date" 
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Attendance Marking */}
        {selectedCourse && students.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Mark Attendance - {selectedCourse.name}
              </h2>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleMarkAll('present')}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
                >
                  All Present
                </button>
                <button 
                  onClick={() => handleMarkAll('absent')}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                >
                  All Absent
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {students.map(student => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-500">{student.identificationNumber}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAttendanceChange(student.id!, 'present')}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        attendanceData[student.id!] === 'present'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Present
                    </button>
                    <button
                      onClick={() => handleAttendanceChange(student.id!, 'late')}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        attendanceData[student.id!] === 'late'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Late
                    </button>
                    <button
                      onClick={() => handleAttendanceChange(student.id!, 'absent')}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        attendanceData[student.id!] === 'absent'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={saveAttendance}
                disabled={saving || Object.keys(attendanceData).length === 0}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Attendance"}
              </button>
            </div>
          </div>
        )}

        {selectedCourse && students.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">No students enrolled in this class yet.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
