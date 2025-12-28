// routes/public/dat-ve/thanh-cong/[orderCode].tsx
import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import {apiClient}from "~/lib/api/client"

interface Ticket {
  ticketCode: string
  qrCode: string // "data:image/png;base64,..."
}

interface OrderSuccessData {
  orderCode: string
  movieTitle: string
  showtime: string
  seats: string[]
  totalAmount: number
  tickets: Ticket[]
}

interface ApiResponse<T> {
  status: string
  message?: string
  data: T
}

export default function PaymentSuccess() {
  const { orderCode } = useParams<{ orderCode: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<OrderSuccessData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await apiClient.get<ApiResponse<OrderSuccessData>>(`/don-hang/${orderCode}`)
        setOrder(res.data)
      } catch (err) {
        toast.error("Không thể tải thông tin đơn hàng")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (orderCode) fetchOrder()
  }, [orderCode])

  if (loading) return <div className="text-center py-20">Đang tải...</div>

  if (!order) return <div className="text-center py-20">Không tìm thấy đơn hàng</div>

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-green-50 to-green-100 px-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="bg-green-50 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold text-green-700">
            Thanh toán thành công!
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 p-8">
          <div className="text-center space-y-2">
            <p className="text-lg">Cảm ơn bạn đã đặt vé tại CinemaHub</p>
            <p className="text-xl font-semibold">
              Mã đơn hàng: <span className="text-green-600">{order.orderCode}</span>
            </p>
          </div>

          <div className="border rounded-lg p-6 bg-white">
            <h3 className="text-xl font-semibold mb-4">Chi tiết vé</h3>
            <div className="space-y-3">
              <p><strong>Phim:</strong> {order.movieTitle}</p>
              <p><strong>Suất chiếu:</strong> {order.showtime}</p>
              <p><strong>Ghế:</strong> {order.seats.join(", ") || "Không có ghế"}</p>
              <p><strong>Tổng tiền:</strong> {order.totalAmount.toLocaleString()} VNĐ</p>
            </div>
          </div>

          {order.tickets && order.tickets.length > 0 && (
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">Mã QR vé của bạn</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {order.tickets.map(ticket => (
                  <div key={ticket.ticketCode} className="border rounded-lg p-4 bg-white">
                    <p className="font-medium mb-2">Vé: {ticket.ticketCode}</p>
                    <img
                      src={ticket.qrCode}
                      alt={`QR Code vé ${ticket.ticketCode}`}
                      className="mx-auto w-40 h-40"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <Button onClick={() => navigate("/phim")} variant="outline" size="lg">
              Quay lại trang chủ
            </Button>
            <Button onClick={() => navigate(`/don-hang/${order.orderCode}`)} size="lg">
              Xem chi tiết đơn hàng
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}