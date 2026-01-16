// components/booking/bookingSummary.tsx
import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router"
import type { Showtime, BookingSeat } from "~/lib/api/types"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "~/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { useAuthStore } from "~/stores/authCustomerStore"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

// Interface cho staff
interface StaffShowtime {
  id: number
  publicCode: string
  movieTitle: string
  startTime: string
  posterUrl?: string
  price?: number
}

type ShowtimeProp = Showtime | StaffShowtime

interface BookingSummaryProps {
  code: string
  showtime: ShowtimeProp | null
  selectedSeats: BookingSeat[]
  heldBy: string
  isStaff?: boolean
  customerInfo?: {
    name: string
    phone: string
    email: string
  }
  paymentMethod: string
  onPaymentMethodChange?: (method: string) => void  // ← Callback mới
  onCustomerInfoChange?: (info: { name: string; phone: string; email: string }) => void
  onProceedToPayment?: () => void  // Callback cho khách online
}

// === TYPE GUARD để phân biệt kiểu ===
function isFullShowtime(showtime: ShowtimeProp): showtime is Showtime {
  return "Movie" in showtime && "Room" in showtime
}

export default function BookingSummary({
  code,
  showtime,
  selectedSeats,
  heldBy,
  isStaff = false,
  onProceedToPayment,
  onCustomerInfoChange,
  paymentMethod,
  onPaymentMethodChange
}: BookingSummaryProps) {
  const navigate = useNavigate()
  const [discountCode, setDiscountCode] = useState("")
  const { customer } = useAuthStore()
  const [name, setName] = useState(customer?.username || customer?.email.split("@")[0] || "")
  const [phone, setPhone] = useState(customer?.phone || "")
  const [email, setEmail] = useState(customer?.email || "")

  // Mặc định MOMO cho khách online, CASH cho staff
  //const [paymentMethod, setPaymentMethod] = useState<string>(isStaff ? "CASH" : "MOMO")


  // Đồng bộ ref mỗi khi state thay đổi

  useEffect(() => {
    onCustomerInfoChange?.({
      name,
      phone,
      email,
    })
  }, [name, phone, email, onCustomerInfoChange])

  const [error, setError] = useState<string | null>(null)

  // Tính giá an toàn
  const calculatePrice = () => {
    if (!showtime) return 0

    const basePrice = isFullShowtime(showtime)
      ? showtime.price || 50000
      : (showtime as StaffShowtime).price || 50000

    let total = 0
    const processedCouples = new Set<number>()

    selectedSeats.forEach(seat => {
      if (seat.coupleId && processedCouples.has(seat.coupleId)) return

      const modifier = seat.priceModifier || 1
      total += basePrice * modifier

      if (seat.coupleId) {
        processedCouples.add(seat.coupleId)
      }
    })

    return total
  }

  const total = calculatePrice()

  // Lấy tên phim và giờ chiếu an toàn
  const movieTitle = showtime
    ? isFullShowtime(showtime)
      ? showtime.Movie?.title || "Phim"
      : (showtime as StaffShowtime).movieTitle
    : ""

  const startTimeStr = showtime
    ? isFullShowtime(showtime)
      ? showtime.start
      : (showtime as StaffShowtime).startTime
    : ""
  const validateCustomerInfo = useCallback(() => {
    if (selectedSeats.length === 0) {
      setError("Vui lòng chọn ít nhất một ghế")
      return false
    }
    if (!name.trim() || !phone.trim() || !email.trim()) {
      setError("Vui lòng điền đầy đủ thông tin liên hệ")
      return false
    }
    if (!showtime) {
      setError("Vui lòng chọn suất chiếu")
      return false
    }
    if (!paymentMethod) {
      setError("Vui lòng chọn phương thức thanh toán")
      return false
    }
    return true
  }, [selectedSeats, name, phone, email, showtime, paymentMethod])
  // Nhóm ghế
  const groupedSeats = () => {
    if (selectedSeats.length === 0) return []

    const basePrice = showtime
      ? isFullShowtime(showtime)
        ? showtime.price || 50000
        : (showtime as StaffShowtime).price || 50000
      : 50000

    const result: { label: string; type: string; price: number }[] = []
    const processedCouples = new Set<number>()

    selectedSeats.forEach(seat => {
      if (seat.coupleId && processedCouples.has(seat.coupleId)) return

      const modifier = seat.priceModifier || 1
      const price = basePrice * modifier

      let label = seat.label
      if (seat.coupleId) {
        const coupleSeat = selectedSeats.find(s => s.coupleId === seat.coupleId && s.id !== seat.id)
        if (coupleSeat) {
          label = `${seat.label} + ${coupleSeat.label}`
          processedCouples.add(seat.coupleId)
        }
      }

      result.push({ label, type: seat.type, price })
    })

    return result
  }

  const grouped = groupedSeats()

  const handleProceed = useCallback(() => {
    if (!validateCustomerInfo()) return



    const paymentInfo = {
      code,
      showtimeId: isFullShowtime(showtime!) ? showtime!.id : showtime!.id,
      movieTitle,
      startTime: startTimeStr,
      selectedSeats: selectedSeats.map(s => ({ id: s.id, label: s.label, type: s.type, priceModifier: s.priceModifier || 1, coupleId: s.coupleId })),
      heldBy,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      discountCode,
      paymentMethod, // ← Dùng ref ở đây
      totalAmount: total,
      basePrice: isFullShowtime(showtime!) ? showtime!.price || 50000 : (showtime as StaffShowtime).price || 50000,
    }

    console.log("Payload gửi đi (useCallback + ref):", paymentInfo)

    localStorage.setItem("paymentInfo", JSON.stringify(paymentInfo))

    if (onProceedToPayment) {
      onProceedToPayment()
    } else {
      navigate(`/payment/${code}`)
    }
  }, [
    code,
    showtime,
    selectedSeats,
    heldBy,
    name,
    phone,
    email,
    discountCode,
    total,
    onProceedToPayment,
    navigate,
    validateCustomerInfo,
    paymentMethod // ← ref không gây re-render
  ])

  if (!showtime) {
    return (
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="bg-primary/5 pb-4">
          <CardTitle className="text-xl font-bold text-center">
            Tóm tắt đơn hàng
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-10 text-gray-500">
          Vui lòng chọn suất chiếu để xem tóm tắt và tính giá
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-primary/20 shadow-lg">
      <CardHeader className="bg-primary/5 pb-4">
        <CardTitle className="text-xl font-bold text-center">
          Tóm tắt đơn hàng
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Thông tin suất chiếu */}
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold">{movieTitle}</h3>
          <p className="text-lg text-gray-600">
            {format(new Date(startTimeStr), "HH:mm - EEEE, dd/MM/yyyy", { locale: vi })}
          </p>
        </div>

        {/* Ghế đã chọn */}
        <div className="space-y-3">
          <h4 className="font-semibold text-lg">Ghế đã chọn ({selectedSeats.length} ghế)</h4>
          {grouped.length > 0 ? (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Ghế</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead className="text-right">Giá</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grouped.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.label}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.type}</Badge>
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
            <p className="text-center py-4 text-muted-foreground italic">
              Chưa chọn ghế nào
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Mã giảm giá</label>
          <div className="flex gap-2">
            <Input placeholder="Nhập mã" value={discountCode} onChange={e => setDiscountCode(e.target.value)} />
            <Button variant="outline" size="sm">Áp dụng</Button>
          </div>
        </div>

        {/* Phương thức thanh toán */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Phương thức thanh toán</label>
          <Select
            value={paymentMethod}
            onValueChange={(value) => {
              onPaymentMethodChange?.(value) // ← Gửi lên cha
              console.log("Dropdown chọn:", value)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn phương thức" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MOMO">MOMO</SelectItem>
              <SelectItem value="VNPAY">VNPAY</SelectItem>
              <SelectItem value="CARD">Thẻ tín dụng/Ghi nợ</SelectItem>
              {isStaff && (
                <SelectItem value="CASH">Tiền mặt (tại quầy)</SelectItem>
              )}
              <SelectItem value="ZALOPAY">ZaloPay</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Thông tin liên hệ */}
        <div className="space-y-4">
          <h4 className="font-semibold text-lg">Thông tin liên hệ</h4>
          <Input placeholder="Họ và tên" value={name} onChange={e => setName(e.target.value)} disabled={!!customer} />
          <Input type="tel" placeholder="Số điện thoại" value={phone} onChange={e => setPhone(e.target.value)} disabled={!!customer} />
          <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} disabled={!!customer} />
          {customer && <p className="text-sm text-muted-foreground">Đã đăng nhập với {customer.email}</p>}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isStaff && (
          <Button
            onClick={handleProceed}
            className="w-full h-12 text-lg"
            disabled={selectedSeats.length === 0}
          >
            Tiếp tục thanh toán
          </Button>
        )}

        {isStaff && (
          <div className="text-center text-sm text-gray-600 mt-6 p-4 bg-blue-50 rounded-lg">
            Nhân viên quầy vé: Vé sẽ được tạo ngay lập tức sau khi xác nhận ở bước tiếp theo
          </div>
        )}
      </CardContent>
    </Card>
  )
}
