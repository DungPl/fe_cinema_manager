import { useParams, useNavigate } from "react-router"
import { useEffect, useState } from "react"
import { getCinemaDetail, getShowtimeByCinema } from "~/lib/api/cinemaApi"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { MapPin, PlayCircle } from "lucide-react"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import { TrailerDialog } from "~/components/movie/TrailerDialog"
import type { LanguageType, MovieWithShowtimes } from "~/lib/api/types"
export const LANGUAGE_LABELS: Record<LanguageType, string> = {
  VI_SUB: "Phụ đề Việt",
  VI_DUB: "Lồng tiếng Việt",
  EN_SUB: "Phụ đề Anh",
  EN_DUB: "Lồng tiếng Anh",
}
dayjs.locale("vi")
export function getLanguageLabel(type?: LanguageType | string): string {
  if (!type) return "Không xác định"
  return LANGUAGE_LABELS[type as LanguageType] || type
}
export default function CinemaDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const [cinema, setCinema] = useState<any>()
  const [showtimes, setShowtimes] = useState<MovieWithShowtimes[]>([])
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
        //console.log("Cinema detail:", cinemaRes.data)
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
            {cinema.address && cinema.address.length > 0
              ? cinema.address[0].fullAddress
              : "Chưa có thông tin địa chỉ"}
          </p>
          <p className="mt-3 text-sm">{cinema?.description}</p>
        </div>
      </div>


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
          <p className="text-center text-muted-foreground py-16 text-lg">
            Chưa có lịch chiếu cho ngày này
          </p>
        ) : (
          showtimes.map((movieItem, movieIdx) => {
            const movie = movieItem.movie

            // Nhóm theo format + ngôn ngữ
            const groupedByFormatLang = movieItem.showtimes.reduce((acc, st) => {
              const key = `${st.format || "2D"}-${st.languageType || "VI_SUB"}`
              if (!acc[key]) {
                acc[key] = {
                  format: st.format || "2D",
                  languageLabel: getLanguageLabel(st.languageType),
                  showtimes: [],
                }
              }
              acc[key].showtimes.push(st)
              return acc
            }, {} as Record<string, { format: string; languageLabel: string; showtimes: any[] }>)

            const groups = Object.values(groupedByFormatLang)

            // Sắp xếp ưu tiên: IMAX > 4DX > 3D > 2D
            groups.sort((a, b) => {
              const order: Record<string, number> = { IMAX: 1, "4DX": 2, "3D": 3, "2D": 4 }
              return (order[a.format] || 999) - (order[b.format] || 999)
            })

            return (
              <div
                key={movieIdx}
                className="border rounded-xl overflow-hidden bg-card hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex gap-4 p-4">
                  {/* Poster nhỏ gọn */}
                  <div className="shrink-0">
                    {movie.posters?.[0]?.url ? (
                      <img
                        src={movie.posters[0].url}
                        alt={movie.title}
                        className="w-20 h-28 object-cover rounded-md shadow-sm"
                      />
                    ) : (
                      <div className="w-20 h-28 bg-muted rounded-md flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">No poster</span>
                      </div>
                    )}
                  </div>

                  {/* Nội dung chính */}
                  <div className="flex-1 min-w-0">
                    {/* Tên phim + thông tin cơ bản */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-bold text-lg line-clamp-2 pr-2">{movie.title}</h3>

                      {/* Nút Trailer nhỏ */}
                      {movie.trailers?.[0]?.url && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedMovie(movie)
                            setOpenTrailer(true)
                          }}
                          className="shrink-0 text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm font-medium"
                        >
                          <PlayCircle className="w-4 h-4" />
                          Trailer
                        </button>
                      )}
                    </div>

                    {/* Thông tin phụ */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-4">
                      <span className="px-2 py-1 bg-muted rounded">{movie.ageRestriction}</span>
                      <span>•</span>
                      <span>{Math.floor(movie.duration / 60)}h {movie.duration % 60}p</span>
                    </div>

                    {/* Các suất chiếu – gọn nhất có thể */}
                    <div className="space-y-4">
                      {groups.map((group, groupIdx) => (
                        <div key={groupIdx}>
                          {/* Tiêu đề định dạng */}
                          <p className="font-medium text-sm text-primary mb-2">
                            {group.format} • {group.languageLabel}
                          </p>

                          {/* Danh sách suất */}
                          <div className="flex flex-wrap gap-2">
                            {group.showtimes
                              .sort((a, b) => dayjs(a.start).unix() - dayjs(b.start).unix())
                              .map((st) => {
                                const time = dayjs(st.start).format("HH:mm")
                                const isPast = dayjs(st.start).isBefore(dayjs())

                                return (
                                  <Button
                                    key={st.id}
                                    variant={isPast ? "secondary" : "outline"}
                                    size="sm"
                                    disabled={isPast}
                                    className={`
                                min-w-20 h-11 text-sm font-medium
                                ${isPast
                                        ? "opacity-60 cursor-not-allowed"
                                        : "hover:bg-primary hover:text-primary-foreground"
                                      }
                              `}
                                    onClick={() => !isPast && navigate(`/dat-ve/${st.publicCode}`)}
                                  >
                                    <div className="flex flex-col items-center leading-tight">
                                      <span className="font-semibold">{time}</span>
                                      <span className="text-xs opacity-80">
                                        {(st.price / 1000).toLocaleString()}k
                                      </span>
                                    </div>
                                  </Button>
                                )
                              })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
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
