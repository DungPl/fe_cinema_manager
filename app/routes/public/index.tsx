import { useEffect, useState } from "react"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import { Badge } from "~/components/ui/badge"
import { MapPin, Info, Calendar, Play } from "lucide-react" // ← Thêm Play icon
import { Button } from "~/components/ui/button"
import { Card } from "~/components/ui/card"
import { ScrollArea } from "~/components/ui/scroll-area"

import {
  getCinemaLocations,
  getCinemaChainsByArea,
  getCinemas,
  getShowtimes,
} from "~/lib/api/publicApi"

import type {
  LocationResponse,
  CinemaChainWithCount,
  Cinema,
  Showtime,
} from "~/lib/api/types"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"

dayjs.locale("vi")

// Component TrailerDialog (copy từ bạn)
interface TrailerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  trailerUrl?: string
  genre?: string
}

function TrailerDialog({
  open,
  onOpenChange,
  title,
  trailerUrl,
  genre,
}: TrailerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* VIDEO */}
        <div className="aspect-video w-full bg-black">
          {trailerUrl ? (
            <video
              controls
              autoPlay
              className="w-full h-full"
              onEnded={(e) => (e.currentTarget.currentTime = 0)}
            >
              <source src={trailerUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="flex items-center justify-center h-full text-white">
              Chưa có trailer
            </div>
          )}
        </div>

        {/* GENRE */}
        {genre && (
          <div className="p-4 flex flex-wrap gap-2">
            {genre.split(",").map((g, idx) => (
              <Badge key={idx} variant="secondary">
                {g.trim()}
              </Badge>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function PublicIndexPage() {
  const navigate = useNavigate()

  /* ================== STATE ================== */
  const [locations, setLocations] = useState<LocationResponse[]>([])
  const [chains, setChains] = useState<CinemaChainWithCount[]>([])
  const [cinemas, setCinemas] = useState<Cinema[]>([])
  const [showtimes, setShowtimes] = useState<Showtime[]>([])

  const [selectedProvince, setSelectedProvince] = useState<string>("Hà Nội")
  const [selectedChain, setSelectedChain] = useState<number | undefined>()
  const [selectedCinema, setSelectedCinema] = useState<Cinema | undefined>()
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"))

  const [loading, setLoading] = useState(false)

  // State cho dialog trailer
  const [trailerOpen, setTrailerOpen] = useState(false)
  const [selectedTrailer, setSelectedTrailer] = useState<{
    title: string
    url?: string
    genre?: string
  } | null>(null)

  const renderLanguageType = (languageType?: string) => {
    switch (languageType) {
      case "VI_SUB":
        return "Phụ đề Việt"
      case "VI_DUB":
        return "Lồng tiếng Việt"
      case "EN_SUB":
        return "Phụ đề Anh"
      default:
        return "Đang cập nhật"
    }
  }

  /* ================== EFFECTS ================== */
  useEffect(() => {
    getCinemaLocations().then((data) => {
      const sorted = data.sort((a, b) => b.totalCinemas - a.totalCinemas)
      setLocations(sorted)
    })
  }, [])

  useEffect(() => {
    if (!selectedProvince) return
    getCinemaChainsByArea(selectedProvince).then((data) => {
      setChains(data)
      setSelectedChain(undefined)
      setCinemas([])
      setSelectedCinema(undefined)
      setShowtimes([])
    })
  }, [selectedProvince])

  useEffect(() => {
    if (!selectedChain || !selectedProvince) return
    getCinemas(selectedChain, selectedProvince).then((res) => {
      setCinemas(res)
      setSelectedCinema(undefined)
      setShowtimes([])
    })
  }, [selectedChain, selectedProvince])

  useEffect(() => {
    if (!selectedCinema) return
    setLoading(true)
    getShowtimes(selectedCinema.id, selectedDate)
      .then((res) => setShowtimes(res ?? []))
      .finally(() => setLoading(false))
  }, [selectedCinema, selectedDate])

  /* ================== DATES ================== */
  const dates = Array.from({ length: 7 }, (_, i) =>
    dayjs().add(i, "day")
  )

  /* ================== HANDLE CLICK ================== */
  const handleSelectCinema = (cinema: Cinema) => {
    setSelectedCinema(cinema)
  }

  const handleGoToCinemaPage = (cinema: Cinema) => {
    if (cinema.slug) {
      navigate(`/rap/${cinema.slug}`)
    }
  }

  const formatPriceK = (price?: number) => {
    if (!price) return ""
    return `${Math.round(price / 1000)}K`
  }

  // Hàm mở dialog trailer
  const handleOpenTrailer = (movie: Showtime["Movie"]) => {
    setSelectedTrailer({
      title: movie.title,
      url: movie.trailers?.[0]?.url, // Lấy trailer đầu tiên nếu có
      genre: movie.genre,
    })
    setTrailerOpen(true)
  }

  /* ================== RENDER ================== */
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ===== CỘT 1: KHU VỰC ===== */}
        <div className="lg:col-span-3">
          <Card className="p-4">
            <h2 className="font-semibold text-lg mb-3">Khu vực</h2>
            <ScrollArea className="h-[500px]">
              <div className="space-y-1">
                {locations.map((loc) => (
                  <div
                    key={loc.province}
                    onClick={() => setSelectedProvince(loc.province)}
                    className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition
                      ${selectedProvince === loc.province ? "bg-blue-500 text-white" : "hover:bg-gray-100"}`}
                  >
                    <span>{loc.province}</span>
                    <Badge variant={selectedProvince === loc.province ? "secondary" : "default"}>
                      {loc.totalCinemas}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* ===== CỘT 2: HỆ THỐNG RẠP + RẠP CON ===== */}
        <div className="lg:col-span-3">
          <Card className="p-4">
            <h2 className="font-semibold text-lg mb-3">Hệ thống rạp</h2>
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {chains.map((chain) => (
                  <div key={chain.id}>
                    <div
                      onClick={() => setSelectedChain(chain.id)}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors
                        ${selectedChain === chain.id ? "bg-blue-500 text-white" : "hover:bg-gray-100"}`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {chain.logoUrl ? (
                          <img
                            src={chain.logoUrl}
                            alt={chain.name}
                            className="w-8 h-8 object-contain rounded"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs font-bold">
                            {chain.name.charAt(0)}
                          </div>
                        )}
                        <span className="font-medium">{chain.name}</span>
                      </div>
                      <Badge
                        variant={selectedChain === chain.id ? "secondary" : "default"}
                        className="ml-2"
                      >
                        {chain.cinemaCount}
                      </Badge>
                    </div>

                    {selectedChain === chain.id && cinemas.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {cinemas.map((cinema) => {
                          const isActive = selectedCinema?.id === cinema.id
                          return (
                            <div
                              key={cinema.id}
                              onClick={() => handleSelectCinema(cinema)}
                              className={`
                                cursor-pointer rounded-md border px-4 py-2 transition
                                ${isActive
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-gray-200 bg-white hover:border-blue-400 hover:bg-gray-50"}
                              `}
                            >
                              <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">
                                {cinema.name}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* ===== CỘT 3: CHI TIẾT RẠP + SHOWTIMES ===== */}
        <div className="lg:col-span-6 space-y-4">
          {selectedCinema ? (
            <>
              {/* Banner thông báo */}
              <div className="bg-yellow-100 p-3 rounded flex items-center gap-2">
                <Info className="w-5 h-5" />
                Nhấn vào suất chiếu để tiến hành mua vé
              </div>

              {/* Thông tin rạp */}
              <Card className="p-4">
                <h2
                  className="font-bold text-xl cursor-pointer hover:text-blue-600 transition"
                  onClick={() => handleGoToCinemaPage(selectedCinema)}
                >
                  {selectedCinema.name}
                </h2>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {selectedCinema.address?.[0]?.fullAddress || "Đang cập nhật địa chỉ"}
                </p>
              </Card>

              {/* Chọn ngày */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {dates.map((date) => {
                  const dateStr = date.format("YYYY-MM-DD")
                  const isSelected = selectedDate === dateStr
                  const isToday = date.isSame(dayjs(), "day")
                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`min-w-[70px] px-3 py-2 rounded-lg border-2 flex flex-col items-center
                        ${isSelected ? "bg-blue-500 text-white border-blue-600" : "bg-white border-gray-200 hover:bg-gray-100"}`}
                    >
                      <span className="text-xs font-medium">
                        {isToday ? "Hôm nay" : date.format("ddd")}
                      </span>
                      <span className="font-bold">{date.format("DD/MM")}</span>
                    </button>
                  )
                })}
              </div>

              {/* Lịch chiếu */}
              {loading ? (
                <p className="text-center py-10">Đang tải lịch chiếu...</p>
              ) : showtimes.length === 0 ? (
                <p className="text-center py-10 text-muted-foreground">
                  Không có lịch chiếu cho ngày này
                </p>
              ) : (
                <div className="space-y-6">
                  {Object.values(
                    showtimes.reduce((acc, st) => {
                      const mid = st.Movie.id
                      if (!acc[mid]) acc[mid] = { movie: st.Movie, formats: {} }
                      const fmt = st.format || "2D"
                      if (!acc[mid].formats[fmt]) acc[mid].formats[fmt] = []
                      acc[mid].formats[fmt].push(st)
                      return acc
                    }, {} as Record<string, { movie: Showtime["Movie"]; formats: Record<string, Showtime[]> }>)
                  ).map(({ movie, formats }) => {
                    const handleGoToMovieDetail = () => {
                      if (movie.slug) {
                        navigate(`/phim/${movie.slug}`)
                      }
                    }

                    return (
                      <Card
                        key={movie.id}
                        className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={handleGoToMovieDetail}
                      >
                        <div className="flex gap-4">
                          {/* Poster */}
                          <div onClick={(e) => { e.stopPropagation(); handleGoToMovieDetail() }}>
                            {movie.posters?.[0]?.url ? (
                              <img
                                src={movie.posters[0].url}
                                alt={movie.title}
                                className="w-24 h-36 object-cover rounded hover:opacity-90 transition"
                              />
                            ) : (
                              <div className="w-24 h-36 bg-gray-200 rounded flex items-center justify-center">
                                <Calendar className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Nội dung phim */}
                          <div className="flex-1">
                            {/* Tên phim + Trailer */}
                            <div className="flex items-start justify-between gap-2">
                              <h3
                                className="font-semibold text-lg hover:text-blue-600 transition cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); handleGoToMovieDetail() }}
                              >
                                {movie.title}
                              </h3>

                              {/* Nút Trailer */}
                              {movie.trailers?.[0]?.url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-1"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleOpenTrailer(movie)
                                  }}
                                >
                                  <Play className="w-4 h-4" />
                                  Trailer
                                </Button>
                              )}
                            </div>

                            <p className="text-sm text-muted-foreground mt-1">
                              {movie.genre} • {movie.duration} phút • {movie.ageRestriction || "Không giới hạn"}
                            </p>

                            {Object.entries(formats).map(([fmt, sts]) => (
                              <div key={fmt} className="mt-4">
                                <p className="font-medium mb-2">
                                  {fmt} • {renderLanguageType(sts[0]?.languageType)}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {sts
                                    .sort((a, b) => dayjs(a.start).unix() - dayjs(b.start).unix())
                                    .map((st) => {
                                      const isExpired = dayjs(st.start).isBefore(dayjs())

                                      return (
                                        <Button
                                          key={st.id}
                                          disabled={isExpired}
                                          variant="outline"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            if (isExpired) {
                                              toast.error("Suất chiếu đã hết hạn!")
                                              return
                                            }
                                            const code = st.publicCode
                                            if (!code) {
                                              toast.error("Không tìm thấy mã suất chiếu!")
                                              return
                                            }
                                            navigate(`/dat-ve/${code}`)
                                          }}
                                          className={`
                                            min-w-[70px]
                                            ${isExpired
                                              ? "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed opacity-60"
                                              : "border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700"}
                                          `}
                                        >
                                          <span className="text-sm font-semibold">
                                            {dayjs(st.start).format("HH:mm")}
                                          </span>
                                          {!isExpired && (
                                            <span className="text-xs font-medium mt-1 block">
                                              {formatPriceK(st.price)}
                                            </span>
                                          )}
                                        </Button>
                                      )
                                    })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </>
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Chọn rạp để xem lịch chiếu</p>
            </Card>
          )}
        </div>
      </div>

      {/* Dialog Trailer */}
      <TrailerDialog
        open={trailerOpen}
        onOpenChange={setTrailerOpen}
        title={selectedTrailer?.title || ""}
        trailerUrl={selectedTrailer?.url}
        genre={selectedTrailer?.genre}
      />
    </div>
  )
}