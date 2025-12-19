import { Crown, Heart } from "lucide-react"
import type { BookingSeat } from "~/lib/api/types"

export default function Seats({
  seat,
  selected,
  onClick,
}: {
  seat: BookingSeat
  selected: boolean
  onClick: () => void
}) {
  const disabled = !seat.isAvailable && !selected

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`
        relative w-8 h-8 rounded
        ${seat.status === "BOOKED" && "bg-gray-400"}
        ${seat.status === "HOLD" && !selected && "bg-yellow-400"}
        ${selected && "bg-green-500"}
        ${seat.type === "VIP" && "border-2 border-yellow-500"}
        ${seat.type === "COUPLE" && "border-2 border-pink-500"}
      `}
    >
      {/* ICON */}
      {seat.type === "VIP" && (
        <Crown size={14} className="absolute -top-2 -right-2 text-yellow-500" />
      )}
      {seat.type === "COUPLE" && (
        <Heart size={14} className="absolute -top-2 -right-2 text-pink-500" />
      )}

      <span className="text-xs">{seat.label}</span>
    </button>
  )
}
