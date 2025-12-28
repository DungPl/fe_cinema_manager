// routes/public/don-hang/me.tsx
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/accordion"
import { Film, Calendar, DollarSign, Ticket, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {apiClient} from "~/lib/api/client"
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
  showtime: string
  seats: string[]
  totalAmount: number
  tickets: Ticket[]
  paidAt: string
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

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để xem vé")
      navigate("/login")
      return
    }

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

    fetchTickets()
  }, [isAuthenticated, navigate])

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

      <Accordion type="single" collapsible className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map(order => (
          <AccordionItem key={order.orderCode} value={order.orderCode} className="border-none">
            <Card className="overflow-hidden cursor-pointer hover:shadow-xl transition">
              {/* POSTER */}
              <div className="aspect-2/3 bg-gray-100">
                <img
                  src={order.poster}
                  alt={order.movieTitle}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* TÓM TẮT */}
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="text-left w-full space-y-1">
                  <h3 className="font-semibold text-lg line-clamp-2">
                    {order.movieTitle}
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {order.showtime}
                  </p>
                  <p className="text-sm">
                    <strong>Ghế:</strong> {order.seats.join(", ")}
                  </p>
                  <p className="font-bold text-primary">
                    {order.totalAmount.toLocaleString()} VNĐ
                  </p>
                </div>
              </AccordionTrigger>

              {/* CHI TIẾT */}
              <AccordionContent className="p-4 bg-gray-50 space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Vé của bạn</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {order.tickets.map(ticket => (
                      <div
                        key={ticket.ticketCode}
                        className="border rounded-lg p-2 bg-white text-center"
                      >
                        <p className="text-xs font-medium mb-1">
                          {ticket.ticketCode}
                        </p>
                        <p className="text-xs text-muted-foreground mb-1">
                          Ghế {ticket.seatLabel}
                        </p>
                        <img
                          src={ticket.qrCode}
                          className="mx-auto w-24 h-24"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() =>
                    window.open(`/checkin/${order.tickets[0]?.ticketCode}`, "_blank")
                  }
                >
                  Check-in vé
                </Button>
              </AccordionContent>
            </Card>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-10 text-center">
        <Button variant="outline" onClick={() => navigate("/phim")}>
          Đặt thêm vé
        </Button>
      </div>
    </div>
  )
}
