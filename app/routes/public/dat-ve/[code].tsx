// routes/booking/[code].tsx
import { useParams } from "react-router";
import { useEffect, useState } from "react";
import MovieInfo from "~/components/booking/movieInfo";
import SeatMap from "~/components/booking/seatmap";
import BookingSummary from "~/components/booking/bookingSummary";
import { getShowtimeByPublicCode } from "~/lib/api/showtimeApi";
import type { Showtime, Seat, BookingSeat } from "~/lib/api/types";
export function useHoldCountdown(expiredAt?: string) {
  const [seconds, setSeconds] = useState<number | null>(null)
  
  useEffect(() => {
    if (!expiredAt) return

    const exp = new Date(expiredAt).getTime()

    const interval = setInterval(() => {
      const now = Date.now()
      const diff = Math.max(0, Math.floor((exp - now) / 1000))
      setSeconds(diff)
    }, 1000)

    return () => clearInterval(interval)
  }, [expiredAt])

  return seconds
}
export default function BookingPage() {
  const { code } = useParams<{ code: string }>();
  const [showtime, setShowtime] = useState<Showtime | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<BookingSeat[]>([]);
  const [heldBy, setHeldBy] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
 const [paymentMethod, setPaymentMethod] = useState("CASH")
  useEffect(() => {
    const fetchShowtime = async () => {
      try {
        const data = await getShowtimeByPublicCode(code!);
        setShowtime(data);
      } catch (err) {
        setError("Lỗi khi tải suất chiếu: " + (err as Error).message);
        console.error("Lỗi fetch showtime:", err);
      }
    };

    fetchShowtime();
  }, [code]);

  if (error) return <div>{error}</div>;
  if (!showtime) return <div>Đang tải...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <MovieInfo showtime={showtime} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SeatMap
          code={code!}
          showtimeId={showtime.id}
          selectedSeats={selectedSeats}
          onChange={setSelectedSeats}
          heldBy={heldBy}
          setHeldBy={setHeldBy}
        />

        <BookingSummary
          code={code!}
          showtime={showtime}
          selectedSeats={selectedSeats}
          heldBy={heldBy}
          paymentMethod={paymentMethod}          // ← Truyền xuống
          onPaymentMethodChange={setPaymentMethod} // ← Callback để BookingSummary cập nhật lên cha
        />
      </div>
    </div>
  );
}