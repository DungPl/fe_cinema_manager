import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Sidebar } from "~/components/layouts/Sidebar";
import { Navbar } from "~/components/layouts/Navbar";
import { ROUTE_PERMISSIONS } from "~/lib/permission";
import { useAuthStore } from "~/stores/authAccountStore";
import { useSidebarStore } from "~/stores/sidebarStore";
import { toast } from "sonner";
import type { UserRole } from "~/lib/api/types";

export default function AdminLayout() {
  const { account } = useAuthStore();
  const { collapsed } = useSidebarStore();
  const location = useLocation();
  const navigate = useNavigate();

  const sidebarWidth = collapsed ? 80 : 256;

  useEffect(() => {
  if (!account) {
    navigate("/login", { replace: true });
    return;
  }

  const currentPath = location.pathname;

  // Kiểm tra quyền chung cho tất cả route admin
  let allowedRoles: UserRole[] | undefined;

  // Tìm route khớp (bỏ qua :cinemaId)
  const matchedRoute = Object.entries(ROUTE_PERMISSIONS).find(([path]) =>
    currentPath.startsWith(path.replace("/:cinemaId", "").replace(/:\w+/g, "")) // Xử lý :param
  );

  if (matchedRoute) {
    allowedRoles = matchedRoute[1];
  }

  // Nếu route không có trong permissions → chặn (trừ route đặc biệt)
  if (!allowedRoles) {
    // Cho phép Manager vào /admin/cinemas/:cinemaId/rooms
    if (currentPath.match(/\/admin\/cinemas\/\d+\/rooms$/)) {
      allowedRoles = ["ADMIN", "MANAGER"];
    } else {
      toast.error("Bạn không có quyền truy cập trang này.");
      navigate("/forbidden", { replace: true });
      return;
    }
  }

  // Kiểm tra role
  if (!allowedRoles.includes(account.role)) {
    toast.error("Bạn không có quyền truy cập trang này.");
    navigate("/forbidden", { replace: true });
    return;
  }

  // Đặc biệt cho Manager: chỉ cho xem rạp của mình
  if (account.role === "MANAGER") {
    const cinemaIdMatch = currentPath.match(/\/cinemas\/(\d+)/);
    if (cinemaIdMatch) {
      const requestedCinemaId = Number(cinemaIdMatch[1]);
      if (requestedCinemaId !== account.cinemaId) {
        toast.error("Bạn chỉ được quản lý rạp của mình.");
        navigate("/forbidden", { replace: true });
        return;
      }
    }
  }
}, [account, location.pathname, navigate]);

  if (!account) return null;

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
  );
}