import { Navigate, Outlet, redirect, useLocation } from "react-router";
import { Sidebar } from "~/components/layouts/Sidebar";
import { Navbar } from "~/components/layouts/Navbar";
import { ROUTE_PERMISSIONS } from "~/lib/permission";
import { useAuthStore } from "~/stores/authAccountStore";
import { useSidebarStore } from "~/stores/sidebarStore";
import { toast } from "sonner";
import type { UserRole } from "~/lib/api/types";
export async function loader({ request }: { request: Request }) {
  const cookieHeader = request.headers.get("cookie")

  const res = await fetch("http://localhost:8002/api/v1/account/me", {
    headers: { cookie: cookieHeader || "" },
    credentials: "include",
  })

  if (!res.ok) {
    return redirect("/admin/login")
  }

  const data = await res.json()
  const user = data.user || data.data || data

  if (!user?.role) {
    return redirect("/forbidden")
  }

  const role = user.role.toLowerCase()
  if (role !== "admin" && role !== "manager" && role !== "moderator") {
    return redirect("/forbidden")
  }

  // ✅ CHỈ RETURN DATA
  return { user }
}

export default function AdminLayout() {
  const { account, isLoading } = useAuthStore();
  const { collapsed } = useSidebarStore();
  const location = useLocation();

  const sidebarWidth = collapsed ? 80 : 256;
  //console.log("AdminLayout mount - isLoading:", isLoading, "account:", account);
  // 1. Đang load auth → hiển thị loading (tránh flash)
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Đang kiểm tra đăng nhập...</div>;
  }

  // 2. Chưa đăng nhập → redirect login
  if (!account) {
    return <Navigate to="/admin/login" replace />;
  }
  if (account.role === "STAFF") {
    toast.error("Nhân viên bán vé chỉ truy cập khu vực quầy vé.");
    return <Navigate to="/staff/create-ticket" replace />;
  }
  // Từ đây chắc chắn đã login → kiểm tra quyền
  const currentPath = location.pathname;

  let allowedRoles: UserRole[] | undefined;

  const matchedRoute = Object.entries(ROUTE_PERMISSIONS).find(([path]) =>
    currentPath.startsWith(path.replace(/\/:cinemaId/, "").replace(/:\w+/g, ""))
  );

  if (matchedRoute) {
    allowedRoles = matchedRoute[1];
  }

  // Route không match → chặn (trừ route đặc biệt)
  if (!allowedRoles) {
    if (currentPath.match(/\/admin\/cinemas\/\d+\/rooms$/)) {
      allowedRoles = ["ADMIN", "MANAGER"];
    } else {
      toast.error("Bạn không có quyền truy cập trang này.");
      return <Navigate to="/forbidden" replace />;
    }
  }

  // Kiểm tra role
  if (!allowedRoles.includes(account.role)) {
    toast.error("Bạn không có quyền truy cập trang này.");
    return <Navigate to="/forbidden" replace />;
  }
  
  // Manager chỉ xem rạp của mình
  if (account.role === "MANAGER") {
    const cinemaIdMatch = currentPath.match(/\/cinemas\/(\d+)/);
    if (cinemaIdMatch) {
      const requestedCinemaId = Number(cinemaIdMatch[1]);
      if (requestedCinemaId !== account.cinemaId) {
        toast.error("Bạn chỉ được quản lý rạp của mình.");
        return <Navigate to="/forbidden" replace />;
      }
    }
  }

  // Render layout
  return (
    <div className="min-h-screen bg-gray-100">
      <aside
        className="fixed top-0 left-0 h-screen z-40 bg-white shadow-lg transition-all duration-300"
        style={{ width: `${sidebarWidth}px` }}
      >
        <Sidebar />
      </aside>

      <header
        className="fixed top-0 right-0 h-14 z-30 bg-white shadow transition-all duration-300"
        style={{ left: `${sidebarWidth}px` }}
      >
        <Navbar />
      </header>

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