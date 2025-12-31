// ~/components/layouts/StaffSidebar.tsx
import { Link, useLocation } from "react-router-dom"
import { useAuthStore } from "~/stores/authAccountStore"
import { Ticket, Scan, LogOut } from "lucide-react"
import { useSidebarStore } from "~/stores/sidebarStore"

// Định nghĩa props cho StaffSidebar
interface StaffSidebarProps {
  className?: string
}

export function StaffSidebar({ className }: StaffSidebarProps) {
  
  const location = useLocation()
  const { logout } = useAuthStore()
  const { collapsed } = useSidebarStore()
const sidebarWidth = collapsed ? 80 : 256
  const isActive = (to: string) => location.pathname.startsWith(to)

  return (
    <aside
      className={`flex flex-col h-screen ${collapsed ? "w-20" : "w-64"} border-r transition-all duration-300 bg-white shadow-lg ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b">
        {!collapsed && <h2 className="text-xl font-bold">Quầy Vé</h2>}
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-2">
        <Link
          to="/staff/create-ticket"
          className={`flex items-center p-3 rounded-lg transition-all ${
            isActive("/staff/create-ticket") ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
          }`}
        >
          <Ticket className="w-5 h-5 mr-3" />
          {!collapsed && <span>Tạo vé</span>}
        </Link>

        <Link
          to="/staff/check-in"
          className={`flex items-center p-3 rounded-lg transition-all ${
            isActive("/staff/check-in") ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
          }`}
        >
          <Scan className="w-5 h-5 mr-3" />
          {!collapsed && <span>Check-in vé</span>}
        </Link>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t">
        <button
          onClick={logout}
          className="flex items-center p-3 rounded-lg w-full hover:bg-red-50 text-red-600 transition-all"
        >
          <LogOut className="w-5 h-5 mr-3" />
          {!collapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  )
}