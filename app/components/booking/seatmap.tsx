import { useEffect, useState, useRef } from "react"
import Seats from "~/components/booking/Seat"
import {
  getSeatsByShowtime,
  holdSeats,
  releaseSeats,
} from "~/lib/api/showtimeApi"
import { apiClient } from "~/lib/api/client"
import type { BookingSeat, SeatStatus } from "~/lib/api/types"
import { toast } from "sonner"

// Interface cho delta từ WebSocket
interface SeatDelta {
  id: number
  label: string
  type: "NORMAL" | "VIP" | "COUPLE"
  status: SeatStatus
  heldBy?: string
  expiredAt?: Date
}

// Interface cho response từ API hold STAFF
interface HoldStaffResponse {
  heldBy: string
  expiresAt: string
}

interface ApiResponse<T> {
  status: string
  data: T
}

interface SeatRow {
  row: string
  seats: BookingSeat[]
}

export default function SeatMap({
  code,
  showtimeId,
  selectedSeats,
  onChange,
  heldBy,
  setHeldBy,
  isStaff = false,
}: {
  code: string
  showtimeId: number
  selectedSeats: BookingSeat[]
  onChange: (s: BookingSeat[]) => void
  heldBy: string
  setHeldBy: (h: string) => void
  isStaff?: boolean
}) {
  const [seats, setSeats] = useState<SeatRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const wsRef = useRef<WebSocket | null>(null)

  // Load session từ localStorage (chỉ khách hàng)
  useEffect(() => {
    if (isStaff) return

    const savedSession = localStorage.getItem("seat_session")
    const savedExpire = localStorage.getItem("seat_expire")
    const savedSeatIds = localStorage.getItem("selected_seats")

    // Chỉ khôi phục nếu có session VÀ thời gian chưa hết
    if (savedSession && savedExpire && savedSeatIds) {
      const expireDate = new Date(savedExpire)
      const now = Date.now()

      if (expireDate.getTime() > now) {
        // Session còn hạn → khôi phục
        setHeldBy(savedSession)

        const seatIds = JSON.parse(savedSeatIds) as number[]
        const restoredSeats: BookingSeat[] = []

        // Dùng seats từ state hiện tại (đã load từ API)
        seats.forEach(row => {
          row.seats.forEach(s => {
            if (seatIds.includes(s.id)) {
              restoredSeats.push({
                ...s,
                status: "HELD",
                heldBy: savedSession,
              })
            }
          })
        })

        if (restoredSeats.length > 0) {
          onChange(restoredSeats)
        }

        // Cập nhật countdown
        const diff = Math.floor((expireDate.getTime() - now) / 1000)
        setTimeLeft(diff > 0 ? diff : 0)
        setExpiresAt(savedExpire)
      } else {
        // Session hết hạn → xóa localStorage
        localStorage.removeItem("seat_session")
        localStorage.removeItem("seat_expire")
        localStorage.removeItem("selected_seats")
      }
    }
  }, [seats, isStaff]) // Chỉ chạy khi seats load xong

  // Load ghế ban đầu + realtime
  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const res = await getSeatsByShowtime(code)
        if (res.status !== "success") throw new Error()

        const mapped: SeatRow[] = Object.entries(res.data).map(([row, rowSeats]) => ({
          row,
          seats: (rowSeats as any[]).map(seat => ({
            id: seat.id,
            label: seat.label,
            type: seat.type,
            status: seat.status as SeatStatus,
            heldBy: seat.heldBy,
            expiredAt: seat.expiredAt ? new Date(seat.expiredAt) : undefined,
            coupleId: seat.coupleId,
            priceModifier: seat.priceModifier || 1,
          })),
        }))

        setSeats(mapped)

        if (isStaff) {
          const heldRes = await apiClient.get<ApiResponse<{
            heldSeats: BookingSeat[]
            heldBy?: string
          }>>(`/staff/seats/held/${code}`)

          console.log("Held seats response:", heldRes)

          const responseData = heldRes.data || { heldSeats: [], heldBy: undefined }
          const heldSeatsData = responseData.heldSeats || []

          let staffHeldBy = responseData.heldBy
          if (!staffHeldBy && heldSeatsData.length > 0 && heldSeatsData[0].heldBy) {
            staffHeldBy = heldSeatsData[0].heldBy
          }

          if (staffHeldBy) {
            console.log("Staff heldBy:", staffHeldBy)
            setHeldBy(staffHeldBy)

            const restored = heldSeatsData.map(seat => ({
              ...seat,
              status: "HELD" as SeatStatus,
              heldBy: staffHeldBy,
              expiredAt: seat.expiredAt ? new Date(seat.expiredAt) : undefined,
            }))
            onChange(restored)

            const firstExpire = heldSeatsData[0]?.expiredAt
            if (firstExpire) {
              const expireDate = new Date(firstExpire)
              if (!isNaN(expireDate.getTime())) {
                setExpiresAt(firstExpire.toISOString())
                const diff = Math.floor((expireDate.getTime() - Date.now()) / 1000)
                setTimeLeft(diff > 0 ? diff : 0)
              }
            }
          }
        }
      } catch (err) {
        setError("Không thể tải sơ đồ ghế")
        console.error(err)
      }
    }

    fetchSeats()

    // Kết nối WebSocket cho cả customer và staff
    const connectWS = () => {
      if (!showtimeId) return

      wsRef.current = new WebSocket(`ws://${window.location.host}/lich-chieu/ghe/${showtimeId}`)

      wsRef.current.onopen = () => console.log("WS connected (staff:", isStaff, ")")

      wsRef.current.onmessage = (e) => {
        console.log("WS delta received:", e.data) // DEBUG: kiểm tra delta có đến không

        const data = JSON.parse(e.data) as Record<string, SeatDelta[]>

        // Cập nhật sơ đồ ghế
        setSeats(prev => prev.map(row => ({
          ...row,
          seats: row.seats.map(s => {
            const updated = (data[row.row] || []).find(u => u.id === s.id)
            if (updated) {
              return {
                ...s,
                status: updated.status,
                heldBy: updated.heldBy,
                expiredAt: updated.expiredAt ? new Date(updated.expiredAt) : undefined,
              }
            }
            return s
          })
        })))

        // Cập nhật selectedSeats realtime cho staff
        if (isStaff && selectedSeats.length > 0 && heldBy) {
          const updatedSelected = selectedSeats
            .map(s => {
              const updated = Object.values(data).flat().find(u => u.id === s.id)
              if (updated) {
                return {
                  ...s,
                  status: updated.status,
                  heldBy: updated.heldBy,
                  expiredAt: updated.expiredAt ? new Date(updated.expiredAt) : undefined,
                }
              }
              return s
            })
            // Lọc bỏ ghế không còn HELD bởi staff
            .filter(s => s.status === "HELD" && s.heldBy === heldBy)

          //console.log("Updated selectedSeats for staff:", updatedSelected)
          onChange(updatedSelected)

          // Cập nhật countdown từ ghế mới nhất
          if (updatedSelected.length > 0) {
            const latestExpire = updatedSelected
              .filter(s => s.expiredAt)
              .sort((a, b) => b.expiredAt!.getTime() - a.expiredAt!.getTime())[0]?.expiredAt

            if (latestExpire) {
              const expireDate = new Date(latestExpire)
              if (!isNaN(expireDate.getTime())) {
                setExpiresAt(latestExpire.toISOString())
                const diff = Math.floor((expireDate.getTime() - Date.now()) / 1000)
                setTimeLeft(diff > 0 ? diff : 0)
              }
            }
          } else {
            setExpiresAt(null)
            setTimeLeft(0)
          }
        }
      }

      wsRef.current.onclose = () => {
        console.log("WS closed, reconnecting...")
        setTimeout(connectWS, 1000)
      }

      wsRef.current.onerror = () => {
        console.log("WS error, reconnecting...")
        setTimeout(connectWS, 1000)
      }
    }

    let interval: NodeJS.Timeout

    if (isStaff) {

      interval = setInterval(fetchSeats, 12000)
    } else {
      connectWS()
      interval = setInterval(fetchSeats, 5000) // backup
    }

    return () => clearInterval(interval)
  }, [code, showtimeId, isStaff])

  // Countdown timer
  useEffect(() => {
    if (!expiresAt || selectedSeats.length === 0) return

    const expireDate = new Date(expiresAt)
    if (isNaN(expireDate.getTime())) return

    //console.log("Countdown started for", isStaff ? "staff" : "customer", "expiresAt:", expiresAt, "timeLeft:", timeLeft)

    const timer = setInterval(() => {
      const diff = Math.floor((expireDate.getTime() - Date.now()) / 1000)
      setTimeLeft(diff > 0 ? diff : 0)

      if (diff <= 0) {
        clearInterval(timer)
        const releaseSeatsForStaff = async () => {
          try {
            const seatIds = selectedSeats.map(s => s.id)
            if (isStaff) {
              await apiClient.post(`/staff/seats/release/${code}`, { seatIds })
            } else {
              await releaseSeats(code, { seatIds, heldBy })
            }
            onChange([])
            setHeldBy("")
            if (!isStaff) {
              localStorage.removeItem("seat_session")
              localStorage.removeItem("seat_expire")
              localStorage.removeItem("selected_seats")
            }
            setExpiresAt(null)
            setTimeLeft(0)
            toast.warning("Thời gian giữ ghế đã hết. Ghế đã được giải phóng.")
          } catch (err) {
            console.error("Lỗi tự động release:", err)
            toast.error("Không thể giải phóng ghế tự động")
          }
        }
        releaseSeatsForStaff()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [expiresAt, selectedSeats.length, onChange, setHeldBy, isStaff, code, heldBy])

  // Toggle ghế (giữ nguyên)
  const toggleSeat = async (seat: BookingSeat) => {
    // console.log("Click seat:", seat.label, {
    //   status: seat.status,
    //   heldBy: seat.heldBy,
    //   currentHeldByState: heldBy,
    //   isMyHold: seat.status === "HELD" && seat.heldBy === heldBy,
    // })

    const isMyHold = seat.status === "HELD" && seat.heldBy === heldBy
    const isSelected = selectedSeats.some(s => s.id === seat.id)

    if (seat.status === "BOOKED") return
    if (seat.status === "HELD" && !isMyHold) return

    try {
      let seatIdsToToggle: number[] = [seat.id]
      let coupleSeats: BookingSeat[] = [seat]

      if (seat.type === "COUPLE" || seat.coupleId) {
        const coupleSeat = seats
          .flatMap(row => row.seats)
          .find(s => s.coupleId === seat.coupleId && s.id !== seat.id)

        if (coupleSeat) {
          if (coupleSeat.status === "BOOKED" || (coupleSeat.status === "HELD" && coupleSeat.heldBy !== heldBy)) {
            toast.warning("Không thể chọn ghế đôi vì ghế kia đã được chọn hoặc hết hạn.")
            return
          }
          seatIdsToToggle.push(coupleSeat.id)
          coupleSeats.push(coupleSeat)
        } else {
          toast.warning("Không tìm thấy ghế đôi còn lại!")
          return
        }
      }

      if (isSelected) {
        if (isStaff) {
          await apiClient.post(`/staff/seats/release/${code}`, { seatIds: seatIdsToToggle })
        } else {
          await releaseSeats(code, { seatIds: seatIdsToToggle, heldBy })
        }

        const newSelected = selectedSeats.filter(s => !seatIdsToToggle.includes(s.id))
        onChange(newSelected)

        localStorage.setItem("selected_seats", JSON.stringify(newSelected.map(s => s.id)))

        setSeats(prev => prev.map(row => ({
          ...row,
          seats: row.seats.map(s => seatIdsToToggle.includes(s.id) ? { ...s, status: "AVAILABLE" as SeatStatus, heldBy: "" } : s)
        })))

        if (newSelected.length === 0) {
          setHeldBy("")
          if (!isStaff) {
            localStorage.removeItem("seat_session")
            localStorage.removeItem("seat_expire")
            localStorage.removeItem("selected_seats")
          }
          setExpiresAt(null)
          setTimeLeft(0)
        }
      } else {
        if (selectedSeats.length + seatIdsToToggle.length > 10) {
          toast.warning("Tối đa 10 ghế")
          return
        }

        let newHeldBy = heldBy

        if (isStaff) {
          const res = await apiClient.post<ApiResponse<HoldStaffResponse>>(
            `/staff/seats/hold/${code}`,
            { seatIds: seatIdsToToggle }
          )

          const { heldBy: resHeldBy, expiresAt: resExpiresAt } = res.data

          newHeldBy = resHeldBy
          setHeldBy(newHeldBy)

          if (resExpiresAt) {
            const expireDate = new Date(resExpiresAt)
            if (!isNaN(expireDate.getTime())) {
              setExpiresAt(resExpiresAt)
              const diff = Math.floor((expireDate.getTime() - Date.now()) / 1000)
              setTimeLeft(diff > 0 ? diff : 0)
            }
          }
        } else {
          const res = await holdSeats(code, { seatIds: seatIdsToToggle })
          newHeldBy = res.heldBy || heldBy
          setHeldBy(newHeldBy)
          localStorage.setItem("seat_session", newHeldBy)
          localStorage.setItem("seat_expire", res.expiresAt)
          setExpiresAt(res.expiresAt)
          const expireDate = new Date(res.expiresAt)
          setTimeLeft(Math.floor((expireDate.getTime() - Date.now()) / 1000))
        }

        setSeats(prev => prev.map(row => ({
          ...row,
          seats: row.seats.map(s => seatIdsToToggle.includes(s.id) ? { ...s, status: "HELD" as SeatStatus, heldBy: newHeldBy } : s)
        })))

        const newSelected = [
          ...selectedSeats,
          ...coupleSeats.map(s => ({
            ...s,
            status: "HELD" as SeatStatus,
            heldBy: newHeldBy,
          }))
        ]
        onChange(newSelected)

        if (!isStaff) {
          localStorage.setItem("selected_seats", JSON.stringify(newSelected.map(s => s.id)))
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể xử lý ghế")
      console.error(err)
    }
  }

  const showCountdown = selectedSeats.length > 0 && timeLeft > 0

  return (
    <div className="md:col-span-2">
      {showCountdown ? (
        <div className="text-center text-red-500 font-medium mb-4">
          ⏳ Giữ ghế {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
          {isStaff && <span className="text-sm text-gray-500 ml-2">(Nhân viên)</span>}
        </div>
      ) : isStaff ? (
        <div className="text-center text-sm text-gray-600 mb-4">
          Ghế được giữ đến khi tạo vé hoặc hủy thủ công
        </div>
      ) : null}

      <div className="text-center mb-4 font-medium text-lg">MÀN HÌNH</div>

      <div className="space-y-3">
        {seats.map(row => (
          <div key={row.row} className="flex gap-2 justify-center">
            {row.seats.map(seat => (
              <Seats
                key={seat.id}
                seat={seat}
                selected={selectedSeats.some(s => s.id === seat.id)}
                myHeldBy={heldBy}
                onClick={() => toggleSeat(seat)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}