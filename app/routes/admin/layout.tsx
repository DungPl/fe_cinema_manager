// routes/admin/layout.tsx
import { Outlet, useLocation, useNavigate, Navigate } from "react-router-dom"
import { Sidebar } from "~/components/layouts/Sidebar"
import { Navbar } from "~/components/layouts/Navbar"
import { ROUTE_PERMISSIONS } from "~/lib/permission"
import { useAuthStore } from "~/stores/authAccountStore"
import { useSidebarStore } from "~/stores/sidebarStore"
import { toast } from "sonner"
import type { UserRole } from "~/lib/api/types"

export default function AdminLayout() {
  const { account, loading } = useAuthStore()
  const { collapsed } = useSidebarStore()
  const navigate = useNavigate()
  const location = useLocation()
  const sidebarWidth = collapsed ? 80 : 256

  // Kiểm tra ngay trong render (sync)
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Đang tải...</div>
  }

  // Chưa đăng nhập → redirect NGAY LẬP TỨC
  if (!account) {
    return <Navigate to="/admin/login" replace />
  }

  const role = account.role as UserRole

  // Chỉ cho ADMIN, MANAGER, MODERATOR vào layout admin
  const allowedRoles: UserRole[] = ["ADMIN", "MANAGER", "MODERATOR"]
  if (!allowedRoles.includes(role)) {
    toast.error("Bạn không có quyền truy cập khu vực này.")
    return <Navigate to="/forbidden" replace />
  }

  // Manager: Redirect nếu vào route không thuộc rạp của mình
  if (role === "MANAGER" && account.cinemaId) {
    const cinemaIdMatch = location.pathname.match(/\/cinemas\/(\d+)/)
    if (cinemaIdMatch && Number(cinemaIdMatch[1]) !== account.cinemaId) {
      toast.error("Bạn chỉ được quản lý rạp của mình.")
      navigate(`/admin/cinemas/${account.cinemaId}/rooms`, { replace: true })
      return null
    }
  }

  // STAFF: Redirect sang quầy vé
  if (role === "STAFF") {
    navigate("/staff/create-ticket", { replace: true })
    return null
  }

  // Kiểm tra chi tiết route permissions (từ ROUTE_PERMISSIONS)
  const currentPath = location.pathname
  let matchedRoles: UserRole[] | undefined

  const matchedRoute = Object.entries(ROUTE_PERMISSIONS).find(([path]) =>
    currentPath.startsWith(path.replace(/:\w+/g, "*"))
  )

  if (matchedRoute) {
    matchedRoles = matchedRoute[1]
  }

  if (matchedRoles && !matchedRoles.includes(role)) {
    toast.error("Bạn không có quyền truy cập trang này.")
    return <Navigate to="/forbidden" replace />
  }

  // Render layout bình thường
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className="fixed top-0 left-0 h-screen z-40 bg-white shadow-lg transition-all duration-300"
        style={{ width: `${sidebarWidth}px` }}
      >
        <Sidebar />
      </aside>

      {/* Navbar */}
      <header
        className="fixed top-0 right-0 h-14 z-30 bg-white shadow transition-all duration-300"
        style={{ left: `${sidebarWidth}px` }}
      >
        <Navbar />
      </header>

      {/* Main content */}
      <main
        className="pt-14 transition-all duration-300"
        style={{ marginLeft: `${sidebarWidth}px` }}
      >
        <div className="p-4 min-h-[calc(100vh-56px)]">
          <Outlet />
        </div>

        <footer className="border-t p-3 text-sm text-center text-gray-500 bg-white">
          © 2025 CinemaPro
        </footer>
      </main>
    </div>
  )
}