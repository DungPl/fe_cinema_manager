import type { BookingSeat } from "~/lib/api/types"

export default function Seats({
  seat,
  selected,
  onClick,
  myHeldBy,
}: {
  seat: BookingSeat
  selected: boolean
  onClick: () => void
  myHeldBy: string
}) {
  const isAvailable = seat.status === "AVAILABLE"
  const isHeld = seat.status === "HELD"
  const isBooked = seat.status === "BOOKED"

  const isMyHold = isHeld && seat.heldBy === myHeldBy
  const isOtherHold = isHeld && seat.heldBy !== myHeldBy

  // Logic màu: ưu tiên trạng thái "đã giữ" (từ backend/WebSocket)
  const getBgClass = () => {
    if (isBooked) return "bg-red-500 text-white cursor-not-allowed"
    if (isOtherHold) return "bg-gray-500 text-white cursor-not-allowed"
    if (isMyHold || selected) return "bg-yellow-400 text-black" // Ghế của bạn hoặc đang chọn
    if (isAvailable) return "bg-gray-200 hover:bg-blue-200"
    return "bg-gray-300 cursor-not-allowed"
  }

  return (
    <button
      disabled={!isAvailable && !isMyHold}
      onClick={isAvailable || isMyHold ? onClick : undefined}
      className={`
        w-9 h-9 rounded text-xs font-semibold transition
        flex items-center justify-center
        ${getBgClass()}

        ${seat.type === "VIP" && "ring-2 ring-purple-500"}
        ${seat.type === "COUPLE" && "ring-2 ring-pink-500 w-20"}
      `}
    >
      {seat.label}
    </button>
  )
}