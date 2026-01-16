// routes/public/register.tsx
import { useState } from "react"
import { useNavigate, Link } from "react-router"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card"
import { Label } from "~/components/ui/label"
import { Alert, AlertDescription } from "~/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { registerCustomer } from "~/lib/api/authApi"

export default function RegisterPage() {
    const navigate = useNavigate()

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        phone: "",
        password: "",
    })

    const [errors, setErrors] = useState<{
        username?: string
        email?: string
        phone?: string
        password?: string
        general?: string
    }>({})

    const [loading, setLoading] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData({ ...formData, [name]: value })

        if (errors[name as keyof typeof errors]) {
            setErrors({ ...errors, [name]: undefined })
        }
    }

    const validateForm = () => {
        const newErrors: typeof errors = {}

        if (!formData.username.trim()) newErrors.username = "Tên đăng nhập không được để trống"
        else if (formData.username.length < 3) newErrors.username = "Tên đăng nhập phải ít nhất 3 ký tự"

        if (!formData.email.trim()) newErrors.email = "Email không được để trống"
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email không hợp lệ"

        if (!formData.phone.trim()) newErrors.phone = "Số điện thoại không được để trống"
        else if (!/^(0|\+84)[0-9]{9}$/.test(formData.phone)) newErrors.phone = "Số điện thoại không hợp lệ (10 số)"

        if (!formData.password.trim()) newErrors.password = "Mật khẩu không được để trống"
        else if (formData.password.length < 6) newErrors.password = "Mật khẩu phải ít nhất 6 ký tự"

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) return

        setLoading(true)
        setErrors({})

        try {
            await registerCustomer(formData)
            navigate("/login")
        } catch (err: any) {
            console.log("REGISTER ERROR FULL:", err)
          

            const response = err

            if (response && response.status === "error") {
                const message = response.message || "Đăng ký thất bại"
                const keyError = response.keyError

                if (keyError && ["username", "email", "phone", "password"].includes(keyError)) {
                    setErrors({ [keyError]: message })
                } else {
                    setErrors({ general: message })
                }
            } else {
                setErrors({ general: "Có lỗi xảy ra. Vui lòng thử lại sau." })
            }
        } finally {
            setLoading(false) // Luôn chạy, dù thành công hay lỗi
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 px-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Đăng ký tài khoản</CardTitle>
                    <CardDescription className="text-center">
                        Điền thông tin để tạo tài khoản mới
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {errors.general && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{errors.general}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Các input giữ nguyên */}
                        <div className="space-y-2">
                            <Label htmlFor="username">Tên đăng nhập</Label>
                            <Input
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                placeholder="Nhập tên đăng nhập"
                                className={errors.username ? "border-red-500 focus-visible:ring-red-500" : ""}
                            />
                            {errors.username && <p className="text-sm text-red-500">{errors.username}</p>}
                        </div>

                        {/* Email */}
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
                                className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                            />
                            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <Label htmlFor="phone">Số điện thoại</Label>
                            <Input
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                placeholder="Nhập số điện thoại (10 số)"
                                className={errors.phone ? "border-red-500 focus-visible:ring-red-500" : ""}
                            />
                            {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Mật khẩu</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                                className={errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}
                            />
                            {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Đang đăng ký..." : "Đăng ký"}
                        </Button>
                    </form>

                    <div className="mt-4 text-center text-sm">
                        Đã có tài khoản?{" "}
                        <Link to="/login" className="text-primary hover:underline">
                            Đăng nhập
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}