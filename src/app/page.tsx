"use client";

import { useState } from "react";
import { loginUser, checkEmailVerification } from "@/lib/firebaseServices";
import { useRouter } from "next/navigation";
import RegisterForm from "@/components/auth/RegisterForm";
import EmailVerification from "@/components/auth/EmailVerification";

type UserRole = "teacher" | "student" | null;
type PageState = "roleSelect" | "login" | "register" | "emailVerification";

export default function Home() {
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [pageState, setPageState] = useState<PageState>("roleSelect");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    setLoading(true);
    setError("");

    try {
      await loginUser(email, password);
      
      // Check if email is verified
      const isVerified = await checkEmailVerification();
      if (!isVerified) {
        setPageState("emailVerification");
      } else {
        router.push(`/${selectedRole}`);
      }
    } catch (error) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedRole(null);
    setPageState("roleSelect");
    setEmail("");
    setPassword("");
    setError("");
  };

  const handleRegistrationSuccess = () => {
    setPageState("emailVerification");
  };

  if (pageState === "emailVerification" && selectedRole) {
    return <EmailVerification userRole={selectedRole} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            EduTrack Academic Intelligence
          </h1>
          <p className="text-gray-600 text-sm">
            Predictive Analytics for Student Success
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Real-time attendance tracking with behavioral pattern analysis
          </p>
        </div>

        {pageState === "roleSelect" && (
          /* Role Selection */
          <div className="bg-white rounded-lg shadow-lg p-8 space-y-4">
            <h2 className="text-xl font-semibold text-center text-gray-800 mb-6">
              Access Your Intelligence Dashboard
            </h2>
            
            <button 
              onClick={() => {
                setSelectedRole("teacher");
                setPageState("login");
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Teacher Analytics Portal
            </button>
            
            <button 
              onClick={() => {
                setSelectedRole("student");
                setPageState("login");
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Student Success Portal
            </button>
          </div>
        )}

        {pageState === "login" && selectedRole && (
          /* Login Form */
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800 capitalize">
                {selectedRole === "teacher" ? "Teacher Analytics" : "Student Success"} Login
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                ← Back
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Institutional Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your institutional email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  selectedRole === "teacher"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {loading ? "Accessing Dashboard..." : "Access Dashboard"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Need access to EduTrack?{" "}
                <button
                  onClick={() => setPageState("register")}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Register here
                </button>
              </p>
            </div>
          </div>
        )}

        {pageState === "register" && selectedRole && (
          <RegisterForm
            role={selectedRole}
            onBack={() => setPageState("login")}
            onSuccess={handleRegistrationSuccess}
          />
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>© 2025 EduTrack Academic Intelligence Platform. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
