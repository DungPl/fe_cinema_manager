import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Badge } from "~/components/ui/badge"
import { cn } from "~/lib/utils";

type SeatMapItem = {
  id: number;
  label: string;
  row: string;
  column: number;
  type: string;
  status: string;
  customer?: string;
  phone?: string;
  email?: string;
  // ... các field khác
}

interface SeatMapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seats: SeatMapItem[];
  showtimeId: number;
}

export function SeatMapDialog({ open, onOpenChange, seats, showtimeId }: SeatMapDialogProps) {
  // Nhóm ghế theo row
 const seatsByRow = (seats ?? []).reduce((acc, seat) => {
  if (!acc[seat.row]) acc[seat.row] = [];
  acc[seat.row].push(seat);
  return acc;
}, {} as Record<string, SeatMapItem[]>);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sơ đồ ghế suất chiếu #{showtimeId}</DialogTitle>
        </DialogHeader>

        <div className="p-4">
          {/* Màn hình */}
          <div className="mb-8 text-center">
            <div className="bg-gray-800 text-white py-4 rounded-lg font-bold">
              MÀN HÌNH
            </div>
          </div>

          {/* Sơ đồ ghế */}
          <div className="space-y-4">
            {Object.entries(seatsByRow).map(([row, rowSeats]) => (
              <div key={row} className="flex items-center gap-4">
                <div className="w-10 font-bold text-right">{row}</div>
                <div className="flex flex-wrap gap-2">
                  {rowSeats.map(seat => (
                    <div
                      key={seat.id}
                      className={cn(
                        "w-10 h-10 flex items-center justify-center rounded-md border text-sm font-medium cursor-help",
                        seat.status === "AVAILABLE" && "bg-green-100 border-green-500 hover:bg-green-200",
                        seat.status === "HELD" && "bg-yellow-100 border-yellow-500 hover:bg-yellow-200",
                        seat.status === "BOOKED" && "bg-blue-100 border-blue-500 hover:bg-blue-200",
                        seat.status === "SOLD" && "bg-red-100 border-red-500 hover:bg-red-200"
                      )}
                      title={
                        seat.status !== "AVAILABLE"
                          ? `${seat.status} - ${seat.customer || "N/A"} (${seat.phone || "N/A"}- ${seat.email || "N/A"})`
                          : "Trống"
                      }
                    >
                      {seat.label}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 flex gap-6 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-100 border border-green-500 rounded"></div>
              Trống
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-100 border border-yellow-500 rounded"></div>
              Đang giữ (HELD)
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 border border-blue-500 rounded"></div>
              Đã đặt (BOOKED)
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-100 border border-red-500 rounded"></div>
              Đã bán (SOLD)
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}