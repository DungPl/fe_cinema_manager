import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import dayjs from "dayjs"
import "dayjs/locale/vi"

import { Button } from "~/components/ui/button"
import { Card } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { ScrollArea } from "~/components/ui/scroll-area"
import { MapPin, Info, User, Users } from "lucide-react"
import { useNavigate } from "react-router-dom"
import {
  getMovieDetail,
  getShowtimesByMovie,
} from "~/lib/api/publicApi"

import type {
  Movie,
  MovieShowtimeResponse,
} from "~/lib/api/types"
import { toast } from "sonner"

dayjs.locale("vi")

const FORMATS = ["2D", "3D", "IMAX", "4DX"]

export default function MovieDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const [movie, setMovie] = useState<Movie | null>(null)
  const [province, setProvince] = useState("Hà Nội")
  const [format, setFormat] = useState<string | undefined>()
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"))
  const [selectedChain, setSelectedChain] = useState<number | undefined>()
  const [showtimeData, setShowtimeData] = useState<MovieShowtimeResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [openCinemaId, setOpenCinemaId] = useState<number | null>(null)
  /* ================= LOAD MOVIE ================= */
  useEffect(() => {
    if (!slug) return
    getMovieDetail(slug).then(setMovie)
  }, [slug])

  /* ================= LOAD SHOWTIMES ================= */
  useEffect(() => {
    if (!movie) return

    setLoading(true)
    getShowtimesByMovie({
      movieId: movie.id,
      province,
      format,
      date: selectedDate,
      chainId: selectedChain,
    })
      .then((data) => {
        //console.log("API Response:", data)
        setShowtimeData(data)
      })
      .finally(() => setLoading(false))
  }, [
    movie,
    province,
    format,
    selectedChain,
    selectedDate, // ✅ BẮT BUỘC
  ])


  // Tạo mảng 7 ngày
  const dates = Array.from({ length: 7 }, (_, i) => dayjs().add(i, "day"))

  if (!movie) return null
  const isTodaySelected = selectedDate === dayjs().format("YYYY-MM-DD")
  const now = dayjs()
  const formatPriceK = (price?: number) => {
    if (!price) return ""
    return `${Math.round(price / 1000)}K`
  }
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* ===== MOVIE INFO ===== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <img
          src={movie.posters?.[0]?.url}
          alt={movie.title}
          className="rounded-lg object-cover"
        />

        <div className="md:col-span-3 space-y-4">
          <h1 className="text-3xl font-bold">{movie.title}</h1>

          <div className="flex gap-2 flex-wrap">
            <Badge>{movie.genre}</Badge>
            <Badge>{movie.duration} phút</Badge>
            <Badge>{movie.ageRestriction}</Badge>
          </div>

          <p className="text-muted-foreground">{movie.description}</p>

          {/* Thêm đạo diễn */}
          {movie.director && (
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-bold text-blue-600">Đạo diễn:</span> {/* In đậm và thêm màu xanh */}
              <span>{movie.director.name}</span>
            </div>
          )}

          {/* Thêm diễn viên */}
          {movie.actors && movie.actors.length > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <Users className="w-4 h-4 text-muted-foreground mt-1" />
              <div>
                <span className="font-bold text-purple-600">Diễn viên:</span> {/* In đậm và thêm màu tím */}
                <div className="flex flex-wrap gap-1 mt-1">
                  {movie.actors.slice(0, 5).map((actor) => (
                    <Badge key={actor.id} variant="secondary">
                      {actor.name}
                    </Badge>
                  ))}
                  {movie.actors.length > 5 && (
                    <Badge variant="outline">+{movie.actors.length - 5}</Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {movie.trailers?.[0]?.url && (
            <a href={movie.trailers[0].url} target="_blank" className="text-blue-600 underline">
              ▶ Xem trailer
            </a>
          )}
        </div>
      </div>

      {/* ===== FILTERS ===== */}
      <Card className="p-4 space-y-4">
        <div className="flex gap-4 flex-wrap items-center">
          {/* Province */}
          <select
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className="border rounded px-3 py-2 min-w-[180px]"
          >
            <option>Hà Nội</option>
            <option>TP. Hồ Chí Minh</option>
            <option>Đà Nẵng</option>
            {/* Thêm các tỉnh khác nếu cần */}
          </select>

          {/* Format */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={format === undefined ? "default" : "outline"}
              onClick={() => setFormat(undefined)}
            >
              Tất cả
            </Button>
            {FORMATS.map((f) => (
              <Button
                key={f}
                variant={format === f ? "default" : "outline"}
                onClick={() => setFormat(f)}
              >
                {f}
              </Button>
            ))}
          </div>
        </div>

        {/* Chọn ngày */}
        <ScrollArea className="max-w-full">
          <div className="flex gap-2 pb-2">
            {dates.map((date) => {
              const dateStr = date.format("YYYY-MM-DD")
              const isSelected = selectedDate === dateStr
              const isToday = date.isSame(dayjs(), "day")
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`min-w-20 px-4 py-3 rounded-lg border-2 flex flex-col items-center transition-all
                    ${isSelected ? "bg-blue-600 text-white border-blue-700 shadow-md" : "bg-white border-gray-300 hover:border-blue-500 hover:shadow"}`}
                >
                  <span className="text-xs font-medium">
                    {isToday ? "Hôm nay" : date.format("ddd")}
                  </span>
                  <span className="text-lg font-bold">{date.format("DD")}</span>
                  <span className="text-xs uppercase">{date.format("MMM")}</span>
                </button>
              )
            })}
          </div>
        </ScrollArea>
      </Card>

      {/* ===== SHOWTIMES ===== */}
      {loading ? (
        <p className="text-center py-10">Đang tải lịch chiếu...</p>
      ) : !showtimeData || !showtimeData.chains || showtimeData.chains.length === 0 ? (
        <p className="text-center py-10 text-muted-foreground">
          Không có lịch chiếu cho ngày này
        </p>
      ) : (
        <div className="space-y-6">
          {/* Banner thông báo */}
          <div className="bg-yellow-100 p-3 rounded flex items-center gap-2">
            <Info className="w-5 h-5" />
            Nhấn vào suất chiếu để tiến hành mua vé
          </div>

          {/* Danh sách theo chain - dùng optional chaining */}
          {showtimeData.chains?.map((chainGroup) => (
            <Card key={chainGroup.chain.id} className="overflow-hidden border-none shadow-md">
              {/* Header chain */}
              <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {chainGroup.chain.logoUrl ? (
                    <img
                      src={chainGroup.chain.logoUrl}
                      alt={chainGroup.chain.name}
                      className="w-10 h-10 object-contain bg-white rounded p-1"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-white rounded flex items-center justify-center text-blue-600 font-bold">
                      {chainGroup.chain.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-lg">{chainGroup.chain.name}</h3>
                    <p className="text-sm opacity-90">{chainGroup.cinemas?.length || 0} rạp</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="text-white hover:bg-blue-700"
                  onClick={() => setSelectedChain(chainGroup.chain.id)}
                >
                  Xem tất cả
                </Button>
              </div>

              {/* Danh sách rạp con */}
              <div className="p-4 space-y-4">
                {chainGroup.cinemas?.map((c) => (
                  <div key={c.cinema.id}>
                    <div
                      className="mb-1 flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none"
                      onClick={() =>
                        setOpenCinemaId(
                          openCinemaId === c.cinema.id ? null : c.cinema.id
                        )
                      }
                    >
                      <MapPin className="w-3.5 h-3.5 text-gray-500" />

                      <span className="font-medium">
                        {c.cinema.name}
                      </span>

                      <span className="ml-auto text-xs text-gray-400">
                        {openCinemaId === c.cinema.id ? "▲" : "▼"}
                      </span>
                    </div>

                    {/* Thông tin phụ: địa chỉ / phòng */}
                    {c.cinema.address && (
                      <div className="text-xs text-gray-500 mb-2 ml-4">
                        {c.cinema.address[0].fullAddress}
                      </div>
                    )}

                    {openCinemaId === c.cinema.id && (
                      <div className="flex flex-wrap gap-3 mt-2 ml-4">
                        {c.showtimes
                          ?.filter((st) => dayjs(st.start).format("YYYY-MM-DD") === selectedDate)
                          ?.sort((a, b) => dayjs(a.start).unix() - dayjs(b.start).unix())
                          ?.map((st) => {
                            const isExpired = dayjs(st.start).isBefore(dayjs());

                            return (
                              <Button
                                key={st.id}
                                disabled={isExpired}
                                variant="outline"
                                onClick={() => {
                                  if (isExpired) {
                                    toast.warning("Suất chiếu đã hết hạn!");
                                    return;
                                  }
                                  const code = st.publicCode;
                                  if (!code) {
                                    toast.error("Không tìm thấy mã suất chiếu!");
                                    console.error("Missing publicCode:", st);
                                    return;
                                  }
                                  console.log("Navigating to booking with code:", code);
                                  navigate(`/dat-ve/${code}`);
                                }}
                                className={`
                                  min-w-[70px] h-14 flex flex-col items-center justify-center leading-tight
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
                            );
                          })}
                      </div>
                    )}
                  </div>
                )) || <p className="text-muted-foreground">Không có rạp nào</p>}
              </div>
            </Card>
          )) || <p className="text-muted-foreground text-center">Không có hệ thống rạp nào</p>}
        </div>
      )}
    </div>
  );
}