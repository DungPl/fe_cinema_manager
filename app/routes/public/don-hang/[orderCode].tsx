// routes/public/don-hang/[orderCode].tsx
import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { Separator } from "~/components/ui/separator"
import { differenceInMinutes, format, parse } from "date-fns"
import { vi } from "date-fns/locale"
import { Loader2, Download, Home, Ticket, Ban, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "~/lib/api/client"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

interface ApiResponse<T> {
  status: string
  message?: string
  data: T
}

interface OrderOrderCancelData {
  refund_amount: number
  refund_percent: number
  message: string
}

interface OrderDetail {
  orderCode: string
  movieTitle: string
  posterUrl?: string
  showtime: string
  roomName?: string
  format: string
  language: string
  seats: string[]
  totalAmount: number
  paymentMethod: string
  paidAt: string
  customerName: string
  phone: string
  email: string
  qrCode: string
  status: string
  // Thêm để lưu thông tin hoàn tiền sau khi hủy
  refund_amount?: number
  refund_percent?: number
}

export default function OrderDetailPage() {
  const { orderCode } = useParams<{ orderCode: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await apiClient.get<{ data: OrderDetail }>(`/don-hang/${orderCode}`)
        setOrder(res.data)
      } catch (err) {
        toast.error("Không thể tải thông tin đơn hàng")
      } finally {
        setLoading(false)
      }
    }

    if (orderCode) fetchOrder()
  }, [orderCode])

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
    const imgWidth = pdfWidth - 20
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight)
    pdf.save(`Ve_${order.orderCode}.pdf`)
    toast.success("Đã tải vé PDF thành công!")
  }

  const handleCancel = async () => {
    if (!order || cancelling) return

    const showtimeDate = parse(order.showtime, "HH:mm - dd/MM/yyyy", new Date())
    const hoursLeft = differenceInMinutes(showtimeDate, new Date()) / 60
    let policyText = ""
    if (hoursLeft >= 2) {
      policyText = "Bạn sẽ được hoàn 100% tiền vé."
    } else if (hoursLeft >= 1) {
      policyText = "Bạn sẽ chỉ được hoàn 50% tiền vé."
    }

    if (!confirm(
      `Bạn có chắc chắn muốn hủy đơn hàng này?\n\n${policyText}\n\nVé sẽ không thể khôi phục sau khi hủy.`
    )) return

    setCancelling(true)

    try {
      const res = await apiClient.post<ApiResponse<OrderOrderCancelData>>(
        `/don-hang/huy/${order.orderCode}`
      )

      const responseData = res.data

      const message = responseData.message || "Hủy vé thành công"
      const refundAmount = responseData.refund_amount ?? 0
      const refundPercent = responseData.refund_percent ?? 100

      toast.success(
        `${message}\nHoàn tiền: ${refundAmount.toLocaleString()}đ (${refundPercent}%)`,
        { duration: 12000 }
      )

      // Cập nhật state với thông tin hoàn tiền để hiển thị chính xác
      setOrder({
        ...order,
        status: "CANCELLED",
        refund_amount: refundAmount,
        refund_percent: refundPercent,
      })

    } catch (err: any) {
      console.error("Lỗi hủy vé:", err)
      const msg = err.response?.data?.message || "Hủy vé thất bại. Vui lòng thử lại."
      toast.error(msg, { duration: 10000 })
    } finally {
      setCancelling(false)
    }
  }

  const canCancel = () => {
    if (!order || order.status !== "PAID") return false
    try {
      const showtimeDate = parse(order.showtime, "HH:mm - dd/MM/yyyy", new Date())
      const minutesLeft = differenceInMinutes(showtimeDate, new Date())
      return minutesLeft >= 60
    } catch {
      return false
    }
  }

  const isCancellable = canCancel()

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

  const showtimeDate = parse(order.showtime, "HH:mm - dd/MM/yyyy", new Date())
  const paidAtDate = parse(order.paidAt, "HH:mm - dd/MM/yyyy", new Date())

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div id="ticket-print-area" className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div
            className={`
              p-8 text-center text-white rounded-t-2xl
              ${order.status === "CANCELLED"
                ? "bg-linear-to-r from-red-600 to-orange-600"
                : "bg-linear-to-r from-blue-600 to-indigo-600"
              }
            `}
          >
            <h1 className="text-4xl font-bold mb-4">
              {order.status === "CANCELLED" ? "ĐƠN HÀNG ĐÃ BỊ HỦY" : "Vé xem phim đã đặt thành công"}
            </h1>
            <p className="text-xl opacity-90">Mã đơn hàng: {order.orderCode}</p>

            {order.status === "CANCELLED" && (
              <div className="mt-6">
                <Badge variant="secondary" className="text-lg px-8 py-3 bg-white/20">
                  ĐÃ HỦY - Không thể sử dụng
                </Badge>
              </div>
            )}
          </div>

          {/* QR Code / Thông báo hủy */}
          <div className="text-center py-12 bg-gray-50">
            {order.status === "CANCELLED" ? (
              <div className="space-y-8">
                <div className="text-8xl">❌</div>
                <div className="space-y-4">
                  <p className="text-3xl font-bold text-red-600">ĐƠN HÀNG ĐÃ BỊ HỦY</p>
                  <p className="text-lg text-gray-700 max-w-lg mx-auto">
                    Vé không còn giá trị sử dụng. QR code đã bị vô hiệu hóa.
                  </p>
                  <p className="text-base text-gray-600">
                    Tiền hoàn sẽ được chuyển về tài khoản của bạn trong vòng <strong>3-5 ngày làm việc</strong>.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <p className="text-lg font-medium mb-6">
                  Quét mã QR này tại quầy để check-in toàn bộ vé
                </p>
                <div className="inline-block bg-white p-8 rounded-2xl shadow-lg border">
                  <img
                    src={order.qrCode}
                    alt="QR Code đơn hàng"
                    className="w-80 h-80 mx-auto"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  Áp dụng cho {order.seats.length} vé
                </p>
              </>
            )}
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
                    {format(showtimeDate, "HH:mm - EEEE, dd/MM/yyyy", { locale: vi })}
                  </div>
                  <div>
                    <span className="font-medium">Thanh toán lúc:</span>{" "}
                    {format(paidAtDate, "HH:mm - dd/MM/yyyy", { locale: vi })}
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
                  <p><strong>Thời gian:</strong> {format(paidAtDate, "HH:mm - dd/MM/yyyy", { locale: vi })}</p>
                  <p className="text-2xl font-bold text-primary">
                    Tổng tiền: {order.totalAmount.toLocaleString()} ₫
                  </p>
                </div>
              </div>
            </div>

            {/* Thông tin hoàn tiền - chỉ hiển thị khi đã hủy */}
            {order.status === "CANCELLED" && order.refund_amount !== undefined && (
              <div className="mt-8 p-6 bg-amber-50 border-2 border-amber-300 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="w-8 h-8 text-amber-600" />
                  <h3 className="text-2xl font-bold text-amber-800">Thông tin hoàn tiền</h3>
                </div>
                <div className="space-y-3 text-lg">
                  <p>
                    <strong>Số tiền được hoàn:</strong>{" "}
                    <span className="text-3xl font-bold text-green-600">
                      {order.refund_amount.toLocaleString()}đ
                    </span>
                    {" "}
                    <span className="text-amber-700 font-medium">
                      ({order.refund_percent}%)
                    </span>
                  </p>
                  <p className="text-amber-700">
                    Thời gian xử lý: <strong>3-5 ngày làm việc</strong>
                  </p>
                  <p className="text-sm text-amber-600 mt-4">
                    Vui lòng kiểm tra tài khoản thanh toán hoặc liên hệ hỗ trợ nếu quá thời hạn.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
          <Button size="lg" variant="outline" onClick={() => navigate("/")}>
            <Home className="mr-2 h-5 w-5" />
            Trang chủ
          </Button>

          {/* Chỉ hiện nút tải PDF khi chưa hủy */}
          {order.status !== "CANCELLED" && (
            <Button size="lg" onClick={handleDownloadPDF}>
              <Download className="mr-2 h-5 w-5" />
              Tải vé PDF
            </Button>
          )}

          {isCancellable ? (
            <Button
              size="lg"
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Đang hủy...
                </>
              ) : (
                <>
                  <Ban className="mr-2 h-5 w-5" />
                  Hủy vé & hoàn tiền
                </>
              )}
            </Button>
          ) : order.status === "CANCELLED" ? (
            // Khi đã hủy rồi → không hiện gì thêm (hoặc có thể hiện thông báo nhỏ)
            <div className="text-center text-gray-500">
              <p className="text-lg">Đơn hàng đã được xử lý hoàn tất</p>
            </div>
          ) : (
            <div className="flex items-center gap-4 text-red-600 bg-red-50 px-8 py-5 rounded-xl border border-red-200">
              <Ban className="w-10 h-10 shrink-0" />
              <div className="text-left">
                <p className="font-bold text-lg">Không thể hủy vé</p>
                <p className="text-sm mt-1">
                  Chỉ được hủy trước ít nhất <strong>1 tiếng</strong> giờ chiếu:
                </p>
                <ul className="text-sm mt-2 space-y-1 text-red-700">
                  <li>• <strong>≥ 2 tiếng</strong>: Hoàn <strong>100%</strong></li>
                  <li>• <strong>1–2 tiếng</strong>: Hoàn <strong>50%</strong></li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}