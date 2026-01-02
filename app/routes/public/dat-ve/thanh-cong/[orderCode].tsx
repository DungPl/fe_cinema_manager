// routes/public/dat-ve/thanh-cong/[orderCode].tsx
import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "~/lib/api/client"

interface Ticket {
  ticketCode: string
  qrCode: string // "data:image/png;base64,..."
}

interface OrderSuccessData {
  orderCode: string
  movieTitle: string
  showtime: string
  seats: string[] // hoặc string: "A1, A2, B3"
  totalAmount: number
  qrCode: string // ← 1 QR duy nhất cho cả đơn
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
        const res = await apiClient.get<ApiResponse<OrderSuccessData>>(`/don-hang/thanh-cong/${orderCode}`)
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
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="bg-green-50 text-center pb-8">
          <CheckCircle2 className="w-20 h-20 text-green-600 mx-auto mb-4" />
          <CardTitle className="text-4xl font-bold text-green-700">
            Thanh toán thành công!
          </CardTitle>
          <p className="text-lg text-green-600 mt-2">
            Mã đơn hàng: <span className="font-bold text-xl">{order.orderCode}</span>
          </p>
        </CardHeader>

        <CardContent className="space-y-8 p-8">
          {/* Chi tiết đơn hàng */}
          <div className="bg-gray-50 rounded-xl p-6 text-center space-y-4">
            <h3 className="text-2xl font-semibold">{order.movieTitle}</h3>
            <p className="text-lg text-gray-700">{order.showtime}</p>
            <p className="text-lg">
              <strong>Ghế:</strong> {order.seats.join(", ")}
            </p>
            <p className="text-2xl font-bold text-green-600">
              {order.totalAmount.toLocaleString()} VNĐ
            </p>
          </div>

          {/* QR CODE DUY NHẤT CHO CẢ ĐOÀN */}
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-6">Mã QR check-in vé</h3>
            <div className="inline-block bg-white p-8 rounded-2xl shadow-lg border">
              <img
                src={order.qrCode}
                alt="QR Code đơn hàng"
                className="w-64 h-64 mx-auto"
              />
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Vui lòng xuất trình mã QR này tại quầy check-in khi vào rạp
            </p>
            <p className="text-sm text-gray-500 mt-2">
              (Áp dụng cho tất cả {order.seats.length} vé trong đơn)
            </p>
          </div>

          {/* Nút hành động */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
            <Button onClick={() => navigate("/")} variant="outline" size="lg" className="text-lg py-6">
              Quay lại trang chủ
            </Button>
            <Button onClick={() => navigate(`/don-hang/${order.orderCode}`)} size="lg" className="text-lg py-6">
              Xem chi tiết đơn hàng
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}