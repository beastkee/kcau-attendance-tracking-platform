import Link from "next/link";

interface HeaderProps {
  title: string;
  userRole?: "admin" | "teacher" | "student";
  userName?: string;
}

export default function Header({ title, userRole, userName }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AP</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">{title}</span>
            </Link>
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-4">
            {userName && (
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  userRole === 'admin' ? 'bg-red-500' : 
                  userRole === 'teacher' ? 'bg-green-500' : 'bg-blue-500'
                }`} />
                <span className="text-sm font-medium text-gray-700">
                  {userName} ({userRole})
                </span>
              </div>
            )}
            <Link 
              href="/" 
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Logout
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}