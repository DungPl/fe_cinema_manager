// components/booking/BookingSummary.tsx
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import type { Showtime, BookingSeat } from "~/lib/api/types"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "~/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"

interface BookingSummaryProps {
  code: string
  showtime: Showtime
  selectedSeats: BookingSeat[]
  heldBy: string
}

export default function BookingSummary({
  code,
  showtime,
  selectedSeats,
  heldBy,
}: BookingSummaryProps) {
  const navigate = useNavigate()
  const [discountCode, setDiscountCode] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Tính giá theo suất chiếu + modifier, ghế đôi chỉ tính 1 lần
  const calculatePrice = () => {
    const basePrice = showtime.price || 50000 // Giá suất chiếu
    let total = 0
    const processedCouples = new Set<number>()

    selectedSeats.forEach(seat => {
      // Nếu là ghế đôi và cặp đã được tính → bỏ qua
      if (seat.coupleId && processedCouples.has(seat.coupleId)) {
        return
      }

      const modifier = seat.priceModifier || 1
      total += basePrice * modifier

      if (seat.coupleId) {
        processedCouples.add(seat.coupleId)
      }
    })

    return total
  }

  const total = calculatePrice()

  // Nhóm ghế đôi để hiển thị
  const groupedSeats = () => {
    const result: { label: string; type: string; price: number }[] = []
    const processedCouples = new Set<number>()

    selectedSeats.forEach(seat => {
      if (seat.coupleId && processedCouples.has(seat.coupleId)) {
        return // Bỏ qua ghế thứ 2
      }
       const basePrice = showtime.price || 50000
      const modifier = seat.priceModifier || 1
      const price = basePrice * modifier

      let label = seat.label
      if (seat.coupleId) {
        // Tìm ghế đôi còn lại
        const coupleSeat = selectedSeats.find(s => s.coupleId === seat.coupleId && s.id !== seat.id)
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

  const handleProceedToPayment = () => {
    if (selectedSeats.length === 0) {
      setError("Vui lòng chọn ít nhất một ghế")
      return
    }
    if (!name || !phone || !email) {
      setError("Vui lòng điền đầy đủ thông tin cá nhân")
      return
    }

    const paymentInfo = {
      code,
      showtimeId: showtime.id,
      movieTitle: showtime.Movie.title,
      startTime: showtime.start,
      selectedSeats: selectedSeats.map(s => ({
        id: s.id,
        label: s.label,
        type: s.type,
        priceModifier: s.priceModifier || 1,
        coupleId: s.coupleId,
      })),
      heldBy,
      name,
      phone,
      email,
      discountCode,
      totalAmount: total,
      basePrice: showtime.price || 50000,
    }
    localStorage.setItem("paymentInfo", JSON.stringify(paymentInfo))

    navigate(`/payment/${code}`)
  }

  return (
    <Card className="border-2 border-primary/20 shadow-lg">
      <CardHeader className="bg-primary/5 pb-4">
        <CardTitle className="text-xl font-bold text-center">
          Tóm tắt đơn hàng
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Ghế đã chọn - Bảng chi tiết */}
        <div className="space-y-3">
          <h4 className="font-semibold text-lg">Ghế đã chọn ({selectedSeats.length} ghế)</h4>
          {grouped.length > 0 ? (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[180px]">Ghế</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead className="text-right">Giá</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grouped.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.label}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {item.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.price.toLocaleString()} đ
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/30 font-bold">
                    <TableCell colSpan={2}>Tổng cộng</TableCell>
                    <TableCell className="text-right text-xl">
                      {total.toLocaleString()} đ
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground italic text-center py-4">
              Chưa chọn ghế nào
            </p>
          )}
        </div>

        {/* Form mã giảm giá */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Mã giảm giá</label>
          <div className="flex gap-2">
            <Input
              placeholder="Nhập mã giảm giá"
              value={discountCode}
              onChange={e => setDiscountCode(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" size="sm">Áp dụng</Button>
          </div>
        </div>

        {/* Thông tin cá nhân */}
        <div className="space-y-4">
          <h4 className="font-semibold text-lg">Thông tin liên hệ</h4>
          <Input
            placeholder="Họ và tên"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <Input
            type="tel"
            placeholder="Số điện thoại"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Nút thanh toán */}
        <Button
          onClick={handleProceedToPayment}
          className="w-full h-12 text-lg"
          disabled={selectedSeats.length === 0}
        >
          Tiếp tục thanh toán
        </Button>
      </CardContent>
    </Card>
  )
}