// routes/public/movies.tsx
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "~/components/ui/carousel"
import { Heart, Calendar, Film, Clock, SlidersHorizontal } from "lucide-react"
import { getMoviesByStatus } from "~/lib/api/publicApi"
import type { Movie } from "~/lib/api/types"

const FIXED_GENRES = ["Action", "Comedy", "Horror", "Family"]
const FIXED_LANGUAGES = [
  { label: "Tiếng Việt", value: "tiếng Việt " },
  { label: "Tiếng Anh", value: "tiếng Anh" },
  { label: "Tiếng Trung", value: "tiếng Trung" },
  { label: "Tiếng Hàn", value: "tiếng Hàn" },
]

export default function MoviesPage() {
  const [nowShowing, setNowShowing] = useState<Movie[]>([])
  const [comingSoon, setComingSoon] = useState<Movie[]>([])
  const [earlyShow, setEarlyShow] = useState<Movie[]>([])
  const [popular, setPopular] = useState<Movie[]>([])
  const [selectedGenre, setSelectedGenre] = useState<string>("all")
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [nowRes, comingRes, earlyRes] = await Promise.all([
          getMoviesByStatus("NOW_SHOWING"),
          getMoviesByStatus("COMING_SOON"),
          getMoviesByStatus("EARLY_SHOW"),
        ])

        setNowShowing(nowRes)
        setComingSoon(comingRes)
        setEarlyShow(earlyRes)

        // Phim phổ biến (ví dụ: sort theo rating hoặc view)
        const popularRes = await getMoviesByStatus("NOW_SHOWING")
        setPopular(popularRes.slice(0, 10))
      } catch (err) {
        console.error("Lỗi tải phim:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Lọc phim theo thể loại và ngôn ngữ
  const filterMovies = (movies: Movie[]) => {
    return movies.filter(movie => {
      // Lọc thể loại (chỉ khi phim chứa thể loại được chọn)
      const genreMatch = selectedGenre === "all" || movie.genre.includes(selectedGenre)

      // Lọc ngôn ngữ (khớp chính xác movie.language)
      const langMatch = selectedLanguage === "all" || movie.language === selectedLanguage

      return genreMatch && langMatch
    })
  }

  const filteredNow = filterMovies(nowShowing)
  const filteredComing = filterMovies(comingSoon)
  const filteredEarly = filterMovies(earlyShow)
  const filteredPopular = filterMovies(popular)

  const MovieCard = ({ movie }: { movie: Movie }) => (
    <Link to={`/phim/${movie.slug}`} className="block">
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-black/5">
        <div className="relative">
          <img
            src={movie.posters?.[0]?.url || "/placeholder-poster.jpg"}
            alt={movie.title}
            className="w-full h-80 object-cover"
          />
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {movie.statusMovie === "EARLY_SHOW" && (
              <Badge className="bg-red-600 text-white">CHIẾU SỚM</Badge>
            )}
            <Badge className="bg-primary text-white">
              {movie.ageRestriction || "P"}
            </Badge>
          </div>
          <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
            <Heart className="w-3 h-3 fill-red-500" /> 93%
          </div>
        </div>
        <CardContent className="p-3 text-center">
          <h3 className="font-semibold text-base line-clamp-2">{movie.title}</h3>
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground justify-center">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {movie.duration} phút
            </div>
            <Badge variant="outline">{movie.genre}</Badge>
          </div>
          <p className="text-xs text-primary mt-1">
            {new Date(movie.dateRelease).toLocaleDateString("vi-VN")}
          </p>
        </CardContent>
      </Card>
    </Link>
  )

  const Section = ({ title, icon: Icon, movies }: { title: string; icon: any; movies: Movie[] }) => (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Icon className="w-6 h-6 text-primary" />
          {title}
        </h2>
        <Badge variant="secondary">{movies.length} phim</Badge>
      </div>
      {movies.length === 0 ? (
        <p className="text-muted-foreground text-center py-10">
          {selectedGenre !== "all" || selectedLanguage !== "all"
            ? `Không có phim phù hợp với bộ lọc`
            : "Không có phim nào"}
        </p>
      ) : (
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {movies.map((movie) => (
              <CarouselItem key={movie.id} className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/5">
                <MovieCard movie={movie} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      )}
    </section>
  )

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-12">Phim chiếu rạp</h1>

      {/* Bộ lọc */}
      <div className="mb-12 flex flex-col sm:flex-row gap-6 justify-center">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Phổ biến</label>
          <Select defaultValue="popular">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Chọn" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Phổ biến</SelectItem>
              <SelectItem value="rating">Đánh giá cao</SelectItem>
              <SelectItem value="new">Mới nhất</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Thể loại</label>
          <Select 
            value={selectedGenre} 
            onValueChange={setSelectedGenre}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tất cả thể loại" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {FIXED_GENRES.map((genre) => (
                <SelectItem key={genre} value={genre}>
                  {genre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Ngôn ngữ</label>
          <Select 
            value={selectedLanguage} 
            onValueChange={setSelectedLanguage}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tất cả ngôn ngữ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {FIXED_LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Đang tải phim...</p>
        </div>
      ) : (
        <div className="space-y-16">
          <Section title="Phổ biến" icon={Film} movies={filteredPopular} />
          <Section title="Phim đang chiếu" icon={Film} movies={filteredNow} />
          <Section title="Phim chiếu sớm" icon={Calendar} movies={filteredEarly} />
          <Section title="Phim sắp chiếu" icon={Calendar} movies={filteredComing} />
        </div>
      )}
    </div>
  )
}