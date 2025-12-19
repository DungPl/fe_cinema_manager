import { useEffect, useState, useRef } from "react"
import Seats from "~/components/booking/Seat"
import {
  getSeatsByShowtime,
  holdSeats,
  releaseSeats,
} from "~/lib/api/showtimeApi"
import type { BookingSeat } from "~/lib/api/types"

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

  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)

  const wsRef = useRef<WebSocket | null>(null)

  // ===============================
  // LOAD GHẾ BAN ĐẦU (TRẠNG THÁI THỰC)
  // ===============================
  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const res = await getSeatsByShowtime(code)

        if (res.status !== "success") throw new Error()

        const mapped: SeatRow[] = Object.entries(res.data).map(
          ([row, rowSeats]) => ({
            row,
            seats: rowSeats.map(seat => ({
              id: seat.id,
              label: seat.label,
              type: seat.type,
              status: seat.status,
              isAvailable: seat.status === "AVAILABLE",
            })),
          })
        )

        setSeats(mapped)
      } catch {
        setError("Không thể tải ghế")
      }
    }

    fetchSeats()
  }, [code])

  // ===============================
  // WEBSOCKET – SYNC REALTIME
  // ===============================
  useEffect(() => {
    if (!showtimeId) return

    wsRef.current = new WebSocket(
      `ws://${window.location.host}/ws/seat/${showtimeId}`
    )

    wsRef.current.onmessage = e => {
      const data = JSON.parse(e.data)

      const mapped: SeatRow[] = Object.entries(data).map(
        ([row, rowSeats]) => ({
          row,
          seats: (rowSeats as any[]).map(seat => ({
            id: seat.id,
            label: seat.label,
            type: seat.type,
            status: seat.status,
            isAvailable: seat.status === "AVAILABLE",
          })),
        })
      )

      setSeats(mapped)
    }

    return () => wsRef.current?.close()
  }, [showtimeId])

  // ===============================
  // COUNTDOWN 10 PHÚT
  // ===============================
  useEffect(() => {
    if (!expiresAt || selectedSeats.length === 0) return

    const timer = setInterval(() => {
      const diff = Math.floor(
        (expiresAt.getTime() - Date.now()) / 1000
      )

      if (diff <= 0) {
        clearInterval(timer)

        onChange([])
        setHeldBy("")
        setExpiresAt(null)
        setTimeLeft(0)

        return
      }

      setTimeLeft(diff)
    }, 1000)

    return () => clearInterval(timer)
  }, [expiresAt, selectedSeats.length])

  // ===============================
  // TOGGLE GHẾ
  // ===============================
  const toggleSeat = async (seat: BookingSeat) => {
    if (seat.status !== "AVAILABLE") return

    const isSelected = selectedSeats.some(s => s.id === seat.id)

    try {
      if (isSelected) {
        await releaseSeats(code, {
          seatIds: [seat.id],
          heldBy,
        })

        const newSelected = selectedSeats.filter(s => s.id !== seat.id)
        onChange(newSelected)

        if (newSelected.length === 0) {
          setHeldBy("")
          setExpiresAt(null)
          setTimeLeft(0)
        }

        return
      }

      if (selectedSeats.length >= 10) {
        alert("Tối đa 10 ghế")
        return
      }

      const res = await holdSeats(code, { seatIds: [seat.id] })

      if (!heldBy && res.sessionId) {
        setHeldBy(res.sessionId)
        setExpiresAt(new Date(res.expiresAt))
      }

      onChange([...selectedSeats, seat])
    } catch {
      alert("Không thể xử lý ghế")
    }
  }

  if (error) return <div>{error}</div>

  return (
    <div className="md:col-span-2">
      {selectedSeats.length > 0 && timeLeft > 0 && (
        <div className="text-center text-red-500 font-medium mb-2">
          ⏳ Giữ ghế {Math.floor(timeLeft / 60)}:
          {(timeLeft % 60).toString().padStart(2, "0")}
        </div>
      )}

      <div className="text-center mb-3 font-medium">MÀN HÌNH</div>

      <div className="space-y-2">
        {seats.map(row => (
          <div key={row.row} className="flex gap-2 justify-center">
            {row.seats.map(seat => (
              <Seats
                key={seat.id}
                seat={seat}
                selected={selectedSeats.some(s => s.id === seat.id)}
                onClick={() => toggleSeat(seat)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
