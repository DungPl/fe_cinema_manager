import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/accordion"
import { Film, Calendar, DollarSign, Ticket, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "~/lib/api/client"
import { useAuthStore } from "~/stores/authCustomerStore"

// Type cho response
interface Ticket {
  ticketCode: string
  qrCode: string
  seatLabel: string
}

interface Order {
  orderCode: string
  movieTitle: string
  poster: string
  showtime: string // ISO string hoặc formatted
  startTime: string // ISO để kiểm tra thời gian hủy
  seats: string[]
  totalAmount: number
  tickets: Ticket[]
  paidAt: string
  status: string // PAID, CANCELLED, ...
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

  const fetchTickets = async () => {
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
      navigate("/login")
      return
    }

    fetchTickets()
  }, [isAuthenticated, navigate])

  // Hàm hủy từng vé
  const handleCancelTicket = async (orderCode: string, ticketCode: string) => {
    if (!confirm(`Bạn có chắc muốn hủy vé ${ticketCode}?`)) return

    try {
      await apiClient.post(`/don-hang/cancel-by-code?orderCode=${orderCode}&ticketCodes=${ticketCode}`)
      toast.success("Hủy vé thành công!")
      fetchTickets() // Refresh danh sách
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể hủy vé")
    }
  }

  // Hàm hủy toàn bộ đơn
  const handleCancelOrder = async (orderCode: string) => {
    if (!confirm("Bạn có chắc muốn hủy TOÀN BỘ đơn hàng này?")) return

    try {
      await apiClient.post(`/don-hang/cancel-by-code?orderCode=${orderCode}`)
      toast.success("Hủy đơn hàng thành công!")
      fetchTickets()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể hủy đơn")
    }
  }

  // Kiểm tra có thể hủy không (trước giờ chiếu ≥ 60 phút)
  const canCancel = (startTime: string) => {
    const showtime = new Date(startTime)
    const now = new Date()
    return showtime.getTime() - now.getTime() > 60 * 60 * 1000 // 60 phút
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-20">
        <Ticket className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Bạn chưa có vé nào</h2>
        <Button onClick={() => navigate("/phim")}>Đặt vé ngay</Button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Vé của tôi</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map(order => {
          const cancelable = canCancel(order.startTime) && order.status === "PAID"

          return (
            <Card key={order.orderCode} className="overflow-hidden shadow-lg hover:shadow-xl transition">
              <div className="aspect-2/3 bg-gray-100 relative">
                <img
                  src={order.poster}
                  alt={order.movieTitle}
                  className="w-full h-full object-cover"
                />
                {order.status === "CANCELLED" && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">ĐÃ HỦY</span>
                  </div>
                )}
              </div>

              <CardHeader>
                <CardTitle className="line-clamp-2">{order.movieTitle}</CardTitle>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {order.showtime}
                  </p>
                  <p>
                    <strong>Ghế:</strong> {order.seats.join(", ")}
                  </p>
                  <p className="font-bold text-primary text-lg">
                    {order.totalAmount.toLocaleString()} đ
                  </p>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <Accordion type="single" collapsible>
                  <AccordionItem value="tickets" className="border-none">
                    <AccordionTrigger>Xem chi tiết vé</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-3">
                        {order.tickets.map(ticket => (
                          <div
                            key={ticket.ticketCode}
                            className="border rounded-lg p-3 bg-white text-center relative"
                          >
                            <p className="text-xs font-medium mb-1">{ticket.ticketCode}</p>
                            <p className="text-xs text-muted-foreground mb-2">
                              Ghế {ticket.seatLabel}
                            </p>
                            <img src={ticket.qrCode} className="mx-auto w-24 h-24" alt="QR Code" />

                            {cancelable && (
                              <Button
                                size="sm"
                                variant="destructive"
                                className="mt-2 w-full"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCancelTicket(order.orderCode, ticket.ticketCode)
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Hủy vé
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => window.open(`/checkin/${order.tickets[0]?.ticketCode}`, "_blank")}
                  >
                    Check-in vé
                  </Button>

                  {cancelable && order.tickets.length > 1 && (
                    <Button
                      variant="destructive"
                      onClick={() => handleCancelOrder(order.orderCode)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Hủy đơn
                    </Button>
                  )}
                </div>

                {!cancelable && order.status === "PAID" && (
                  <p className="text-sm text-red-600 text-center">
                    Đã quá thời gian hủy vé (trước giờ chiếu 60 phút)
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-10 text-center">
        <Button variant="outline" onClick={() => navigate("/phim")}>
          Đặt thêm vé
        </Button>
      </div>
    </div>
  )
}