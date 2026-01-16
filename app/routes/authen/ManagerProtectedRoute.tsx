import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation, useParams } from "react-router";
import { toast } from "sonner";
import { useAuthStore } from "~/stores/authAccountStore";

// Khai báo props (bao gồm children)
interface ManagerProtectedRouteProps {
  children?: ReactNode;
}

export const ManagerProtectedRoute: React.FC<ManagerProtectedRouteProps> = ({ children }) => {
  const { account, isManager } = useAuthStore();
  const location = useLocation();
  const { cinemaId } = useParams<{ cinemaId: string }>();

  // Không phải Manager → chặn
  if (!isManager) {
    toast.error("Bạn không có quyền truy cập khu vực này.");
    return <Navigate to="/admin/login" replace />;
  }

  // Manager → kiểm tra cinemaId có khớp không
  if (cinemaId && account?.cinemaId && Number(cinemaId) !== account.cinemaId) {
    toast.error("Bạn chỉ được quản lý rạp của mình.");
    return <Navigate to="/admin" replace />;
  }
  
  // Nếu có children → render children (trường hợp layout)
  // Nếu không → render Outlet (trường hợp route trực tiếp)
  return children ? <>{children}</> : <Outlet />;
};