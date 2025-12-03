// src/components/movie/dialog.tsx
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";

import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { toast } from "sonner";
import type { Movie } from "~/lib/api/types";

interface MovieDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (data: FormData) => Promise<void>;
    movie?: Movie | null;
}

const AGE_OPTIONS = ["P", "K", "T13", "T16", "T18"] as const;
const STATUS_OPTIONS = ["NOW_SHOWING", "COMING_SOON", "ENDED"] as const;

export function MovieDialog({ open, onOpenChange, onSave, movie }: MovieDialogProps) {
    const [formData, setFormData] = useState<FormData>(new FormData());
    const [posters, setPosters] = useState<File[]>([]);
    const [trailers, setTrailers] = useState<File[]>([]);

    useEffect(() => {
        if (!open) {
            setPosters([]);
            setTrailers([]);
            return;
        }
        const fd = new FormData();
        if (movie) {
            fd.append("title", movie.title);
            fd.append("genre", movie.genre);
            fd.append("duration", movie.duration.toString());
            fd.append("language", movie.language);
            fd.append("description", movie.description || "");
            fd.append("country", movie.country);
            fd.append("ageRestriction", movie.ageRestriction);
            fd.append("dateRelease", movie.dateRelease || "");
            if (movie.dateSoon) fd.append("dateSoon", movie.dateSoon);
            if (movie.dateEnd) fd.append("dateEnd", movie.dateEnd);
            fd.append("statusMovie", movie.statusMovie);
            fd.append("directorId", movie.directorId.toString());
            movie.actors.forEach((a) => fd.append("actorIds[]", a.id.toString()));
            // formats, etc...
        }
        setFormData(fd);
    }, [movie, open]);

    const handleSubmit = async () => {
        const title = formData.get("title")?.toString().trim() || "";
        if (title === "") {
            toast.error("Vui lòng nhập tiêu đề phim");
            return;
        }

        // Append new files
        posters.forEach((f) => formData.append("posters", f));
        trailers.forEach((f) => formData.append("trailers", f));

        await onSave(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {movie ? "Sửa phim" : "Thêm phim mới"}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Các field cơ bản */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">
                            Tiêu đề <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="title"
                            className="col-span-3"
                            defaultValue={movie?.title}
                            onChange={(e) => formData.set("title", e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="genre" className="text-right">Thể loại</Label>
                        <Input
                            id="genre"
                            className="col-span-3"
                            defaultValue={movie?.genre}
                            onChange={(e) => formData.set("genre", e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="duration" className="text-right">Thời lượng (phút)</Label>
                        <Input
                            id="duration"
                            type="number"
                            className="col-span-3"
                            defaultValue={movie?.duration}
                            onChange={(e) => formData.set("duration", e.target.value)}
                        />
                    </div>

                    {/* Các field khác tương tự... */}

                    {/* Posters */}
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right pt-2">Poster</Label>
                        <div className="col-span-3">
                            <Input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files) setPosters(Array.from(e.target.files));
                                }}
                            />
                            <div className="flex flex-wrap gap-3 mt-3">
                                {movie?.posters.map((p) => (
                                    <img key={p.id} src={p.url} className="w-24 h-32 object-cover rounded" />
                                ))}
                                {posters.map((f, i) => (
                                    <div key={i} className="relative">
                                        <img src={URL.createObjectURL(f)} className="w-24 h-32 object-cover rounded" />
                                        <button
                                            onClick={() => setPosters((prev) => prev.filter((_, idx) => idx !== i))}
                                            className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-1"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Trailers – tương tự */}
                </div>

                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>
                    <Button onClick={handleSubmit}>Lưu</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}