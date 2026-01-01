import { useParams, useNavigate } from "react-router-dom"
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

  const [cinema, setCinema] = useState<any>(null)
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
      <div className="space-y-8">
        {showtimes.length === 0 ? (
          <p className="text-center text-muted-foreground py-12 text-lg">
            Chưa có lịch chiếu cho ngày này
          </p>
        ) : (
          showtimes.map((movieItem, movieIdx) => {
            const movie = movieItem.movie

            // Nhóm các suất theo combo "format + languageType"
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

            // === SẮP XẾP ƯU TIÊN: 3D/IMAX/4DX lên trên, 2D xuống dưới ===
            groups.sort((a, b) => {
              const formatOrder: { [key: string]: number } = {
                IMAX: 1,
                "4DX": 2,
                "3D": 3,
                "2D": 4,
              }

              const aPriority = formatOrder[a.format] || 999 // 2D hoặc khác → xuống cuối
              const bPriority = formatOrder[b.format] || 999

              return aPriority - bPriority // nhỏ hơn → lên trên
            })

            return (
              <div key={movieIdx} className="border rounded-xl overflow-hidden shadow-md bg-white">
                <div className="flex gap-5 p-5">
                  {/* Poster */}
                  <div className="shrink-0">
                    {movie.posters?.[0]?.url ? (
                      <img
                        src={movie.posters[0].url}
                        alt={movie.title}
                        className="w-32 h-48 object-cover rounded-lg shadow"
                      />
                    ) : (
                      <div className="w-32 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400">No poster</span>
                      </div>
                    )}
                  </div>

                  {/* Thông tin phim */}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2">{movie.title}</h3>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span>{movie.ageRestriction}</span>
                      <span>·</span>
                      <span>
                        {Math.floor(movie.duration / 60)}h {movie.duration % 60}p
                      </span>

                      {/* Trailer */}
                      {movie.trailers?.[0]?.url && (
                        <>
                          <span>·</span>
                          <button
                            onClick={() => {
                              setSelectedMovie(movie)
                              setOpenTrailer(true)
                            }}
                            className="flex items-center gap-1 text-blue-600 hover:underline font-medium"
                          >
                            <PlayCircle className="w-5 h-5" />
                            Trailer
                          </button>
                        </>
                      )}
                    </div>

                    {/* Các định dạng chiếu – 3D/IMAX lên trên */}
                    <div className="space-y-6">
                      {groups.map((group, groupIdx) => (
                        <div key={groupIdx}>
                          <p className="font-semibold text-xl mb-3">
                            {group.format} {group.languageLabel}
                          </p>

                          <div className="flex flex-wrap gap-3">
                            {group.showtimes
                              .sort((a, b) => dayjs(a.start).unix() - dayjs(b.start).unix()) // Sắp xếp giờ tăng dần
                              .map((st) => {
                                const time = dayjs(st.start).format("HH:mm")
                                const isPast = dayjs(st.start).isBefore(dayjs())

                                return (
                                  <Button
                                    key={st.id}
                                    variant={isPast ? "secondary" : "outline"}
                                    size="lg"
                                    disabled={isPast}
                                    className="min-w-24 flex flex-col h-16 px-4 py-2"
                                    onClick={() => !isPast && navigate(`/dat-ve/${st.publicCode}`)}
                                  >
                                    <span className="text-base font-semibold">{time}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {(st.price / 1000).toLocaleString()}k
                                    </span>
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
