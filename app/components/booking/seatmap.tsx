import { useEffect, useState, useRef } from "react"
import Seats from "~/components/booking/Seat"
import {
  getSeatsByShowtime,
  holdSeats,
  releaseSeats,
  // Thêm API mới (backend cần implement)
  getHeldSeatBySessionId,
} from "~/lib/api/showtimeApi"
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
}: {
  code: string
  showtimeId: number
  selectedSeats: BookingSeat[]
  onChange: (s: BookingSeat[]) => void
  heldBy: string
  setHeldBy: (h: string) => void
}) {
  const [seats, setSeats] = useState<SeatRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)

  const wsRef = useRef<WebSocket | null>(null)

  // Load session và ghế cũ từ localStorage khi mount
  useEffect(() => {
    const savedSession = localStorage.getItem("seat_session")
    const savedExpire = localStorage.getItem("seat_expire")
    const savedSeatIds = localStorage.getItem("selected_seats")

    if (savedSession && !heldBy) {
      setHeldBy(savedSession)
    }

    if (savedExpire) {
      const expireDate = new Date(savedExpire)
      if (!isNaN(expireDate.getTime())) {
        const diff = Math.floor((expireDate.getTime() - Date.now()) / 1000)
        setTimeLeft(diff > 0 ? diff : 0)
        setExpiresAt(savedExpire)
      }
    }

    // Khôi phục ghế từ localStorage (sau khi seats load xong)
    if (savedSeatIds && savedSession) {
      const seatIds = JSON.parse(savedSeatIds) as number[]
      const restoredSeats: BookingSeat[] = []
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
    }
  }, [seats]) // Chạy lại khi seats load xong

  // Load ghế ban đầu + WebSocket realtime
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
            expiredAt: seat.expiredAt,
            coupleId: seat.coupleId,
            priceModifier: seat.priceModifier
          })),
        }))

        setSeats(mapped)
      } catch {
        setError("Không thể tải ghế")
      }
    }

    fetchSeats()

    // WebSocket + reconnect
    const connectWS = () => {
      if (!showtimeId) return
      wsRef.current = new WebSocket(`ws://${window.location.host}/lich-chieu/ghe/${showtimeId}`)

      wsRef.current.onopen = () => console.log("WS connected")
      wsRef.current.onmessage = (e) => {
        const data = JSON.parse(e.data) as Record<string, SeatDelta[]>

        setSeats(prev => {
          const newSeats = prev.map(row => ({
            ...row,
            seats: row.seats.map(s => {
              const updated = (data[row.row] || []).find((u: SeatDelta) => u.id === s.id)
              return updated ? { ...s, ...updated } : s
            })
          }))
          return newSeats
        })
      }

      wsRef.current.onclose = () => setTimeout(connectWS, 1000)
      wsRef.current.onerror = () => setTimeout(connectWS, 1000)
    }

    connectWS()

    // Polling fallback (5s)
    const interval = setInterval(fetchSeats, 5000)

    return () => {
      wsRef.current?.close()
      clearInterval(interval)
    }
  }, [code, showtimeId])

  // Countdown timer
  useEffect(() => {
    if (!expiresAt || selectedSeats.length === 0) return

    const expireDate = new Date(expiresAt)
    if (isNaN(expireDate.getTime())) return

    const timer = setInterval(() => {
      const diff = Math.floor((expireDate.getTime() - Date.now()) / 1000)
      if (diff <= 0) {
        clearInterval(timer)
        onChange([])
        setHeldBy("")
        localStorage.removeItem("seat_session")
        localStorage.removeItem("seat_expire")
        localStorage.removeItem("selected_seats")
        setExpiresAt(null)
        setTimeLeft(0)
        return
      }
      setTimeLeft(diff)
    }, 1000)

    return () => clearInterval(timer)
  }, [expiresAt, selectedSeats.length, onChange, setHeldBy])

  // Toggle ghế + xử lý ghế đôi
  const toggleSeat = async (seat: BookingSeat) => {
  const isMyHold = seat.status === "HELD" && seat.heldBy === heldBy
  const isSelected = selectedSeats.some(s => s.id === seat.id)

  if (seat.status === "BOOKED") return
  if (seat.status === "HELD" && !isMyHold) return

  try {
    let seatIdsToToggle: number[] = [seat.id]
    let coupleSeats: BookingSeat[] = [seat]

    // Xử lý ghế đôi
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
      // Bỏ chọn (release)
      if (!heldBy) {
        toast.warning("Không có session để release")
        return
      }
      await releaseSeats(code, { seatIds: seatIdsToToggle, heldBy })
      const newSelected = selectedSeats.filter(s => !seatIdsToToggle.includes(s.id))
      onChange(newSelected)

      localStorage.setItem("selected_seats", JSON.stringify(newSelected.map(s => s.id)))

      setSeats(prev => prev.map(row => ({
        ...row,
        seats: row.seats.map(s => seatIdsToToggle.includes(s.id) ? { ...s, status: "AVAILABLE" as SeatStatus, heldBy: "" } : s)
      })))

      if (newSelected.length === 0) {
        setHeldBy("")
        localStorage.removeItem("seat_session")
        localStorage.removeItem("seat_expire")
        localStorage.removeItem("selected_seats")
        setExpiresAt(null)
        setTimeLeft(0)
      }
    } else {
      // Chọn (hold)
      if (selectedSeats.length + seatIdsToToggle.length > 10) {
        toast.warning("Tối đa 10 ghế")
        return
      }

      const res = await holdSeats(code, { seatIds: seatIdsToToggle })

      const newHeldBy = res.heldBy || heldBy
      setHeldBy(newHeldBy)
      localStorage.setItem("seat_session", newHeldBy)
      localStorage.setItem("seat_expire", res.expiresAt)
      setExpiresAt(res.expiresAt)
      const expireDate = new Date(res.expiresAt)
      setTimeLeft(Math.floor((expireDate.getTime() - Date.now()) / 1000))

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

      localStorage.setItem("selected_seats", JSON.stringify(newSelected.map(s => s.id)))
    }
  } catch (err: any) {
    toast.error(err.message || "Không thể xử lý ghế")
    console.error(err)
  }
}

  if (error) return <div className="text-red-500 text-center">{error}</div>

  return (
    <div className="md:col-span-2">
      {selectedSeats.length > 0 && timeLeft > 0 && (
        <div className="text-center text-red-500 font-medium mb-4">
          ⏳ Giữ ghế {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
        </div>
      )}

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