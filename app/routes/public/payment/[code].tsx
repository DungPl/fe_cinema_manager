// routes/payment/[code].tsx
import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { AlertCircle, Loader2, ArrowLeft } from "lucide-react" // ← Thêm ArrowLeft
import { Alert, AlertDescription } from "~/components/ui/alert"
import { purchaseSeats } from "~/lib/api/showtimeApi"

export default function PaymentPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()

  const [paymentInfo, setPaymentInfo] = useState<any>(null)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem("paymentInfo")
    if (!raw) {
      setError("Không tìm thấy thông tin đơn hàng")
      return
    }
    const info = JSON.parse(raw)
    if (info.code !== code) {
      setError("Thông tin đơn hàng không hợp lệ")
      return
    }
    setPaymentInfo(info)
    setName(info.customer_name || "")
    setPhone(info.phone || "")
    setEmail(info.email || "")
  }, [code])

  const handlePayment = async () => {
    if (!paymentInfo) return
    if (!name || !phone || !email) {
      setError("Vui lòng nhập đầy đủ thông tin")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const seatIds = paymentInfo.selectedSeats.map((s: any) => Number(s.id))

      const res = await purchaseSeats(code!, {
        seatIds,
        heldBy: paymentInfo.heldBy,
        customer_name: name,
        phone,
        email,
      })

      // Clear state sau thanh toán thành công
      localStorage.removeItem("paymentInfo")
      localStorage.removeItem("seat_session")
      localStorage.removeItem("seat_expire")
      localStorage.removeItem("selected_seats")

      // Redirect sang trang thành công (dùng orderCode từ response)
      navigate(`/dat-ve/thanh-cong/${res.order.PublicCode}`)
    } catch (err: any) {
      const msg = err.response?.data?.message
        || err.message
        || "Thanh toán thất bại. Vui lòng thử lại."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }



  const handleBack = () => {
    navigate(`/dat-ve/${code}`) // Quay lại trang chọn ghế
  }

  if (error) return (
    <div className="max-w-md mx-auto p-6">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
      <Button variant="outline" className="mt-4 w-full" onClick={handleBack}>
        Quay lại chọn ghế
      </Button>
    </div>
  )

  if (!paymentInfo) return <div className="text-center p-10">Đang tải...</div>

  // Nhóm ghế đôi để hiển thị
  const groupedSeats = () => {
    const result: { label: string; type: string; price: number }[] = []
    const processedCouples = new Set<number>()
    const basePrice = paymentInfo.basePrice || 50000

    paymentInfo.selectedSeats.forEach((seat: any) => {
      if (seat.coupleId && processedCouples.has(seat.coupleId)) {
        return // Bỏ qua ghế thứ 2
      }

      const modifier = seat.priceModifier || 1
      const price = basePrice * modifier

      let label = seat.label
      if (seat.coupleId) {
        const coupleSeat = paymentInfo.selectedSeats.find((s: any) => s.coupleId === seat.coupleId && s.id !== seat.id)
        if (coupleSeat) {
          label = `${seat.label} + ${coupleSeat.label}`
          processedCouples.add(seat.coupleId)
        }
      }

      result.push({
        label,
        type: seat.type,
        price,
      })
    })

    return result
  }

  const grouped = groupedSeats()

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="border-2 border-primary/20 shadow-2xl">
        <CardHeader className="bg-primary/5 pb-4">
          <CardTitle className="text-3xl font-bold text-center">
            Thanh toán đơn hàng
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-8 pt-8">
          {/* Thông tin suất chiếu */}
          <div className="space-y-4">
            <h3 className="font-semibold text-2xl">Thông tin suất chiếu</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <span className="text-muted-foreground block text-sm">Phim</span>
                <p className="font-medium text-lg">{paymentInfo.movieTitle || "Đang cập nhật"}</p>
              </div>
              <div className="space-y-2">
                <span className="text-muted-foreground block text-sm">Thời gian</span>
                <p className="font-medium text-lg">
                  {new Date(paymentInfo.startTime).toLocaleString("vi-VN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Ghế đã chọn */}
          <div className="space-y-4">
            <h3 className="font-semibold text-2xl">Ghế đã chọn ({paymentInfo.selectedSeats.length} ghế)</h3>
            <div className="border rounded-lg overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[200px]">Ghế</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead className="text-right">Giá</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grouped.map((item, index) => (
                    <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">{item.label}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {item.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-lg">
                        {item.price.toLocaleString()} đ
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/30 font-bold">
                    <TableCell colSpan={2} className="text-xl">Tổng cộng</TableCell>
                    <TableCell className="text-right text-2xl text-primary">
                      {paymentInfo.totalAmount.toLocaleString()} đ
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Thông tin liên hệ */}
          <div className="space-y-6">
            <h3 className="font-semibold text-2xl">Thông tin liên hệ</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Họ và tên"
                value={name}
                onChange={e => setName(e.target.value)}
                className="h-12"
              />
              <Input
                type="tel"
                placeholder="Số điện thoại"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="h-12"
              />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="h-12"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Nút thanh toán & Quay lại */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="outline"
              onClick={() => navigate(`/dat-ve/${code}`)}
              className="flex-1 h-12 text-lg"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Quay lại chọn ghế
            </Button>

            <Button
              onClick={handlePayment}
              disabled={loading}
              className="flex-1 h-12 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận thanh toán"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}