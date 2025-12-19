import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { getCinemaDetail, getShowtimeByCinema } from "~/lib/api/cinemaApi"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { MapPin, PlayCircle } from "lucide-react"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import { TrailerDialog } from "~/components/movie/TrailerDialog"

dayjs.locale("vi")

export default function CinemaDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const [cinema, setCinema] = useState<any>(null)
  const [showtimes, setShowtimes] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"))
  const [loading, setLoading] = useState(true)

  // Trailer dialog state
  const [openTrailer, setOpenTrailer] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState<any>(null)

  const dates = Array.from({ length: 6 }, (_, i) => {
    const date = dayjs().add(i, "day")
    return {
      dateStr: date.format("YYYY-MM-DD"),
      display: `${date.format("D/M")}\n${date.format("ddd")}`,
    }
  })

  useEffect(() => {
    if (!slug) return
    setLoading(true)

    Promise.all([
      getCinemaDetail(slug),
      getShowtimeByCinema(slug, selectedDate),
    ])
      .then(([cinemaRes, showtimeRes]) => {
        setCinema(cinemaRes.data)
        setShowtimes(showtimeRes || [])
      })
      .finally(() => setLoading(false))
  }, [slug, selectedDate])

  if (loading) return <p className="p-6">Đang tải...</p>

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* ===== CINEMA INFO ===== */}
      <div className="bg-muted rounded-xl p-6 flex gap-6">
        {cinema?.chain?.logoUrl && (
          <img
            src={cinema.chain.logoUrl}
            className="w-20 h-20 object-contain"
          />
        )}

        <div>
          <h1 className="text-2xl font-bold">{cinema?.name}</h1>
          <p className="flex items-center gap-2 text-muted-foreground mt-1">
            <MapPin className="w-4 h-4" />
            {cinema?.addresses?.[0]?.fullAddress}
          </p>
          <p className="mt-3 text-sm">{cinema?.description}</p>
        </div>
      </div>

      {/* ===== DATE SELECTOR ===== */}
      {/* ===== DATE SELECTOR ===== */}
      {/* ===== DATE SELECTOR ===== */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {dates.map((d, idx) => {
          const isActive = selectedDate === d.dateStr

          return (
            <button
              key={idx}
              onClick={() => setSelectedDate(d.dateStr)}
              className={`
          min-w-[76px]
          h-16
          rounded-2xl
          flex flex-col
          items-center
          justify-center
          border
          transition-all
          ${isActive
                  ? "bg-blue-200 border-blue-300 text-blue-900 font-semibold"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                }
        `}
            >
              <div className="text-sm">
                {dayjs(d.dateStr).format("DD/MM")}
              </div>
              <div className="text-xs">
                {dayjs(d.dateStr).format("ddd")}
              </div>
            </button>
          )
        })}
      </div>



      {/* ===== SHOWTIMES ===== */}
      <div className="space-y-6">
        {showtimes.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            Chưa có lịch chiếu cho ngày này
          </p>
        ) : (
          showtimes.map((item, idx) => (
            <div key={idx} className="border rounded-xl p-4 shadow-sm">
              <div className="flex gap-4">
                {/* POSTER */}
                <div className="relative">
                  {item.movie.posters?.[0]?.url && (
                    <img
                      src={item.movie.posters[0].url}
                      className="w-32 h-48 object-cover rounded"
                    />
                  )}
                </div>

                {/* INFO */}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {item.movie.title}
                  </h3>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <span>
                      {item.movie.ageRestriction} ·{" "}
                      {Math.floor(item.movie.duration / 60)}h{" "}
                      {item.movie.duration % 60}'
                    </span>

                    {/* TRAILER BUTTON */}
                    {item.movie.trailers?.[0]?.url && (
                      <button
                        onClick={() => {
                          setSelectedMovie(item.movie)
                          setOpenTrailer(true)
                        }}
                        className="flex items-center gap-1 text-blue-500 hover:underline"
                      >
                        <PlayCircle className="w-4 h-4" />
                        Trailer
                      </button>
                    )}
                  </div>

                  <p className="font-medium mb-3">
                    {item.showtimes[0]?.format || "2D"} ·{" "}
                    {item.movie.language}
                  </p>

                  {/* TIMES */}
                  <div className="flex flex-wrap gap-3">
                    {item.showtimes.map((st: any) => {
                      const time = dayjs(st.start).format("HH:mm")
                      const isPast = dayjs(st.start).isBefore(dayjs())

                      return (
                        <Button
                          key={st.id}
                          variant={isPast ? "secondary" : "outline"}
                          disabled={isPast}
                          className="flex flex-col h-auto px-3 py-2"
                          onClick={() =>
                            !isPast && navigate(`/dat-ve/${st.publicCode}`)
                          }
                        >
                          <span>{time}</span>
                          <span className="text-xs text-muted-foreground">
                            {st.price / 1000}k
                          </span>
                        </Button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ===== TRAILER DIALOG ===== */}
      {selectedMovie && (
        <TrailerDialog
          open={openTrailer}
          onOpenChange={setOpenTrailer}
          title={selectedMovie.title}
          trailerUrl={selectedMovie.trailers?.[0]?.url}
          genre={selectedMovie.genre}
        />
      )}
    </div>
  )
}
