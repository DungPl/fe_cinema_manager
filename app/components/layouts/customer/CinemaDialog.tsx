import { useMemo, useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { ScrollArea } from "~/components/ui/scroll-area"
import { MapPin } from "lucide-react"
import type { Cinema } from "~/lib/api/types"
import { getCinemaByProvince, getCinemaProvinces } from "~/lib/api/cinemaApi"
import slugify from "slugify"
import { useNavigate } from "react-router-dom"

interface CinemaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cinemas: Cinema[]
  onSelect: (cinema: Cinema) => void
}

export function CinemaDialog({
  open,
  onOpenChange,
  cinemas: initialCinemas,
  onSelect,
}: CinemaDialogProps) {
  const [search, setSearch] = useState("")
  const [province, setProvince] = useState("all")

  const [cinemas, setCinemas] = useState<Cinema[]>(initialCinemas)
  const [loading, setLoading] = useState(false)
  const [provinces, setProvinces] = useState<string[]>([])
  const navigate = useNavigate()

  /* ===================== LOAD PROVINCES ===================== */
  useEffect(() => {
    if (!open) return

    const fetchProvinces = async () => {
      try {
        const res = await getCinemaProvinces()
        setProvinces(["all", ...res])
      } catch (err) {
        console.error("Load provinces failed", err)
      }
    }

    fetchProvinces()
  }, [open])

  /* ===================== FETCH CINEMAS ===================== */
  useEffect(() => {
    if (!open) return

    const fetchCinemas = async () => {
      try {
        setLoading(true)

        const res = await getCinemaByProvince({
          province: province === "all" ? "" : province,
          page: 1,
          limit: 50,
          searchKey: search || undefined,
        })

        setCinemas(res.rows) // ✅ res là Cinema[]
      } catch (err) {
        console.error("Fetch cinemas failed:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchCinemas()
  }, [province, search, open])

  /* ===================== RESET WHEN CLOSE ===================== */
  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setSearch("")
      setProvince("all")
      setCinemas(initialCinemas)
    }
    onOpenChange(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Chọn rạp</DialogTitle>
        </DialogHeader>

        {/* ===================== FILTERS ===================== */}
        <div className="flex gap-3 px-6 pb-4">
          <Input
            placeholder="Tìm rạp theo tên"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select value={province} onValueChange={setProvince}>
            <SelectTrigger className="w-60">
              <SelectValue placeholder="Chọn khu vực" />
            </SelectTrigger>
            <SelectContent>
              {provinces.map(p => (
                <SelectItem key={p} value={p}>
                  {p === "all" ? "Tất cả khu vực" : p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ===================== CINEMA LIST ===================== */}
        <ScrollArea className="h-[300px] border-t">
          <div className="divide-y">
            {loading && (
              <p className="p-6 text-sm text-muted-foreground">
                Đang tải danh sách rạp...
              </p>
            )}

            {!loading && cinemas.length === 0 && (
              <p className="p-6 text-sm text-muted-foreground">
                Không tìm thấy rạp phù hợp
              </p>
            )}

            {cinemas.map(cinema => (
              <div
                key={cinema.id}
                className="flex items-center gap-3 px-4 py-2
                hover:bg-muted cursor-pointer
                transition rounded-md"
                onClick={() => {
                  onSelect(cinema) // Gọi onSelect nếu cần (ví dụ set selected)
                  onOpenChange(false)
                  const slug = slugify(cinema.slug, {
                    lower: true,
                    strict: true,
                    locale: "vi",
                  })
                  navigate(`/rap/${slug}`)
                }}
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Logo từ CinemaChain */}
                  {cinema.chain.logoUrl && (
                    <img
                      src={cinema.chain.logoUrl}
                      alt={`${cinema.chain.name} logo`}
                      className="w-10 h-10 object-contain rounded-md"
                    />
                  )}

                  <div>
                    <h4 className="font-semibold text-sm">{cinema.name}</h4>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {cinema.address?.[0]?.fullAddress}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}