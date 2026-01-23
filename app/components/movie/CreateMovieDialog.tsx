// ~/components/movie/create-dialog.tsx
import { useState, useEffect, useRef } from "react"
import { Button } from "~/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Badge } from "~/components/ui/badge"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { toast } from "sonner"
import { DirectorCombobox } from "./DirectorCombobox"
import { ActorMultiCombobox } from "./ActorComboBox"
import type { Director, Actor } from "~/lib/api/types"

// Giả sử bạn có API getFormats và type Format
import { getFormats } from "~/lib/api/roomApi"
import type { Format } from "~/lib/api/types" // Thêm type Format nếu chưa có
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "~/components/ui/command"

interface CreateMovieDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (data: FormData) => Promise<void>
    onSuccess?: () => void
}

const AGE_OPTIONS = ["P", "K", "T13", "T16", "T18"] as const
const GENRE_OPTIONS = [
  "Action",
  "Comedy",
  "Family",
  "Drama",
  "Mystery",
  "Fantasy",
  "Horror",
  "Romance",
  "Sci-Fi",
  "Animation",
  "Adventure",
  "Thriller",
] as const

type Genre = typeof GENRE_OPTIONS[number] | string // Cho phép thêm genre tùy chỉnh

function GenreMultiSelect({
  value,
  onChange,
}: {
  value: Genre[]
  onChange: (genres: Genre[]) => void
}) {
  const [open, setOpen] = useState(false)

  const toggleGenre = (genre: Genre) => {
    if (value.includes(genre)) {
      onChange(value.filter(g => g !== genre))
    } else {
      onChange([...value, genre])
    }
  }

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            {value.length > 0
              ? `${value.length} thể loại được chọn`
              : "Chọn thể loại"}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0">
          <Command>
            <CommandGroup>
              {GENRE_OPTIONS.map(genre => {
                const selected = value.includes(genre)
                return (
                  <CommandItem
                    key={genre}
                    onSelect={() => toggleGenre(genre)}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        selected ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    {genre}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {value.map(g => (
            <Badge key={g} variant="secondary">
              {g}
              <button
                type="button"
                className="ml-2"
                onClick={() => onChange(value.filter(x => x !== g))}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

// Component mới cho multi-select Formats (tương tự ActorMultiCombobox)
function FormatMultiCombobox({ value, onChange }: { value: Format[]; onChange: (formats: Format[]) => void }) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")
    const [formats, setFormats] = useState<Format[]>([])

    useEffect(() => {
        if (!open) return
        const fetch = async () => {
            const res = await getFormats({ search: search || undefined, limit: 50 })
            setFormats(res || []) // Giả sử API trả về tương tự
        }
        fetch()
    }, [search, open])

    const toggleFormat = (format: Format) => {
        const exists = value.some(f => f.id === format.id)
        if (exists) {
            onChange(value.filter(f => f.id !== format.id))
        } else {
            onChange([...value, format])
        }
    }

    return (
        <div>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                        {value.length > 0 ? `${value.length} định dạng được chọn` : "Chọn định dạng..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                    <Command>
                        <CommandInput placeholder="Tìm định dạng..." value={search} onValueChange={setSearch} />
                        <CommandEmpty>Không tìm thấy</CommandEmpty>
                        <CommandGroup className="max-h-60 overflow-auto">
                            {formats.map((format) => {
                                const isSelected = value.some(f => f.id === format.id)
                                return (
                                    <CommandItem key={format.id} onSelect={() => toggleFormat(format)}>
                                        <Check className={`mr-2 h-4 w-4 ${isSelected ? "opacity-100" : "opacity-0"}`} />
                                        {format.name} {/* Giả sử Format có field name */}
                                    </CommandItem>
                                )
                            })}
                        </CommandGroup>
                    </Command>
                </PopoverContent>
            </Popover>

            {value.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {value.map((format) => (
                        <Badge key={format.id} variant="secondary">
                            {format.name}
                            <button
                                type="button"
                                className="ml-2"
                                onClick={() => onChange(value.filter(f => f.id !== format.id))}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    )
}

export function CreateMovieDialog({ open, onOpenChange, onSave, onSuccess }: CreateMovieDialogProps) {
    const formDataRef = useRef<FormData>(new FormData())
    const [selectedDirector, setSelectedDirector] = useState<Director | null>(null)
    const [selectedActors, setSelectedActors] = useState<Actor[]>([])
    const [selectedFormats, setSelectedFormats] = useState<Format[]>([]) // Mới: cho formats
    const [genres, setGenres] = useState<Genre[]>([]) // Thêm state cho genres
    const [newGenre, setNewGenre] = useState("") // Để thêm genre mới

    useEffect(() => {
        if (!open) {
            formDataRef.current = new FormData()  // Reset FormData
            setSelectedDirector(null)
            setSelectedActors([])
            setSelectedFormats([])
            setGenres([]) // Reset genres
            setNewGenre("")
        }
    }, [open])

    const addGenre = () => {
        const trimmed = newGenre.trim()
        if (trimmed && !genres.includes(trimmed)) {
            setGenres([...genres, trimmed])
            setNewGenre("")
        }
    }

    const handleSubmit = async () => {
        const fd = formDataRef.current
        console.log("FormData content:")
        for (const [key, value] of fd.entries()) {
            console.log(key, value)
        }
        if (!fd.get("title")) return toast.error("Vui lòng nhập tiêu đề")
        if (genres.length === 0) return toast.error("Vui lòng thêm ít nhất 1 thể loại")
        if (!selectedDirector) return toast.error("Vui lòng chọn đạo diễn")
        if (selectedActors.length === 0) return toast.error("Vui lòng chọn ít nhất 1 diễn viên")
        if (selectedFormats.length === 0) return toast.error("Vui lòng chọn định dạng")

        // Gắn dữ liệu còn thiếu
        fd.set("genre", genres.join(", "))
        if (selectedDirector?.id) {
            fd.set("directorId", selectedDirector.id.toString())
        }
        selectedActors.forEach(a => {
            if (a.id) fd.append("actorIds", a.id.toString())
            else fd.append("actorNames", a.name)
        })
        selectedFormats.forEach(f => fd.append("formatIds", f.id.toString()))

        await onSave(fd)
        toast.success("Thêm phim thành công!")
        onSuccess?.()
        onOpenChange(false)
    }


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Thêm phim mới</DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Tiêu đề */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Tiêu đề <span className="text-red-500">*</span></Label>
                            <Input onChange={e => formDataRef.current.set("title", e.target.value)} />
                        </div>

                        {/* Thể loại */}
                        <div>
                            <Label>Thể loại <span className="text-red-500">*</span></Label>
                            <GenreMultiSelect value={genres} onChange={setGenres} />
                            {/* <div className="flex gap-2 mt-2">
                                <Input
                                    value={newGenre}
                                    onChange={e => setNewGenre(e.target.value)}
                                    placeholder="Nhập thể loại mới"
                                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addGenre())}
                                />
                                <Button type="button" onClick={addGenre}>Thêm</Button>
                            </div> */}
                            {/* {genres.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {genres.map(g => (
                                        <Badge key={g} variant="secondary">
                                            {g}
                                            <button type="button" className="ml-2" onClick={() => setGenres(genres.filter(x => x !== g))}>
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )} */}
                        </div>
                    </div>

                    {/* Thời lượng, ngôn ngữ, quốc gia */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label>Thời lượng (phút) <span className="text-red-500">*</span></Label>
                            <Input type="number" onChange={e => formDataRef.current.set("duration", e.target.value)} />
                        </div>
                        <div>
                            <Label>Ngôn ngữ <span className="text-red-500">*</span></Label>
                            <Input onChange={e => formDataRef.current.set("language", e.target.value)} />
                        </div>
                        <div>
                            <Label>Quốc gia <span className="text-red-500">*</span></Label>
                            <Input onChange={e => formDataRef.current.set("country", e.target.value)} />
                        </div>
                    </div>

                    {/* Đạo diễn */}
                    <div>
                        <Label>Đạo diễn <span className="text-red-500">*</span></Label>
                        <DirectorCombobox value={selectedDirector} onChange={setSelectedDirector} />
                    </div>

                    {/* Diễn viên */}
                    <div>
                        <Label>Diễn viên <span className="text-red-500">*</span></Label>
                        <ActorMultiCombobox value={selectedActors} onChange={setSelectedActors} />
                    </div>

                    {/* Định dạng chiếu */}
                    <div>
                        <Label>Định dạng chiếu <span className="text-red-500">*</span></Label>
                        <FormatMultiCombobox value={selectedFormats} onChange={setSelectedFormats} />
                    </div>

                    {/* Tuổi, ngày chiếu */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label>Giới hạn tuổi <span className="text-red-500">*</span></Label>
                            <Select onValueChange={v => formDataRef.current.set("ageRestriction", v)}>
                                <SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger>
                                <SelectContent>
                                    {AGE_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Ngày chiếu sớm</Label>
                            <Input type="date" onChange={e => {
                                const val = e.target.value
                                if (val) {
                                    const iso = new Date(val).toISOString()
                                    formDataRef.current.set("dateSoon", iso)
                                } else {
                                    formDataRef.current.delete("dateSoon")
                                }
                            }} />
                        </div>
                        <div>
                            <Label>Ngày khởi chiếu <span className="text-red-500">*</span></Label>
                            <Input type="date" onChange={e => {
                                const val = e.target.value
                                if (val) {
                                    const iso = new Date(val).toISOString()
                                    formDataRef.current.set("dateRelease", iso)
                                } else {
                                    formDataRef.current.delete("dateRelease")
                                }
                            }} />
                        </div>
                    </div>

                    <div>
                        <Label>Ngày kết thúc</Label>
                        <Input type="date" onChange={e => {
                            const val = e.target.value
                            if (val) {
                                const iso = new Date(val).toISOString()
                                formDataRef.current.set("dateEnd", iso)
                            } else {
                                formDataRef.current.delete("dateEnd")
                            }
                        }} />
                    </div>

                    <div>
                        <Label>Mô tả <span className="text-red-500">*</span></Label>
                        <Textarea rows={4} onChange={e => formDataRef.current.set("description", e.target.value)} />
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
                    <Button onClick={handleSubmit}>Thêm phim</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}