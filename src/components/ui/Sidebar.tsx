import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarItem {
  name: string;
  href: string;
  icon: string;
}

interface SidebarProps {
  items: SidebarItem[];
  userRole: "admin" | "teacher" | "student";
}

export default function Sidebar({ items, userRole }: SidebarProps) {
  const pathname = usePathname();

  const roleColors = {
    admin: "bg-red-600 hover:bg-red-700",
    teacher: "bg-green-600 hover:bg-green-700", 
    student: "bg-blue-600 hover:bg-blue-700"
  };

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 h-full">
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 capitalize">
          {userRole} Dashboard
        </h3>
        <nav className="space-y-2">
          {items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? `${roleColors[userRole]} text-white`
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}