// components/booking/MovieInfo.tsx
import { format } from "date-fns";
import type { Showtime } from "~/lib/api/types";

export default function MovieInfo({ showtime }: { showtime: Showtime }) {
  // Tìm poster primary, fallback đến poster đầu tiên, hoặc placeholder
  const posters = showtime.Movie?.posters ?? []

  const primaryPoster =
    posters.find(p => p.isPrimary)?.url ||
    posters[0]?.url ||
    "/placeholder-poster.jpg"
  //console.log(showtime.Movie.posters)

  return (
    <div className="flex gap-4 border-b pb-4">
      <img
        src={primaryPoster}
        alt={`Poster chính của phim ${showtime.Movie.title}`}
        className="w-24 rounded"
      />

      <div>
        <h2 className="text-xl font-semibold">
          {showtime.Movie.title}
        </h2>

        <p className="text-sm text-muted-foreground">
          {showtime.format}  • {showtime.Room.cinema.name}
        </p>

        <p className="text-sm">
          {format(new Date(showtime.start), "HH:mm dd/MM/yyyy")}
        </p>
      </div>
    </div>
  );
}