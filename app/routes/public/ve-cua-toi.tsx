// routes/public/ve-cua-toi.tsx
import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Calendar, Ticket, Loader2, Trash2, Eye } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "~/lib/api/client"
import { useAuthStore } from "~/stores/authCustomerStore"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

interface Order {
  orderCode: string
  movieTitle: string
  poster: string
  showtime: string // formatted: "14:30 - 03/01/2026"
  startTime: string // ISO để tính thời gian hủy
  seats: string[]
  totalAmount: number
  qrCode: string // QR cho cả đơn
  paidAt: string
  status: string // PAID, CANCELLED
  ticketCount: number
}

interface ApiResponse<T> {
  status: string
  data: T
}

export default function MyTickets() {
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMyOrders = async () => {
    try {
      const res = await apiClient.get<ApiResponse<Order[]>>("/don-hang")
      setOrders(res.data)
    } catch {
      toast.error("Không thể tải danh sách vé")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để xem vé")
      navigate("/login?redirect=/ve-cua-toi")
      return
    }

    fetchMyOrders()
  }, [isAuthenticated, navigate])

  // Kiểm tra có thể hủy không (≥ 60 phút trước giờ chiếu)
  const canCancel = (startTime: string) => {
    try {
      const showtime = new Date(startTime)
      const now = new Date()
      return showtime.getTime() - now.getTime() > 60 * 60 * 1000
    } catch {
      return false
    }
  }

  // Hủy toàn bộ đơn hàng
  const handleCancelOrder = async (orderCode: string) => {
    if (!confirm("Bạn có chắc chắn muốn hủy TOÀN BỘ đơn hàng này?\nSố tiền sẽ được hoàn theo chính sách.")) {
      return
    }

    try {
      await apiClient.post(`/don-hang/huy/${orderCode}`)
      toast.success("Hủy đơn hàng thành công!")
      fetchMyOrders()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể hủy đơn hàng")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-20">
        <Ticket className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-4">Bạn chưa có vé nào</h2>
        <Button size="lg" onClick={() => navigate("/phim")}>
          Đặt vé ngay
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-4xl font-bold text-center mb-10">Vé của tôi</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {orders.map((order) => {
          const cancelable = canCancel(order.startTime) && order.status === "PAID"

          return (
            <Card
              key={order.orderCode}
              className="overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-primary"
              onClick={() => navigate(`/don-hang/${order.orderCode}`)}
            >
              {/* Poster */}
              <div className="aspect-3/4 relative">
                <img
                  src={order.poster || "https://via.placeholder.com/400x600"}
                  alt={order.movieTitle}
                  className="w-full h-full object-cover"
                />
                {order.status === "CANCELLED" && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <span className="text-white text-3xl font-bold">ĐÃ HỦY</span>
                  </div>
                )}
              </div>

              <CardHeader className="pb-4">
                <CardTitle className="text-xl line-clamp-2">{order.movieTitle}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>{order.showtime}</span>
                  </p>
                  <p>
                    <strong>Ghế:</strong> {order.seats.join(", ")}
                  </p>
                  <p>
                    <strong>Số vé:</strong> {order.ticketCount} vé
                  </p>
                  <p className="text-lg font-bold text-primary">
                    {order.totalAmount.toLocaleString()} đ
                  </p>
                </div>

                {/* QR nhỏ preview */}
                <div className="flex justify-center py-4">
                  <img
                    src={order.qrCode}
                    alt="QR Check-in"
                    className="w-32 h-32 rounded-lg shadow-md"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    className="flex-1"
                    variant="default"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/don-hang/${order.orderCode}`)
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Xem chi tiết
                  </Button>

                  {cancelable && (
                    <Button
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCancelOrder(order.orderCode)
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {!cancelable && order.status === "PAID" && (
                  <p className="text-center text-sm text-red-600 font-medium pt-2">
                    Đã quá thời gian hủy vé
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-12 text-center">
        <Button size="lg" onClick={() => navigate("/phim")}>
          Đặt thêm vé
        </Button>
      </div>
    </div>
  )
}