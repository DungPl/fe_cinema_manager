import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Badge } from "~/components/ui/badge"
import { Loader2 } from "lucide-react"
import { useState } from "react"

interface TrailerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  trailerUrl?: string
  genre?: string
  posterUrl?: string // Thêm poster
}

export function TrailerDialog({
  open,
  onOpenChange,
  title,
  trailerUrl,
  genre,
  posterUrl,
}: TrailerDialogProps) {
  const [videoReady, setVideoReady] = useState(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* VIDEO */}
        <div className="aspect-video w-full bg-black relative">
          {trailerUrl ? (
            <>
              {!videoReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
                  <Loader2 className="h-12 w-12 text-white animate-spin" />
                </div>
              )}

              <video
                controls
                autoPlay
                muted
                preload="metadata"
                playsInline
                poster={posterUrl || "/placeholder-poster.jpg"}
                className="w-full h-full"
                onLoadedData={() => setVideoReady(true)}
                onEnded={(e) => (e.currentTarget.currentTime = 0)}
              >
                <source src={trailerUrl} type="video/mp4" />
              </video>
            </>
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