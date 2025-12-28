// routes/public/search.tsx
import { useEffect, useState } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { Card, CardContent } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Film, MapPin } from "lucide-react"
import { searchMovies, searchCinemas } from "~/lib/api/publicApi" // Tạo API này

export default function SearchPage() {
    const [searchParams] = useSearchParams()
    const query = searchParams.get("q") || ""

    const [movies, setMovies] = useState<any[]>([])
    const [cinemas, setCinemas] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    useEffect(() => {
        if (!query.trim()) return;

        const fetchResults = async () => {
            setLoading(true);
            try {
                const [movieRes, cinemaRes] = await Promise.all([
                    searchMovies({ q: query }),
                    searchCinemas({ q: query }),
                ]);
                setMovies(movieRes);
                setCinemas(cinemaRes);
            } catch (err) {
                console.error("Lỗi tìm kiếm:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [query]);

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">
                Kết quả tìm kiếm cho: <span className="text-primary">"{query}"</span>
            </h1>

            {loading ? (
                <p className="text-center py-10">Đang tìm kiếm...</p>
            ) : (
                <div className="space-y-12">
                    {/* Phim */}
                    <div>
                        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                            <Film className="w-6 h-6" /> Phim ({movies.length})
                        </h2>
                        {movies.length === 0 ? (
                            <p className="text-muted-foreground">Không tìm thấy phim</p>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {movies.map((movie) => (
                                    <Link key={movie.id} to={`/phim/${movie.slug}`}>
                                        <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                                            <img
                                                src={movie.posters[0].url || "/placeholder-poster.jpg"}
                                                alt={movie.title}
                                                className="w-full h-64 object-cover"
                                            />
                                            <CardContent className="p-3">
                                                <h3 className="font-medium line-clamp-2">{movie.title}</h3>
                                                <Badge variant="secondary" className="mt-2">
                                                    {movie.genre}
                                                </Badge>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Rạp */}
                    <div>
                        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                            <MapPin className="w-6 h-6" /> Rạp chiếu phim ({cinemas.length})
                        </h2>
                        {cinemas.length === 0 ? (
                            <p className="text-muted-foreground">Không tìm thấy rạp</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {cinemas.map((cinema) => (
                                    <Link key={cinema.id} to={`/rap/${cinema.slug}`}>
                                        <Card className="p-4 hover:shadow-lg transition-shadow">
                                            <h3 className="font-medium">{cinema.name}</h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {cinema.address?.[0]?.fullAddress || "Đang cập nhật"}
                                            </p>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}