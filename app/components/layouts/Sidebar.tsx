// src/app/components/layouts/Sidebar.tsx
import { Link, useLocation } from "react-router-dom"
import { authStore } from "~/stores/authStore"
import { useState } from "react"
import {
  Home, Building2, Store, DoorOpen, Film, Users, Calendar,
  Ticket, DollarSign, Settings, ChevronDown, ChevronRight
} from "lucide-react"
import { Sun, Moon } from "lucide-react"
import { useThemeStore } from "~/stores/themeStore"
interface SidebarProps {
  className?: string
}
export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [openMenus, setOpenMenus] = useState<string[]>([])
  const location = useLocation()
  const { user } = authStore.getState()
  const { theme, toggleTheme } = useThemeStore()

  const isDark = theme === "dark"

  const activeClasses = isDark
    ? "bg-blue-500/20 text-blue-400 border-r-4 border-blue-500"
    : "bg-blue-100 text-blue-600 border-r-4 border-blue-400"

  const hoverClasses = isDark
    ? "hover:bg-blue-500/10 hover:text-blue-400"
    : "hover:bg-blue-50 hover:text-blue-600"
  const toggleMenu = (label: string) => {
    setOpenMenus(prev =>
      prev.includes(label)
        ? prev.filter(x => x !== label)
        : [...prev, label]
    )
  }

  const menuItems = [
    { icon: Home, label: "Tổng quan", to: "/admin", exact: true },
    {
      icon: Building2,
      label: "Quản lý rạp",
      children: [
        { label: "Chuỗi rạp", to: "/admin/cinema-chains" },
        { label: "Danh sách rạp", to: "/admin/cinemas" },
      ]
    },
   {
    icon: Film,
    label: "Quản lý phim",
    children: [
      { label: "Phim", to: "/admin/movie" },
      { label: "Diễn viên", to: "/admin/movie/actors" },
      { label: "Đạo diễn", to: "/admin/movie/directors" },
    ],
  },
    { icon: Calendar, label: "Lịch chiếu", to: "/admin/schedules" },
    { icon: Ticket, label: "Bán vé", to: "/seller/counter", roles: ["seller"] },
    { icon: DollarSign, label: "Doanh thu", to: "/admin/revenue" },
    { icon: Users, label: "Người dùng", to: "/admin/users", roles: ["admin"] },
    { icon: Settings, label: "Cài đặt", to: "/admin/settings" },
  ]

  const hasRole = (roles?: string[]) => !roles || roles.includes(user?.role?.toLowerCase() || "")
  const isActive = (to: string, exact?: boolean) => exact ? location.pathname === to : location.pathname.startsWith(to)
  // Thay đổi hover và active
  return (
    <aside className={`flex flex-col transition-all duration-300 h-screen flex-shrink-0 ${isDark ? "bg-gray-900 text-gray-100 border-gray-800" : "bg-white text-gray-800 border-gray-200"
      } ${collapsed ? "w-20" : "w-64"} border-r`}
    >

      {/* Brand */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700/20 dark:border-gray-800">
        {!collapsed && <span className="text-xl font-bold">CinemaPro</span>}
        {/* Toggle theme */}
        <button
          onClick={toggleTheme}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title={isDark ? "Chuyển sang sáng" : "Chuyển sang tối"}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-gray-700"
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>

      {/* User Panel */}
      <div className="flex items-center px-4 py-4 border-b border-gray-700 space-x-3">
        <img src="/avatar.png" className="w-8 h-8 rounded-full" alt="User" />
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-bold">{user?.username || "Admin"}</span>
            <span className="text-sm text-gray-400">{user?.role === "admin" ? "Quản trị viên" : "Nhân viên"}</span>
          </div>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto mt-2">
        <ul className="space-y-1">
          {menuItems.filter(item => hasRole(item.roles)).map(item => {
            if (item.children) {
              const isOpen = openMenus.includes(item.label)
              const hasActiveChild = item.children.some(c => location.pathname.startsWith(c.to))

              return (
                <li key={item.label}>
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={`flex items-center w-full px-4 py-2 rounded transition-all ${hasActiveChild ? activeClasses : hoverClasses
                      }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {!collapsed && <span className="ml-3 flex-1">{item.label}</span>}
                    {!collapsed && (isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
                  </button>
                  {!collapsed && isOpen && (
                    <ul className="ml-6 mt-1 space-y-1">
                      {item.children.map(child => (
                        <li key={child.to}>
                          <Link
                            to={child.to}
                            className={`flex items-center px-2 py-1 rounded transition-all text-sm ${isActive(child.to)
                              ? "bg-primary/20 text-primary font-medium"
                              : "text-gray-300 hover:bg-primary/10 hover:text-primary"
                              }`}
                          >
                            <span className="w-2 h-2 mr-2 bg-gray-400 rounded-full"></span>
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            }

            return (
              <li key={item.to || item.label}>
                <Link
                  to={item.to!}
                  className={`flex items-center px-4 py-2 rounded transition-all ${isActive(item.to!, item.exact) ? activeClasses : hoverClasses
                    }`}
                >
                  <item.icon className="w-5 h-5" />
                  {!collapsed && <span className="ml-3">{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer / Logout */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-700 text-sm text-gray-400">
          &copy; 2025 CinemaPro
        </div>
      )}
    </aside>
  )
}
