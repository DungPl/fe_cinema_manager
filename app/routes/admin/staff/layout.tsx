// routes/staff/layout.tsx
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { useEffect } from "react"
import { useAuthStore } from "~/stores/authAccountStore"
import { toast } from "sonner"
import { StaffSidebar } from "~/components/layouts/StaffSidebar" // Sidebar riêng cho staff
import { Navbar } from "~/components/layouts/Navbar" // Có thể dùng chung hoặc riêng

export default function StaffLayout() {
  const { account, isTicketSeller } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!account || !isTicketSeller) {
      toast.error("Bạn không có quyền truy cập khu vực này.")
      navigate("/login", { replace: true })
      return
    }
  }, [account, isTicketSeller, navigate])

  if (!account || !isTicketSeller) return null

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar riêng cho STAFF */}
      <StaffSidebar className="fixed top-0 left-0 h-screen z-40" />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar (có thể đơn giản hơn cho staff) */}
        <Navbar />

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
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