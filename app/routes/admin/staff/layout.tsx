// routes/staff/layout.tsx
import { Navigate, Outlet } from "react-router-dom"
import { useAuthStore } from "~/stores/authAccountStore"
import { toast } from "sonner"
import { StaffSidebar } from "~/components/layouts/StaffSidebar"
import { Navbar } from "~/components/layouts/Navbar"

export default function StaffLayout() {
  const { account, isTicketSeller } = useAuthStore()

    

  // Kiểm tra quyền
  if (!account || !isTicketSeller) {
    toast.error("Bạn không có quyền truy cập khu vực này.")
    return <Navigate to="/admin/login" replace />
  }

  // Giả sử Sidebar có width động (ví dụ 256px khi mở, 80px khi collapse)
  // Bạn có thể lấy từ store nếu Sidebar có collapse
  const sidebarWidth = 256 // hoặc dùng useState/useStore để collapse

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar fixed bên trái */}
      <aside
        className="fixed top-0 left-0 h-screen z-40 bg-white shadow-lg transition-all duration-300"
        style={{ width: `${sidebarWidth}px` }}
      >
        <StaffSidebar />
      </aside>

      {/* Phần nội dung chính: offset sang phải bằng sidebarWidth */}
      <div className="flex-1 flex flex-col" style={{ marginLeft: `${sidebarWidth}px` }}>
        {/* Navbar fixed top, offset left bằng sidebar */}
        <header
          className="fixed top-0 z-30 bg-white shadow transition-all duration-300"
          style={{ left: `${sidebarWidth}px`, right: 0 }}
        >
          <Navbar />
        </header>

        {/* Main content: padding-top bằng chiều cao Navbar (thường 14 hoặc 16) */}
        <main className="flex-1 overflow-y-auto pt-16 p-6">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t p-3 text-sm text-center text-gray-500 bg-white">
          © 2025 CinemaPro - Quầy vé
        </footer>
      </div>
    </div>
  )
}