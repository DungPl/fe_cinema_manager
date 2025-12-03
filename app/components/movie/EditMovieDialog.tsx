// ~/components/movie/EditMovieDialog.tsx
import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { toast } from "react-hot-toast"
import { editMovie } from "~/lib/api/movieApi"

interface Props {
  movie: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const ageOptions = ["P", "K", "T13", "T16", "T18"] as const
const statusOptions = ["COMING_SOON", "NOW_SHOWING", "ENDED"] as const

export default function EditMovieDialog({ movie, open, onOpenChange, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    title: movie.title || "",
    genre: movie.genre || "",
    duration: movie.duration || "",
    language: movie.language || "",
    description: movie.description || "",
    country: movie.country || "",
    ageRestriction: movie.ageRestriction || "P",
    statusMovie: movie.statusMovie || "COMING_SOON",
    dateRelease: movie.dateRelease ? movie.dateRelease.split("T")[0] : "",
    dateSoon: movie.dateSoon ? movie.dateSoon.split("T")[0] : "",
    dateEnd: movie.dateEnd ? movie.dateEnd.split("T")[0] : "",
  })

  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload: any = { ...formData }

      // Chỉ gửi các field có thay đổi
      Object.keys(payload).forEach(key => {
        if (payload[key] === "" || payload[key] === movie[key]) {
          delete payload[key]
        }
      })

      // Xử lý ngày
      if (payload.dateRelease) payload.dateRelease = payload.dateRelease
      if (payload.dateSoon) payload.dateSoon = payload.dateSoon
      if (payload.dateEnd) payload.dateEnd = payload.dateEnd

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa phim: {movie.title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tên phim</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Thể loại</Label>
              <Input
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Thời lượng (phút)</Label>
              <Input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Ngôn ngữ</Label>
              <Input
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Quốc gia</Label>
              <Input
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Phân loại độ tuổi</Label>
              <Select
                value={formData.ageRestriction}
                onValueChange={(v) => setFormData({ ...formData, ageRestriction: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ageOptions.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Trạng thái chiếu</Label>
              <Select
                value={formData.statusMovie}
                onValueChange={(v) => setFormData({ ...formData, statusMovie: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(opt => (
                    <SelectItem key={opt} value={opt}>
                      {opt === "COMING_SOON" ? "Sắp chiếu" :
                       opt === "NOW_SHOWING" ? "Đang chiếu" : "Đã kết thúc"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Ngày chiếu sớm</Label>
              <Input
                type="date"
                value={formData.dateSoon}
                onChange={(e) => setFormData({ ...formData, dateSoon: e.target.value })}
              />
            </div>
            <div>
              <Label>Ngày khởi chiếu</Label>
              <Input
                type="date"
                value={formData.dateRelease}
                onChange={(e) => setFormData({ ...formData, dateRelease: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Ngày kết thúc</Label>
              <Input
                type="date"
                value={formData.dateEnd}
                onChange={(e) => setFormData({ ...formData, dateEnd: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Mô tả phim</Label>
            <Textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
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