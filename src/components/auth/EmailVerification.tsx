"use client";

import { useState, useEffect } from "react";
import { checkEmailVerification, resendEmailVerification, logoutUser } from "@/lib/firebaseServices";
import { useRouter } from "next/navigation";

interface EmailVerificationProps {
  userRole: "teacher" | "student" | "admin";
}

export default function EmailVerification({ userRole }: EmailVerificationProps) {
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const checkVerification = async () => {
    const verified = await checkEmailVerification();
    setIsVerified(verified);
    
    if (verified) {
      setMessage("Email verified! Redirecting to dashboard...");
      setTimeout(() => {
        router.push(`/${userRole}`);
      }, 2000);
    }
  };

  const handleResendEmail = async () => {
    setLoading(true);
    setMessage("");
    
    try {
      await resendEmailVerification();
      setMessage("Verification email sent! Please check your inbox.");
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      router.push("/");
    } catch (error) {
      // Error handled
    }
  };

  useEffect(() => {
    // Check verification status every 5 seconds
    const interval = setInterval(checkVerification, 5000);
    
    // Check immediately on mount
    checkVerification();
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Verify Your Email
          </h1>
          <p className="text-gray-600">
            We've sent a verification email to your school email address
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {!isVerified ? (
            <>
              <div className="text-6xl mb-4">📧</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Check Your Email
              </h2>
              <p className="text-gray-600 mb-6">
                Click the verification link in your email to activate your account.
                We're checking automatically...
              </p>

              {message && (
                <div className={`p-3 rounded mb-4 ${
                  message.includes("sent") 
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {message}
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleResendEmail}
                  disabled={loading}
                  className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? "Sending..." : "Resend Verification Email"}
                </button>

                <button
                  onClick={checkVerification}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  I've Verified - Check Now
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Logout & Try Different Email
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-xl font-semibold text-green-800 mb-4">
                Email Verified!
              </h2>
              <p className="text-green-600 mb-4">
                Your account has been verified successfully.
              </p>
              <div className="text-gray-600">
                Redirecting to your dashboard...
              </div>
            </>
          )}
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Didn't receive the email? Check your spam folder</p>
        </div>
      </div>
    </div>
  );
}