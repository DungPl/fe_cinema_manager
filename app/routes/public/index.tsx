import { useEffect, useState } from "react"
import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"
import { CinemaDialog } from "~/components/layouts/customer/CinemaDialog"
import type { Cinema } from "~/lib/api/types"
import { getCinemas } from "~/lib/api/cinemaApi"
import { Film, Ticket, MapPin } from "lucide-react"

export default function HomePage() {
  const [openCinema, setOpenCinema] = useState(false)
  const [cinemas, setCinemas] = useState<Cinema[]>([])
  const [selectedCinema, setSelectedCinema] = useState<Cinema | null>(null)

  useEffect(() => {
    getCinemas({ limit: 999 }).then(res => {
      setCinemas(res.rows)
    })
  }, [])

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative h-[420px] bg-linear-to-r from-black to-zinc-800 text-white rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-[url('/banner-cinema.jpg')] bg-cover bg-center opacity-40" />
        <div className="relative z-10 flex h-full flex-col justify-center px-10 max-w-4xl">
          <h1 className="text-4xl font-bold mb-4">Đặt vé xem phim nhanh chóng</h1>
          <p className="text-lg mb-6 text-zinc-200">
            Chọn rạp – chọn phim – chọn ghế chỉ trong vài bước
          </p>
          <div className="flex gap-4">
            <Button size="lg" onClick={() => setOpenCinema(true)}>
              <Ticket className="mr-2 h-5 w-5" /> Đặt vé ngay
            </Button>
            <Button size="lg" variant="secondary">
              <Film className="mr-2 h-5 w-5" /> Phim đang chiếu
            </Button>
          </div>
        </div>
      </section>

      {/* Quick booking */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-lg" onClick={() => setOpenCinema(true)}>
          <CardContent className="p-6 space-y-2">
            <MapPin className="h-6 w-6 text-primary" />
            <h3 className="font-semibold text-lg">Chọn rạp</h3>
            <p className="text-sm text-muted-foreground">
              {selectedCinema ? selectedCinema.name : "Chọn rạp gần bạn"}
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg">
          <CardContent className="p-6 space-y-2">
            <Film className="h-6 w-6 text-primary" />
            <h3 className="font-semibold text-lg">Chọn phim</h3>
            <p className="text-sm text-muted-foreground">Phim đang chiếu & sắp chiếu</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg">
          <CardContent className="p-6 space-y-2">
            <Ticket className="h-6 w-6 text-primary" />
            <h3 className="font-semibold text-lg">Chọn suất</h3>
            <p className="text-sm text-muted-foreground">Ngày giờ & ghế ngồi</p>
          </CardContent>
        </Card>
      </section>

      {/* Cinema dialog */}
      <CinemaDialog
        open={openCinema}
        onOpenChange={setOpenCinema}
        cinemas={cinemas}
        onSelect={(cinema) => {
          setSelectedCinema(cinema)
          setOpenCinema(false)
        }}
      />
    </div>
  )
}
