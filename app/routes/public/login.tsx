// routes/public/login.tsx
import { useState } from "react"
import { useNavigate, Link } from "react-router"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card"
import { Label } from "~/components/ui/label"
import { Alert, AlertDescription } from "~/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react" // Thêm Loader2 cho loading
import { apiClient } from "~/lib/api/client"
import { useAuthStore } from "~/stores/authCustomerStore"
import type { Customer } from "~/stores/authCustomerStore"

interface ApiResponse<T> {
  status: string
  message?: string
  data: T
}

interface TokenData {
  accessToken: string
  refreshToken: string
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { loginCustomer } = useAuthStore()

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError(null) // Xóa lỗi khi người dùng nhập lại
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Đăng nhập → lấy token
      const res = await apiClient.post<ApiResponse<TokenData>>(
        "/khach-hang/login",
        formData
      )

      localStorage.setItem("accessToken", res.data.accessToken)
      localStorage.setItem("refreshToken", res.data.refreshToken)

      // Gọi API lấy thông tin user hiện tại
      const userRes = await apiClient.get<ApiResponse<Customer>>("/khach-hang/me")
      const user = userRes.data // res.data.data là Customer

      // Cập nhật store
      loginCustomer(user)

      navigate("/") // Về trang chủ
    } catch (err: any) {
      // Xử lý lỗi chi tiết từ backend
      const errorMessage = err.response?.data?.message || err.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin."
      
      // Nếu backend trả lỗi cụ thể về mật khẩu
      if (errorMessage.includes("password") || errorMessage.includes("mật khẩu")) {
        setError("Mật khẩu không đúng")
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Đăng nhập</CardTitle>
          <CardDescription className="text-center">
            Nhập thông tin để đăng nhập
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Nhập email"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Nhập mật khẩu"
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                "Đăng nhập"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="text-primary hover:underline">
              Đăng ký ngay
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}