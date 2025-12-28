// app/routes/forbidden.tsx
import { Link } from "react-router-dom"
import { Button } from "../components/ui/button" // nếu dùng shadcn

export default function Forbidden() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-6xl font-bold text-red-600">403</h1>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
          Truy cập bị từ chối
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Bạn không có quyền truy cập trang này.
        </p>

        <div className="flex gap-3 justify-center">
          <Button >
            <Link to="/">Quay về trang chủ</Link>
          </Button>
          <Button variant="outline" >
            <Link to="/admin/login">Đăng nhập lại</Link>
          </Button>

        </div>
      </div>
    </div>
  )
}