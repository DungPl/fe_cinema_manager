// src/app/routes/(auth)/Login.tsx
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate } from "react-router-dom"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Button } from "../../components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card"
import { User, Lock, Eye, EyeOff, LogIn } from "lucide-react"
import { useAuthStore } from "../../stores/authAccountStore"

const loginSchema = z.object({
  username: z.string().min(3, "Tên đăng nhập ít nhất 3 ký tự"),
  password: z.string().min(6, "Mật khẩu ít nhất 6 ký tự"),
})

type LoginForm = z.infer<typeof loginSchema>

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginForm) => {
    setError("")
    try {
      const res = await fetch("http://localhost:8002/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      })

      if (!res.ok) {
        setError("Tên đăng nhập hoặc mật khẩu sai")
        return
      }

      const json = await res.json()
      console.log("LOGIN RESPONSE:", json)

      const account = json.account
   
      login(account) // lưu vào store

      const role = account.role
      
      switch (role) {
        case "ADMIN":
          navigate("/admin")
          break

        case "MANAGER":
          if (account.cinemaId) {
            navigate(`/admin/cinemas/${account.cinemaId}/rooms`)
          } else {
            navigate("/forbidden")
          }
          break

        case "MODERATOR":
          navigate("/admin/movie")
          break

        default:
          navigate("/forbidden")
      }
    } catch (err) {
      setError("Không thể kết nối đến server.")
    }
  }


  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-blue-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <LogIn className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Đăng nhập</CardTitle>
          <CardDescription>Nhập tên đăng nhập và mật khẩu để tiếp tục</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="space-y-2">
              <Label htmlFor="username">Tên đăng nhập</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="admin123"
                  className="pl-10!"
                  {...register("username")}
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>
              {errors.username && <p className="text-sm text-red-600">{errors.username.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••"
                  className="pl-10! pr-10"
                  {...register("password")}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
