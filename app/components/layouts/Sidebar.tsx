// components/Sidebar.tsx
import { Link, useLocation } from "react-router"
import { useAuthStore } from "~/stores/authAccountStore"
import {
  Home, Building2, Film, Calendar,
  Users, DollarSign, Settings,
  ChevronDown, ChevronRight,
  Ticket, Scan,
  BarChart3
} from "lucide-react"
import { Sun, Moon } from "lucide-react"
import { useThemeStore } from "~/stores/themeStore"
import { useSidebarStore } from "~/stores/sidebarStore"
import { useState } from "react"

interface SidebarProps {
  className?: string
}

type UserRole = "ADMIN" | "MANAGER" | "MODERATOR" | "STAFF"
type MenuItem = {
  icon?: React.ElementType
  label: string
  to?: string
  exact?: boolean
  roles?: UserRole[]
  children?: MenuItem[]
}

export function Sidebar({ className }: SidebarProps) {
  const { collapsed, toggleCollapsed } = useSidebarStore()
  const [openMenus, setOpenMenus] = useState<string[]>([])
  const location = useLocation()
  const account = useAuthStore(state => state.account)
  const { theme, toggleTheme } = useThemeStore()

  const role = account?.role as UserRole | undefined
  const isDark = theme === "dark"

  const activeClasses = isDark
    ? "bg-blue-500/20 text-blue-400 border-r-4 border-blue-500"
    : "bg-blue-100 text-blue-600 border-r-4 border-blue-400"

  const hoverClasses = isDark
    ? "hover:bg-blue-500/10 hover:text-blue-400"
    : "hover:bg-blue-50 hover:text-blue-600"

  const toggleMenu = (label: string) => {
    setOpenMenus(prev =>
      prev.includes(label) ? prev.filter(x => x !== label) : [...prev, label]
    )
  }

  const hasRole = (roles?: UserRole[]) => {
    if (!roles) return true
    if (!role) return false
    return roles.includes(role)
  }

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to)

  /** ================= MENU CONFIG ================= */
  const menuItems: MenuItem[] = [
    // Trang tổng quan (chung ADMIN/MANAGER/STAFF)
    {
      icon: Home,
      label: "Tổng quan",
      to: "/admin",
      exact: true,
      roles: ["ADMIN", "MANAGER", "STAFF", "MODERATOR"],
    },

    // Chỉ STAFF: Tạo vé & Check-in
    {
      icon: Ticket,
      label: "Tạo vé tại quầy",
      to: "/staff/create-ticket",
      roles: ["STAFF"],
    },
    {
      icon: Scan,
      label: "Check-in vé",
      to: "/staff/check-in",
      roles: ["STAFF"],
    },

    // Quản lý rạp (ADMIN)
    {
      icon: Building2,
      label: "Quản lý rạp",
      roles: ["ADMIN"],
      children: [
        { label: "Chuỗi rạp", to: "/admin/cinema-chains", roles: ["ADMIN"] },
        { label: "Danh sách rạp", to: "/admin/cinemas", roles: ["ADMIN"] },
      ],
    },

    // Phòng chiếu (ADMIN + MANAGER)
    {
      icon: Film,
      label: "Phòng chiếu",
      to: account?.role === "MANAGER" && account.cinemaId
        ? `/admin/cinemas/${account.cinemaId}/rooms`
        : "/admin/cinemas",
      roles: ["ADMIN", "MANAGER"],
    },

    // Lịch chiếu (ADMIN + MANAGER)
    {
      icon: Calendar,
      label: "Lịch chiếu",
      to: "/admin/showtime",
      roles: ["ADMIN", "MANAGER"],
    },

    // Quản lý phim (ADMIN + MODERATOR)
    {
      icon: Film,
      label: "Quản lý phim",
      roles: ["ADMIN", "MODERATOR"],
      children: [
        { label: "Phim", to: "/admin/movie", roles: ["ADMIN", "MODERATOR"] },
        { label: "Diễn viên", to: "/admin/movie/actors", roles: ["ADMIN", "MODERATOR"] },
        { label: "Đạo diễn", to: "/admin/movie/directors", roles: ["ADMIN", "MODERATOR"] },
      ],
    },
    // Người dùng (ADMIN)
    {
      icon: Users,
      label: "Người dùng",
      to: "/admin/staff",
      roles: ["ADMIN"],
    },
    {
      label: "Báo cáo",
      icon: BarChart3,
      children: [
        { label: "Tổng hợp", to: "/admin/reports/dashboard" },
        { label: "No-Show", to: "/admin/reports/no-show" },
        { label: "Check-in Nhân viên", to: "/admin/reports/staff-checkin" },
        { label: "Khách hàng không check in ", to: "/admin/reports/no-show-tickets" },
      ],
    },
    // Cài đặt (ADMIN)
    {
      icon: Settings,
      label: "Cài đặt",
      to: "/admin/settings",
      roles: ["ADMIN"],
    },
  ]

  /** ================= RENDER ================= */
  return (
    <aside
      className={`flex flex-col h-screen ${collapsed ? "w-20" : "w-64"} border-r transition-all duration-300 ${isDark ? "bg-gray-900 text-gray-100 border-gray-800" : "bg-white text-gray-800 border-gray-200"
        } ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b">
        {!collapsed && <span className="text-xl font-bold">CinemaPro</span>}

        <button onClick={toggleTheme} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <button onClick={toggleCollapsed} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
          {collapsed ? "»" : "«"}
        </button>
      </div>

      {/* User info */}
      <div className="flex items-center px-4 py-4 border-b space-x-3">
        <img src="/avatar.png" className="w-8 h-8 rounded-full" alt="User" />
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-semibold">{account?.username || "Admin"}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {role === "ADMIN" && "Quản trị viên"}
              {role === "MANAGER" && "Quản lý rạp"}
              {role === "MODERATOR" && "Kiểm duyệt nội dung"}
              {role === "STAFF" && "Nhân viên bán vé"}
            </span>
          </div>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto mt-2">
        <ul className="space-y-1">
          {menuItems
            .filter(item => hasRole(item.roles))
            .map(item => {
              if (item.children) {
                const isOpen = openMenus.includes(item.label)
                const hasActiveChild = item.children.some(c => isActive(c.to!))
                return (
                  <li key={item.label}>
                    <button
                      onClick={() => toggleMenu(item.label)}
                      className={`flex items-center w-full px-4 py-2 rounded transition-all ${hasActiveChild ? activeClasses : hoverClasses}`}
                    >
                      {item.icon ? <item.icon className="w-5 h-5" /> : null}
                      {!collapsed && <span className="ml-3 flex-1 text-left">{item.label}</span>}
                      {!collapsed && (isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
                    </button>

                    {!collapsed && isOpen && (
                      <ul className="ml-6 mt-1 space-y-1">
                        {item.children
                          .filter(c => hasRole(c.roles))
                          .map(child => (
                            <li key={child.to}>
                              <Link
                                to={child.to!}
                                className={`flex items-center px-4 py-1 text-sm rounded transition-all ${isActive(child.to!) ? activeClasses : hoverClasses}`}
                              >
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
                <li key={item.to}>
                  <Link
                    to={item.to!}
                    className={`flex items-center px-4 py-2 rounded transition-all ${isActive(item.to!, item.exact) ? activeClasses : hoverClasses}`}
                  >
                    {item.icon ? <item.icon className="w-5 h-5" /> : null}
                    {!collapsed && <span className="ml-3">{item.label}</span>}
                  </Link>
                </li>
              )
            })}
        </ul>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t text-sm text-gray-400 dark:text-gray-500">
          © 2025 CinemaPro
        </div>
      )}
    </aside>
  )
}