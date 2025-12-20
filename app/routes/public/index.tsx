import { useEffect, useState } from "react"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { MapPin } from "lucide-react"

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

dayjs.locale("vi")

export default function PublicIndexPage() {
  /* ================== STATE ================== */
  const [locations, setLocations] = useState<LocationResponse[]>([])
  const [chains, setChains] = useState<CinemaChainWithCount[]>([])
  const [cinemas, setCinemas] = useState<Cinema[]>([])
  const [showtimes, setShowtimes] = useState<Showtime[]>([])

  const [selectedProvince, setSelectedProvince] = useState<string>()
  const [selectedChain, setSelectedChain] = useState<number>()
  const [selectedCinema, setSelectedCinema] = useState<Cinema>()
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD")
  )

  const [loading, setLoading] = useState(false)

  /* ================== LOAD LOCATIONS ================== */
  useEffect(() => {
    getCinemaLocations().then(setLocations)
  }, [])

  /* ================== LOAD CHAINS ================== */
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

  /* ================== LOAD CINEMAS ================== */
  useEffect(() => {
    if (!selectedChain || !selectedProvince) return

    getCinemas(selectedChain, selectedProvince).then((data) => {
      setCinemas(data)
      setSelectedCinema(undefined)
      setShowtimes([])
    })
  }, [selectedChain, selectedProvince])

  /* ================== LOAD SHOWTIMES ================== */
  useEffect(() => {
    if (!selectedCinema) return

    setLoading(true)
    getShowtimes(selectedCinema.id, selectedDate)
      .then(setShowtimes)
      .finally(() => setLoading(false))
  }, [selectedCinema, selectedDate])

  /* ================== DATES ================== */
  const dates = Array.from({ length: 6 }, (_, i) =>
    dayjs().add(i, "day").format("YYYY-MM-DD")
  )

  /* ================== RENDER ================== */
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* ===== LOCATION ===== */}
      <div>
        <h2 className="font-semibold mb-2">Khu vực</h2>
        <div className="flex flex-wrap gap-2">
          {locations.map((l) => (
            <Button
              key={l.province}
              variant={
                selectedProvince === l.province ? "default" : "outline"
              }
              onClick={() => setSelectedProvince(l.province)}
            >
              {l.province}
              <Badge variant="secondary" className="ml-2">
                {l.cinemaCount}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* ===== CINEMA CHAINS ===== */}
      {chains.length > 0 && (
        <div>
          <h2 className="font-semibold mb-2">Hệ thống rạp</h2>
          <div className="flex flex-wrap gap-2">
            {chains.map((c) => (
              <Button
                key={c.id}
                variant={selectedChain === c.id ? "default" : "outline"}
                onClick={() => setSelectedChain(c.id)}
              >
                {c.name}
                <Badge variant="secondary" className="ml-2">
                  {c.cinemaCount}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* ===== CINEMAS ===== */}
      {cinemas.length > 0 && (
        <div>
          <h2 className="font-semibold mb-2">Cụm rạp</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cinemas.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCinema(c)}
                className={`border rounded-xl p-4 cursor-pointer transition
                  ${
                    selectedCinema?.id === c.id
                      ? "border-blue-500 bg-blue-50"
                      : "hover:border-slate-300"
                  }`}
              >
                <h3 className="font-semibold">{c.name}</h3>
                <p className="text-sm text-muted-foreground flex gap-1 mt-1">
                  <MapPin className="w-4 h-4" />
                  {c.address[0].province}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== DATE SELECT ===== */}
      {selectedCinema && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {dates.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDate(d)}
              className={`min-w-[72px] h-16 rounded-xl border flex flex-col items-center justify-center
                ${
                  selectedDate === d
                    ? "bg-blue-200 border-blue-300 font-semibold"
                    : "bg-white hover:bg-slate-100"
                }`}
            >
              <span>{dayjs(d).format("DD/MM")}</span>
              <span className="text-xs">{dayjs(d).format("ddd")}</span>
            </button>
          ))}
        </div>
      )}

      {/* ===== SHOWTIMES ===== */}
      {selectedCinema && (
        <div className="space-y-4">
          {loading ? (
            <p>Đang tải lịch chiếu...</p>
          ) : showtimes.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">
              Không có lịch chiếu
            </p>
          ) : (
            showtimes.map((st) => (
              <div
                key={st.id}
                className="border rounded-xl p-4 flex justify-between items-center"
              >
                <div>
                  <h3 className="font-semibold">{st.Movie.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {st.format} · {st.Room.name}
                  </p>
                </div>

                <Button variant="outline">
                  {dayjs(st.start).format("HH:mm")}
                </Button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
