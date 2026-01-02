// routes/public/don-hang/[orderCode].tsx
import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Separator } from "~/components/ui/separator"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Loader2, Download, Home, Ticket } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "~/lib/api/client"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

interface OrderDetail {
  orderCode: string
  movieTitle: string
  posterUrl?: string
  showtime: string          // đã format sẵn hoặc ISO string
  roomName?: string
  format: string            // 2D, 3D, IMAX...
  language: string          // Phụ đề Việt, Lồng tiếng Anh...
  seats: string[]           // ["G5", "G6", "G7"]
  totalAmount: number
  paymentMethod: string
  paidAt: string
  customerName: string
  phone: string
  email: string
  qrCode: string            // data:image/png;base64,...
}

export default function OrderDetailPage() {
  const { orderCode } = useParams<{ orderCode: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await apiClient.get<{ data: OrderDetail }>(`/don-hang/${orderCode}`)
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

  // Tải vé PDF
  const handleDownloadPDF = async () => {
    if (!order) return

    const element = document.getElementById("ticket-print-area")
    if (!element) return

    const canvas = await html2canvas(element, { scale: 2 })
    const imgData = canvas.toDataURL("image/png")

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pdfWidth - 20
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight)
    pdf.save(`Ve_${order.orderCode}.pdf`)
    toast.success("Đã tải vé PDF thành công!")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <Ticket className="w-20 h-20 text-gray-400" />
        <p className="text-xl text-gray-600">Không tìm thấy đơn hàng</p>
        <Button onClick={() => navigate("/")}>Quay lại trang chủ</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Khu vực in PDF (ẩn khi in) */}
        <div id="ticket-print-area" className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-linear-to-r from-green-600 to-emerald-600 text-white p-8 text-center">
            <h1 className="text-4xl font-bold mb-2">Vé xem phim đã đặt thành công</h1>
            <p className="text-xl opacity-90">Mã đơn hàng: {order.orderCode}</p>
          </div>

          {/* QR Code lớn */}
          <div className="text-center py-10 bg-gray-50">
            <p className="text-lg font-medium mb-6">
              Quét mã QR này để check-in toàn bộ vé
            </p>
            <div className="inline-block bg-white p-8 rounded-2xl shadow-lg">
              <img
                src={order.qrCode}
                alt="QR Code đơn hàng"
                className="w-80 h-80"
              />
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Áp dụng cho {order.seats.length} vé
            </p>
          </div>

          <Separator />

          {/* Thông tin phim */}
          <div className="p-8 space-y-8">
            <div className="flex gap-8 items-start">
              {order.posterUrl && (
                <img
                  src={order.posterUrl}
                  alt={order.movieTitle}
                  className="w-40 h-60 object-cover rounded-lg shadow"
                />
              )}
              <div className="flex-1 space-y-4">
                <h2 className="text-3xl font-bold">{order.movieTitle}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-lg">
                  <div>
                    <span className="font-medium">Suất chiếu:</span>{" "}
                    {format(new Date(order.showtime), "HH:mm - EEEE, dd/MM/yyyy", { locale: vi })}
                  </div>
                  {order.roomName && (
                    <div>
                      <span className="font-medium">Phòng:</span> {order.roomName}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Định dạng:</span>{" "}
                    <Badge variant="secondary" className="ml-2">{order.format}</Badge>{" "}
                    <Badge variant="outline">{order.language}</Badge>
                  </div>
                  <div>
                    <span className="font-medium">Ghế:</span>{" "}
                    <span className="font-medium text-primary">{order.seats.join(", ")}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Thông tin khách & thanh toán */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-3">Thông tin khách hàng</h3>
                <div className="space-y-2">
                  <p><strong>Họ tên:</strong> {order.customerName}</p>
                  <p><strong>Số điện thoại:</strong> {order.phone}</p>
                  <p><strong>Email:</strong> {order.email}</p>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">Thanh toán</h3>
                <div className="space-y-2">
                  <p><strong>Phương thức:</strong> {order.paymentMethod}</p>
                  <p><strong>Thời gian:</strong> {format(new Date(order.paidAt), "HH:mm dd/MM/yyyy", { locale: vi })}</p>
                  <p className="text-2xl font-bold text-primary">
                    Tổng tiền: {order.totalAmount.toLocaleString()} ₫
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Nút hành động (ngoài khu vực in) */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
          <Button size="lg" variant="outline" onClick={() => navigate("/")}>
            <Home className="mr-2 h-5 w-5" />
            Trang chủ
          </Button>
          <Button size="lg" onClick={handleDownloadPDF}>
            <Download className="mr-2 h-5 w-5" />
            Tải vé PDF
          </Button>
        </div>
      </div>
    </div>
  )
}