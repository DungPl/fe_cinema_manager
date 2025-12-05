// ~/components/movie/EditMovieDialog.tsx
import { useState, useEffect } from "react"
import { Button } from "~/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "~/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import { Badge } from "~/components/ui/badge"
import { toast } from "sonner"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { editMovie, getDirectors, getActors } from "~/lib/api/movieApi"
import type { Movie, Director, Actor } from "~/lib/api/types"

interface Props {
  movie: Movie
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const ageOptions = ["P", "K", "T13", "T16", "T18"] as const
const statusOptions = ["COMING_SOON", "NOW_SHOWING", "ENDED"] as const
function processDateField(value: string | undefined, original?: string | null) {
  if (value === undefined) return undefined;         // không đổi → bỏ qua
  if (value === "") return null;                     // người dùng xóa → null
  if (value === original?.split("T")[0]) return undefined; // giống cũ → bỏ qua
  return `${value}T00:00:00.000Z`;                   // người dùng đổi → gắn Z
}
export default function EditMovieDialog({ movie, open, onOpenChange, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    title: movie.title || "",
    genre: movie.genre || "",
    duration: movie.duration?.toString() || "",
    language: movie.language || "",
    description: movie.description || "",
    country: movie.country || "",
    ageRestriction: movie.ageRestriction || "P",
    statusMovie: movie.statusMovie || "COMING_SOON",
    dateRelease: movie.dateRelease ? movie.dateRelease.split("T")[0] : "",
    dateSoon: movie.dateSoon ? movie.dateSoon?.split("T")[0] : "",
    dateEnd: movie.dateEnd ? movie.dateEnd?.split("T")[0] : "",
  })

  // Đạo diễn
  const [directorOpen, setDirectorOpen] = useState(false)
  const [directorSearch, setDirectorSearch] = useState("")
  const [directors, setDirectors] = useState<Director[]>([])
   const [directorLoading, setDirectorLoading] = useState(false)
  const [selectedDirector, setSelectedDirector] = useState<Director | null>(movie.director || null)
  const [directorPage, setDirectorPage] = useState(1)
  // Diễn viên
  const [actorOpen, setActorOpen] = useState(false)
  const [actorSearch, setActorSearch] = useState("")
  const [actors, setActors] = useState<Actor[]>([])
  const [selectedActors, setSelectedActors] = useState<Actor[]>(movie.actors || [])
  const [actorPage, setActorPage] = useState(1)
  const [actorHasMore, setActorHasMore] = useState(true)
  const [actorLoading, setActorLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load danh sách khi mở dialog hoặc tìm kiếm
 useEffect(() => {
  if (!directorOpen || !open) return

  const fetchDirectors = async () => {
    if (directorLoading) return
    setDirectorLoading(true)

    try {
      const res = await getDirectors({
        search: directorSearch || undefined,
        page: directorPage,
        limit: 20,
      })

      const newDirectors = res.data.rows
      if (directorPage === 1) {
        setDirectors(newDirectors)
      } else {
        setDirectors(prev => [...prev, ...newDirectors])
      }

      // Nếu muốn phân trang
      // setDirectorHasMore((res.data.page || 1) * (res.data.limit || 20) < res.data.totalCount)
    } catch (err) {
      toast.error("Không tải được danh sách đạo diễn")
    } finally {
      setDirectorLoading(false)
    }
  }

  fetchDirectors()
}, [directorSearch, directorPage, directorOpen, open])


  // useEffect(() => {
  //   if (open && actorOpen) {
  //     getActors(actorSearch).then(res => setActors(res.data.rows))
  //   }
  // }, [actorSearch, actorOpen, open])
  useEffect(() => {
    if (!actorOpen || !open) return

    const fetchActors = async () => {
      if (actorLoading) return
      setActorLoading(true)

      try {
        const res = await getActors({
          search: actorSearch || undefined,
          page: actorPage,
          limit: 20,
        })

        const newActors = res.data.rows

        if (actorPage === 1) {
          setActors(newActors)
        } else {
          setActors(prev => [...prev, ...newActors])
        }

        setActorHasMore((res.data.page || 1) * (res.data.limit || 20) < res.data.totalCount)
      } catch (err) {
        toast.error("Không tải được danh sách diễn viên")
      } finally {
        setActorLoading(false)
      }
    }

    fetchActors()
  }, [actorSearch, actorPage, actorOpen, open])
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload: any = { ...formData }

      // Chỉ gửi các field thay đổi
      const original = {
        title: movie.title,
        genre: movie.genre,
        duration: movie.duration?.toString(),
        language: movie.language,
        description: movie.description,
        country: movie.country,
        ageRestriction: movie.ageRestriction,
        statusMovie: movie.statusMovie,
        dateRelease: movie.dateRelease?.split("T")[0],
        dateSoon: movie.dateSoon?.split("T")[0],
        dateEnd: movie.dateEnd?.split("T")[0],
      }

      Object.keys(payload).forEach(key => {
        if (payload[key] === original[key as keyof typeof original]) {
          delete payload[key]
        }
      })

      // Xử lý đạo diễn
      if (selectedDirector && selectedDirector.id !== movie.director?.id) {
        payload.directorId = selectedDirector.id
      }

      // Xử lý diễn viên (gửi tên nếu mới tạo, hoặc id nếu đã có)
      if (selectedActors.length > 0) {
        const existingActorIds = selectedActors
          .filter(a => a.id && movie.actors?.some(ma => ma.id === a.id))
          .map(a => a.id!)

        const newActorNames = selectedActors
          .filter(a => !a.id || !movie.actors?.some(ma => ma.id === a.id))
          .map(a => a.name)

        if (existingActorIds.length > 0) payload.actorIds = existingActorIds
        if (newActorNames.length > 0) payload.actorNames = newActorNames
      }
      // Xử lý ngày: Chuyển sang định dạng RFC3339 đầy đủ (không có milli giây)
      // Xử lý ngày
      const originalSoon = movie.dateSoon;
      const originalRelease = movie.dateRelease;
      const originalEnd = movie.dateEnd;

      const newSoon = processDateField(payload.dateSoon, originalSoon);
      const newRelease = processDateField(payload.dateRelease, originalRelease);
      const newEnd = processDateField(payload.dateEnd, originalEnd);

      // Nếu undefined → không gửi field
      if (newSoon !== undefined) payload.dateSoon = newSoon;
      else delete payload.dateSoon;

      if (newRelease !== undefined) payload.dateRelease = newRelease;
      else delete payload.dateRelease;

      if (newEnd !== undefined) payload.dateEnd = newEnd;
      else delete payload.dateEnd;

      console.log("Payload gửi đi:", JSON.stringify(payload, null, 2))
      // Nếu người dùng xóa ngày (rỗng), gửi null
      // if (formData.dateSoon === "") payload.dateSoon = null
      // if (formData.dateEnd === "") payload.dateEnd = null
      await editMovie(movie.id, payload)
      toast.success("Cập nhật phim thành công!")
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err?.message || "Cập nhật thất bại")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa phim: {movie.title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Các field cũ giữ nguyên... */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tên phim</Label>
              <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
            </div>
            <div>
              <Label>Thể loại</Label>
              <Input value={formData.genre} onChange={e => setFormData({ ...formData, genre: e.target.value })} required />
            </div>
          </div>

          {/* Thời lượng, ngôn ngữ, quốc gia */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Thời lượng (phút)</Label>
              <Input type="number" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} required />
            </div>
            <div>
              <Label>Ngôn ngữ</Label>
              <Input value={formData.language} onChange={e => setFormData({ ...formData, language: e.target.value })} required />
            </div>
            <div>
              <Label>Quốc gia</Label>
              <Input value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} required />
            </div>
          </div>

          {/* Đạo diễn */}
          <div>
            <Label>Đạo diễn</Label>
            <Popover open={directorOpen} onOpenChange={setDirectorOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between">
                  {selectedDirector ? selectedDirector.name : "Chọn đạo diễn..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Tìm đạo diễn..." value={directorSearch} onValueChange={setDirectorSearch} />
                  <CommandEmpty>
                    <div className="py-6 text-center text-sm">
                      Không tìm thấy. Nhập tên để tạo mới.
                    </div>
                  </CommandEmpty>
                  <CommandGroup>
                    {directors.map(d => (
                      <CommandItem key={d.id} onSelect={() => {
                        setSelectedDirector(d)
                        setDirectorOpen(false)
                      }}>
                        <Check className={`mr-2 h-4 w-4 ${selectedDirector?.id === d.id ? "opacity-100" : "opacity-0"}`} />
                        {d.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Diễn viên */}
          <div>
            <Label>Diễn viên</Label>
            <Popover open={actorOpen} onOpenChange={setActorOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {selectedActors.length > 0
                    ? `${selectedActors.length} diễn viên được chọn`
                    : "Chọn diễn viên..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Tìm diễn viên..." value={actorSearch} onValueChange={setActorSearch} />
                  <CommandEmpty>Không tìm thấy</CommandEmpty>
                  <CommandGroup className="max-h-60 overflow-auto">
                    {actors.map(actor => {
                      const isSelected = selectedActors.some(a => a.id === actor.id || a.name === actor.name)
                      return (
                        <CommandItem
                          key={actor.id || actor.name}
                          onSelect={() => {
                            if (isSelected) {
                              setSelectedActors(prev => prev.filter(a => a.id !== actor.id && a.name !== actor.name))
                            } else {
                              setSelectedActors(prev => [...prev, actor])
                            }
                          }}
                        >
                          <Check className={`mr-2 h-4 w-4 ${isSelected ? "opacity-100" : "opacity-0"}`} />
                          {actor.name}
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedActors.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedActors.map(actor => (
                  <Badge key={actor.id || actor.name} variant="secondary">
                    {actor.name}
                    <button
                      type="button"
                      className="ml-1 text-xs"
                      onClick={() => setSelectedActors(prev => prev.filter(a => a.id !== actor.id && a.name !== actor.name))}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Các field còn lại (tuổi, trạng thái, ngày chiếu...) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Phân loại độ tuổi</Label>
              <Select value={formData.ageRestriction} onValueChange={v => setFormData({ ...formData, ageRestriction: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ageOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Trạng thái chiếu</Label>
              <Select value={formData.statusMovie} onValueChange={v => setFormData({ ...formData, statusMovie: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map(opt => (
                    <SelectItem key={opt} value={opt}>
                      {opt === "COMING_SOON" ? "Sắp chiếu" : opt === "NOW_SHOWING" ? "Đang chiếu" : "Đã kết thúc"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div><Label>Ngày chiếu sớm</Label><Input type="date" value={formData.dateSoon} onChange={e => setFormData({ ...formData, dateSoon: e.target.value })} /></div>
            <div><Label>Ngày khởi chiếu</Label><Input type="date" value={formData.dateRelease} onChange={e => setFormData({ ...formData, dateRelease: e.target.value })} required /></div>
            <div><Label>Ngày kết thúc</Label><Input type="date" value={formData.dateEnd} onChange={e => setFormData({ ...formData, dateEnd: e.target.value })} /></div>
          </div>

          <div>
            <Label>Mô tả phim</Label>
            <Textarea rows={4} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Hủy
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}