// ~/components/showtime/EditShowtimeDialog.tsx
// Copy và adjust từ CreateShowtimeDialog

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { addMinutes, addDays } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import { cn } from "~/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Input } from "~/components/ui/input"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "~/components/ui/command"
import { Check, ChevronsUpDown, CalendarIcon, X, Plus } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { useState, useEffect } from "react"

// Giả sử API fetch movies, cinemas, rooms, và update showtime
import { getMovieById, getMovies } from "~/lib/api/movieApi"
import { getCinemas } from "~/lib/api/cinemaApi"
import { getRoomsByCinemaId } from "~/lib/api/roomApi"
import { updateShowtime } from "~/lib/api/showtimeApi"  // Giả sử có API update single showtime
import { getShowtimeByCinemaAndDate } from "~/lib/api/showtimeApi"  // Thêm API để fetch existing showtimes
import type { Movie, Cinema, Room, ShowtimeResponse } from "~/lib/api/types"
import { Calendar } from "../ui/calendar"
import { Separator } from "~/components/ui/separator" // Sửa import

// Giả sử các helper functions (định nghĩa ở file utils hoặc tương tự)
const formatDate = (date: Date, fmt: string) => format(date, fmt);  // Wrapper đơn giản
const parseTimeOnDate = (date: Date, timeStr: string) => {
    const [hh, mm] = timeStr.split(":").map(Number);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hh, mm, 0);
};
const toLocalDate = (dateStr: string) => new Date(dateStr);  // Giả sử convert timezone nếu cần
const isOverlap = (start1: Date, end1: Date, start2: Date, end2: Date) => {
    return start1 < end2 && start2 < end1;
};

type EditShowtimeDialogProps = {
    open?: boolean
    selectedDate?: Date // có thể undefined
    refreshShowtimes: () => Promise<void>
    onClose: () => void
    editingShowtime: ShowtimeResponse
    onOpenChange: (open: boolean) => void // Bắt buộc cho edit
}

// Schema validation - Adjust cho single edit
const formSchema = z.object({
    movieId: z.string().min(1, "Chọn phim"),
    province: z.string().min(1, "Chọn khu vực"),
    cinemaId: z.string().min(1, "Chọn rạp"),
    roomId: z.string().min(1, "Chọn phòng"),  // Single room thay array
    format: z.enum(["2D", "3D", "IMAX", "4DX"]),  // Single format

    startDate: z.date(),

    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Giờ không hợp lệ"),  // Single time slot

    price: z.number().min(10000, "Giá vé tối thiểu 10.000 đ"),
})
    .refine((data) => data.startDate, {
        message: "Chọn ngày chiếu",
        path: ["startDate"],
    });

export function EditShowtimeDialog({ selectedDate, refreshShowtimes, editingShowtime, open, onClose }: EditShowtimeDialogProps) {
    // States - Tương tự nhưng preload từ editingShowtime
    const [movies, setMovies] = useState<Movie[]>([])
    const [cinemas, setCinemas] = useState<Cinema[]>([])
    const [rooms, setRooms] = useState<Room[]>([])
    const [selectedProvince, setSelectedProvince] = useState(
        editingShowtime.room.cinema.address?.[0]?.province || ""
    );
    const [selectedCinema, setSelectedCinema] = useState<number | null>(editingShowtime.room.cinema.id || null)
    const [selectedRoom, setSelectedRoom] = useState<string>(editingShowtime.room.id.toString() || "")
    const [selectedFormat, setSelectedFormat] = useState<string>(editingShowtime.room.formats?.[0]?.name || "2D")
    const [previewShowtimes, setPreviewShowtimes] = useState<any[]>([]) // Chỉ 1 cho single
    const [skippedPreviews, setSkippedPreviews] = useState<any[]>([]) // Để hiển thị conflict
    const [existingShowtimes, setExistingShowtimes] = useState<any[]>([]) // Existing cho ngày
    const [movieDuration, setMovieDuration] = useState<number>(editingShowtime.movie.duration || 120)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(editingShowtime.movie || null)
    const [isFetchingMovie, setIsFetchingMovie] = useState(false);

    // Tạo timeOptions
    const timeOptions: string[] = [];
    for (let h = 8; h <= 23; h++) {
        for (let m of [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]) {
            if (h === 24 && m > 30) continue;
            const hh = h.toString().padStart(2, "0");
            const mm = m.toString().padStart(2, "0");
            timeOptions.push(`${hh}:${mm}`);
        }
    }

    // Fetch data - Tương tự, nhưng preload
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [moviesRes, cinemasRes] = await Promise.all([
                    getMovies({ showingStatus: "NOW_SHOWING" }),
                    getCinemas({ limit: 500 })
                ])


                setMovies(moviesRes.rows)
                setCinemas(cinemasRes.rows)

            } catch (err) {
                console.error("Lỗi fetch data:", err)
            }
        }
        fetchData()

    }, [])

    // Fetch rooms khi chọn cinema
    useEffect(() => {
        if (selectedCinema) {
            const fetchRooms = async () => {
                try {
                    const roomsRes = await getRoomsByCinemaId(selectedCinema)
                    setRooms(roomsRes)
                } catch (err) {
                    console.error("Lỗi fetch rooms:", err)
                }
            }
            fetchRooms()
        } else {
            setRooms([])
        }
    }, [selectedCinema])


    // Form - Preload values từ editingShowtime
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            movieId: editingShowtime.movie.id.toString() || "",
            province: editingShowtime.room.cinema.address?.[0]?.province || "",
            cinemaId: editingShowtime.room.cinema.id?.toString() || "",
            roomId: editingShowtime.room.id.toString() || "",
            format: editingShowtime.room.formats?.[0]?.name as "2D" | "3D" | "IMAX" | "4DX" || "2D",
            startDate: new Date(editingShowtime.start_time) || selectedDate || new Date(),
            startTime: format(new Date(editingShowtime.start_time), "HH:mm") || "",
            price: editingShowtime.price || 80000,
        },
    })

    const fetchMovieDetails = async (movieId: string) => {
        if (!movieId) return;
        setIsFetchingMovie(true);
        try {
            const movieIdNum = Number(movieId);
            if (isNaN(movieIdNum)) {
                console.error("Invalid movieId:", movieId);
                return;
            }
            const movie = await getMovieById(movieIdNum);
            //console.log("Fetched movie:", movie); // Debug
            setSelectedMovie(movie);
            setMovieDuration(movie?.duration || 120);
        } catch (err) {
            console.error("Lỗi fetch movie:", err);
            setSelectedMovie(null);
        } finally {
            setIsFetchingMovie(false);
        }
    };
    const { watch } = form
    // Thêm vào useEffect cho watch để generate previews với logic backend-like - Nhưng cho single, đơn giản hơn
    useEffect(() => {
        const subscription = watch(async (value) => {
            if (value.movieId && value.roomId && value.format && value.startTime && value.startDate && movieDuration > 0) {
                try {
                    // --- FETCH EXISTING for the single date ---
                    const dateStr = formatDate(value.startDate, "yyyy-MM-dd");
                    const showtimes = await getShowtimeByCinemaAndDate(Number(value.cinemaId), dateStr) as any[];
                    const allExisting = Array.isArray(showtimes) ? showtimes : [];
                    setExistingShowtimes(allExisting);

                    // --- PREPARE ---
                    const previewDate = new Date(value.startDate);
                    const dateKey = formatDate(previewDate, "yyyy-MM-dd");

                    const previews: any[] = [];
                    const skippedPreviews: any[] = [];

                    const formatConfigs: { [key: string]: { offsetMinutes: number; maxPerDay: number; maxRooms: number } } = {
                        "2D": { offsetMinutes: 10, maxPerDay: 8, maxRooms: Infinity },
                        "3D": { offsetMinutes: 10, maxPerDay: 6, maxRooms: Infinity },
                        "IMAX": { offsetMinutes: 10, maxPerDay: 4, maxRooms: 2 },
                        "4DX": { offsetMinutes: 10, maxPerDay: 4, maxRooms: 2 },
                    };

                    const minGapBetweenRooms = 10 * 60 * 1000;
                    const breakStartHour = 11;
                    const breakEndHour = 14;
                    const DEBUG = true;
                    // build map of existing by room for this date
                    const existingByRoom = new Map<number, any[]>();
                    for (const s of allExisting) {
                        const sDate = s.start.split('T')[0];
                        if (sDate !== dateKey) continue;
                        const rid = Number(s.roomId);
                        if (!existingByRoom.has(rid)) existingByRoom.set(rid, []);
                        existingByRoom.get(rid)!.push(s);
                    }

                    const dailyCreatedByFormat = { [value.format]: 0 } as Record<string, number>;

                    const roomIdNum = Number(value.roomId);
                    const room = rooms.find(r => r.id === roomIdNum);
                    if (!room) return;

                    const format = value.format;
                    if (!format || !room.formats?.some((f: any) => f.name === format)) return;

                    const config = formatConfigs[format];
                    if (!config) return;

                    // base startTime from slot on previewDate
                    let startTime = parseTimeOnDate(previewDate, value.startTime);

                    // lunch break shift (nếu áp dụng cho single, có thể bỏ nếu không cần)
                    if (startTime.getHours() >= breakStartHour && startTime.getHours() < breakEndHour) {
                        // Ví dụ: shift to after break
                        // startTime = new Date(previewDate.getFullYear(), previewDate.getMonth(), previewDate.getDate(), breakEndHour, 0, 0);
                    }

                    // Vì single room, idx = 0, không cần offset
                    // Nhưng nếu muốn apply lunch gap, có thể adjust

                    // normalize
                    startTime = new Date(previewDate.getFullYear(), previewDate.getMonth(), previewDate.getDate(), startTime.getHours(), startTime.getMinutes(), 0);

                    if (formatDate(startTime, "yyyy-MM-dd") !== dateKey) {
                        skippedPreviews.push({
                            date: formatDate(previewDate, "dd/MM/yyyy"),
                            room: room?.name || "",
                            format,
                            startTime: formatDate(startTime, "HH:mm"),
                            endTime: "N/A",
                            reason: "Vượt quá giờ chiếu cho phép",
                            conflicts: []
                        });
                        setPreviewShowtimes(previews);
                        setSkippedPreviews(skippedPreviews);
                        return;
                    }

                    const endTime = addMinutes(startTime, movieDuration);

                    // dynamic min gap in same room
                    const getMinGap = (prevEnd: Date) => {
                        const h = prevEnd.getHours();
                        return (h >= 11 && h < 14) ? 20 : 10;
                    };

                    // IMAX late limit (nếu áp dụng)
                    if (format === "IMAX" && startTime.getHours() >= 22) {
                        // Check existing + this one, nhưng vì single và edit, có thể count existing
                        const imaxLateExisting = allExisting.filter(s => s.format === "IMAX" && new Date(s.start).getHours() >= 22 && s.id !== editingShowtime.id).length;
                        if (imaxLateExisting >= 1) {
                            skippedPreviews.push({
                                date: formatDate(previewDate, "dd/MM/yyyy"),
                                room: room?.name || "",
                                format,
                                startTime: formatDate(startTime, "HH:mm"),
                                endTime: formatDate(endTime, "HH:mm"),
                                reason: "Vượt quá 1 suất IMAX sau 22:00",
                                conflicts: []
                            });
                            setPreviewShowtimes(previews);
                            setSkippedPreviews(skippedPreviews);
                            return;
                        }
                    }
                    function isInLunchRange(date: Date, breakStartHour: number, breakEndHour: number) {
                        const h = date.getHours();
                        return h >= breakStartHour && h < breakEndHour;
                    }
                    const startInLunch = isInLunchRange(startTime, breakStartHour, breakEndHour);
                    const endInLunch = isInLunchRange(endTime, breakStartHour, breakEndHour);

                    const min_gap_in_room_minutes =
                        startInLunch && endInLunch ? 20 : 10;
                    const min_gap_in_room_ms = min_gap_in_room_minutes * 60 * 1000;
                    // --- CHECK WITH EXISTING IN SAME ROOM (exclude self) ---
                    const roomExisting = existingByRoom.get(roomIdNum) ?? [];
                    let conflictingExisting: any[] = [];
                    for (const s of roomExisting) {
                        if (s.id === editingShowtime.id) continue;  // Exclude self
                        const sStart = toLocalDate(s.start);
                        const sEnd = toLocalDate(s.end);

                        //const minGapMs = getMinGap(sEnd) * 60 * 1000;
                        if (
                            isOverlap(startTime, endTime, sStart, sEnd) ||
                            (endTime <= sStart && (sStart.getTime() - endTime.getTime()) < min_gap_in_room_ms) ||
                            (sEnd <= startTime && (startTime.getTime() - sEnd.getTime()) < min_gap_in_room_ms)
                        ) {
                            conflictingExisting.push(s);
                        }
                    }

                    if (conflictingExisting.length > 0) {
                        if (DEBUG) console.log("Conflicting existing found:", conflictingExisting);
                        skippedPreviews.push({
                            date: formatDate(previewDate, "dd/MM/yyyy"),
                            room: room.name,
                            format,
                            startTime: formatDate(startTime, "HH:mm"),
                            endTime: formatDate(endTime, "HH:mm"),
                            reason: conflictingExisting.some((s: any) => isOverlap(startTime, endTime, toLocalDate(s.start), toLocalDate(s.end))) ? "Trùng lịch phòng (tồn tại)" : "Khoảng cách suất chiếu trong phòng quá gần (tồn tại)",
                            conflicts: conflictingExisting.map((c: any) => {
                                const title = c.Movie?.title || "Phim khác";
                                const start = formatDate(toLocalDate(c.start), "HH:mm");
                                const end = formatDate(toLocalDate(c.end), "HH:mm");
                                return `${title} (${start}-${end})`;
                            })
                        });
                        setPreviewShowtimes(previews);
                        setSkippedPreviews(skippedPreviews);
                        return;
                    }

                    // --- NEARBY checks (other rooms) using allExisting ---
                    const otherExisting = allExisting.filter(s => s.movieId === Number(value.movieId) && Number(s.roomId) !== roomIdNum && s.start.split('T')[0] === dateKey && s.id !== editingShowtime.id);
                    const nearbyConflictsExisting = otherExisting.filter((s: any) => {
                        const sStart = toLocalDate(s.start);
                        return Math.abs(startTime.getTime() - sStart.getTime()) < minGapBetweenRooms;
                    });
                    if (nearbyConflictsExisting.length > 0) {
                        skippedPreviews.push({
                            date: formatDate(previewDate, "dd/MM/yyyy"),
                            room: room?.name || "",
                            format,
                            startTime: formatDate(startTime, "HH:mm"),
                            endTime: formatDate(endTime, "HH:mm"),
                            reason: "Trùng lịch gần phòng khác (tồn tại)",
                            conflicts: nearbyConflictsExisting.map((c: any) => `${c.Room?.name || "Room " + c.roomId}: ${c.Movie?.title || "Unknown"} (${formatDate(new Date(c.start), "HH:mm")}-${formatDate(new Date(c.end), "HH:mm")})`)
                        });
                        setPreviewShowtimes(previews);
                        setSkippedPreviews(skippedPreviews);
                        return;
                    }

                    // OK push
                    previews.push({
                        date: formatDate(previewDate, "dd/MM/yyyy"),
                        room: room?.name || "",
                        roomId: roomIdNum,
                        format,
                        startTime: formatDate(startTime, "HH:mm"),
                        endTime: formatDate(endTime, "HH:mm"),
                    });

                    setPreviewShowtimes(previews);
                    setSkippedPreviews(skippedPreviews);
                } catch (err) {
                    console.error("Lỗi preview:", err);
                }
            } else {
                setPreviewShowtimes([]);
                setSkippedPreviews([]);
                setExistingShowtimes([]);
            }
        });
        return () => subscription.unsubscribe();
    }, [watch, rooms, movieDuration, editingShowtime.id]);

    // onSubmit - Update single
    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (skippedPreviews.length > 0) {
            toast.error("Có xung đột lịch chiếu. Vui lòng kiểm tra preview.");
            return;
        }

        setIsSubmitting(true)
        try {
            const payload = {
                movieId: Number(values.movieId),
                roomId: Number(values.roomId),
                start_time: `${format(values.startDate, "yyyy-MM-dd")}T${values.startTime}:00+07:00`,
                // Format cho backend
                price: values.price,
            }
            await updateShowtime(editingShowtime.id, payload)  // Giả sử API update
            toast.success("Sửa lịch chiếu thành công!")
            onClose()
            form.reset()
            refreshShowtimes()
        } catch (err: any) {
            const message =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                "Không thể sửa suất chiếu"

            toast.error(message)
        } finally {
            setIsSubmitting(false)
        }
    }
    useEffect(() => {
        const province = form.getValues("province")
        if (province) {
            setSelectedProvince(province)

        }
    }, [form])
    useEffect(() => {
        const defaultProvince = editingShowtime.room.cinema.address?.[0]?.province || "";
        if (defaultProvince && !form.getValues("province")) {
            form.setValue("province", defaultProvince);
            setSelectedProvince(defaultProvince);
        }
    }, [editingShowtime, form]);
    // Provinces unique từ cinemas
    const provinces: string[] = Array.from(
        new Set(
            cinemas
                .map(c => c.address?.[0]?.province)
                .filter((p): p is string => typeof p === "string")
        )
    )


    // Cinemas filtered by province
    const filteredCinemas = selectedProvince
        ? cinemas.filter(c => {
            const provinceInData = (c.address?.[0]?.province || '').trim().toLowerCase();
            const selected = selectedProvince.trim().toLowerCase();
            return provinceInData === selected;
        })
        : cinemas;
    useEffect(() => {
        console.log("selectedProvince:", selectedProvince);
        console.log("filteredCinemas:", filteredCinemas.length, filteredCinemas.map(c => c.name));
    }, [selectedProvince, cinemas]);
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Sửa Lịch Chiếu</DialogTitle>
                </DialogHeader>

                {/* FORM */}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        {/* --- PHẦN 1: CHỌN PHIM / ĐỊA ĐIỂM --- */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            {/* PHIM */}
                            <FormField
                                control={form.control}
                                name="movieId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phim</FormLabel>
                                        <Select
                                            onValueChange={(val) => {
                                                field.onChange(val);
                                                fetchMovieDetails(val); // Fetch ngay khi chọn
                                            }}
                                            value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn phim" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {movies.map(m => (
                                                    <SelectItem key={m.id} value={m.id.toString()}>
                                                        {m.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {isFetchingMovie && (
                                <div className="col-span-2">Đang tải thông tin phim...</div>
                            )}
                            {selectedMovie && !isFetchingMovie && (
                                <div className="col-span-2 p-4 border rounded-lg bg-background shadow-sm mt-4">
                                    <h4 className="font-semibold mb-2">Thông tin phim đã chọn: {selectedMovie?.title || 'Không xác định'}</h4>
                                    <div className="flex gap-4">
                                        {selectedMovie.posters && selectedMovie.posters.length > 0 && selectedMovie.posters[0]?.url && (
                                            <img
                                                src={selectedMovie.posters[0].url}
                                                alt={`Poster ${selectedMovie.title || ''}`}
                                                className="w-32 h-48 object-cover rounded-md shadow-md"
                                                onError={(e) => {
                                                    console.error("Error loading poster:", selectedMovie.posters[0].url);
                                                    e.currentTarget.style.display = 'none'; // Ẩn nếu lỗi load
                                                }}
                                            />
                                        )}
                                        <div>
                                            <p><strong>Thời lượng:</strong> {selectedMovie.duration ? `${selectedMovie.duration} phút` : 'Không xác định'}</p>
                                            {/* Thêm info khác nếu cần, ví dụ: genre, description */}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* KHU VỰC */}
                            <FormField
                                control={form.control}
                                name="province"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Khu vực</FormLabel>

                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className="w-full justify-between"
                                                    >
                                                        {field.value || "Chọn khu vực"}
                                                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>

                                            <PopoverContent className="w-full p-0">
                                                <Command>
                                                    <CommandInput placeholder="Tìm khu vực..." />

                                                    <CommandList className="max-h-60 overflow-y-auto">
                                                        <CommandEmpty>Không tìm thấy khu vực</CommandEmpty>

                                                        <CommandGroup>
                                                            {provinces.map((prov) => (
                                                                <CommandItem
                                                                    key={prov}
                                                                    value={prov}
                                                                    onSelect={() => {
                                                                        field.onChange(prov);
                                                                        setSelectedProvince(prov);
                                                                        setSelectedCinema(null);
                                                                        setRooms([]);
                                                                        form.setValue("cinemaId", "");
                                                                        form.setValue("roomId", "");
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            prov === field.value ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {prov}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />


                            {/* RẠP */}
                            <FormField
                                control={form.control}
                                name="cinemaId"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Rạp</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className="w-full justify-between"
                                                    >
                                                        {field.value
                                                            ? filteredCinemas.find(c => c.id === Number(field.value))?.name
                                                            : "Chọn rạp"}
                                                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-full p-0">
                                                <Command>
                                                    <CommandInput placeholder="Tìm tên rạp..." />
                                                    <CommandList className="max-h-60 overflow-y-auto">
                                                        <CommandEmpty>Không tìm thấy rạp</CommandEmpty>
                                                        <CommandGroup>
                                                            {filteredCinemas.map((c) => (
                                                                <CommandItem
                                                                    key={c.id}
                                                                    value={c.name}
                                                                    onSelect={() => {
                                                                        field.onChange(c.id!.toString())
                                                                        setSelectedCinema(c.id!)
                                                                        // form.setValue("roomIds", "")
                                                                    }}
                                                                >
                                                                    {c.name}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {/* SINGLE SELECT PHÒNG */}
                            <FormField
                                control={form.control}
                                name="roomId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phòng</FormLabel>
                                        <Select
                                            onValueChange={(val) => {
                                                field.onChange(val)
                                                setSelectedRoom(val)
                                            }}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn phòng" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {rooms.map(room => (
                                                    <SelectItem key={room.id} value={room.id.toString()}>
                                                        {room.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* SINGLE FORMAT SELECT */}
                            <FormField
                                control={form.control}
                                name="format"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Format</FormLabel>
                                        <Select
                                            onValueChange={(val) => {
                                                field.onChange(val)
                                                setSelectedFormat(val)
                                            }}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn format" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {["2D", "3D", "IMAX", "4DX"].map(fmt => (
                                                    <SelectItem key={fmt} value={fmt}>
                                                        {fmt}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                        </div>

                        {/* NGÀY BẮT ĐẦU - KẾT THÚC */}
                        <Separator />

                        {/* PHẦN 2: NGÀY & GIỜ */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Ngày và giờ chiếu</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* START DATE */}
                                <FormField
                                    control={form.control}
                                    name="startDate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Ngày chiếu</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                "w-full pl-3 text-left font-normal rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? format(new Date(field.value), "dd/MM/yyyy") : (
                                                                <span>Chọn ngày</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 rounded-xl shadow-xl border border-border bg-background" align="start">
                                                    <Calendar
                                                        // Remove locale để giống hình (English)
                                                        captionLayout="dropdown" // Giữ để dễ chọn
                                                        mode="single"
                                                        selected={field.value ? new Date(field.value) : undefined}
                                                        onSelect={(date) => {
                                                            field.onChange(date);
                                                        }}
                                                        disabled={(date) => date < new Date("1900-01-01")}
                                                        showOutsideDays={true}
                                                        modifiers={{
                                                            today: new Date() // Dynamic today (Dec 07, 2025)
                                                        }}
                                                        modifiersStyles={{
                                                            today: { backgroundColor: "#000", color: "#fff", borderRadius: "0.5rem" },
                                                            outside: { color: "#a0a0a0" } // Mờ ngày ngoài tháng
                                                        }}
                                                        className="rounded-xl p-3"
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* START TIME - Thay bằng Select với timeOptions */}
                                <FormField
                                    control={form.control}
                                    name="startTime"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Giờ bắt đầu</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Chọn giờ" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="max-h-60 overflow-y-auto">
                                                    {timeOptions.map((time) => (
                                                        <SelectItem key={time} value={time}>
                                                            {time}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <Separator />


                        {/* GIÁ */}
                        <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Giá vé</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            {...field}
                                            onChange={(e) => field.onChange(+e.target.value)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />


                        {/* PREVIEW - Chỉ 1 dòng cho single */}
                        {previewShowtimes.length > 0 && (
                            <div className="border rounded-lg p-4 bg-muted max-h-60 overflow-auto">
                                <h3 className="font-bold mb-2">
                                    Preview: 1 suất chiếu
                                </h3>

                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Ngày</TableHead>
                                            <TableHead>Phòng</TableHead>
                                            <TableHead>Format</TableHead>
                                            <TableHead>Bắt đầu</TableHead>
                                            <TableHead>Kết thúc</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {previewShowtimes.map((p, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{p.date}</TableCell>
                                                <TableCell>{p.room}</TableCell>
                                                <TableCell>{p.format}</TableCell>
                                                <TableCell>{p.startTime}</TableCell>
                                                <TableCell>{p.endTime}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {/* SKIPPED / CONFLICTS */}
                        {skippedPreviews.length > 0 && (
                            <div className="border rounded-lg p-4 bg-red-100 max-h-60 overflow-auto mt-4">
                                <h3 className="font-bold mb-2 text-red-600">
                                    Xung đột: {skippedPreviews.length} suất bị bỏ qua
                                </h3>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Ngày</TableHead>
                                            <TableHead>Phòng</TableHead>
                                            <TableHead>Format</TableHead>
                                            <TableHead>Bắt đầu</TableHead>
                                            <TableHead>Kết thúc</TableHead>
                                            <TableHead>Lý do</TableHead>
                                            <TableHead>Xung đột</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {skippedPreviews.map((p, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{p.date}</TableCell>
                                                <TableCell>{p.room}</TableCell>
                                                <TableCell>{p.format}</TableCell>
                                                <TableCell>{p.startTime}</TableCell>
                                                <TableCell>{p.endTime}</TableCell>
                                                <TableCell>{p.reason}</TableCell>
                                                <TableCell>{p.conflicts.join(", ")}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {/* ACTION BUTTONS */}
                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" type="button" onClick={onClose}>
                                Hủy
                            </Button>

                            <Button type="submit" disabled={isSubmitting || skippedPreviews.length > 0}>
                                {isSubmitting ? "Đang sửa..." : "Sửa suất chiếu"}
                            </Button>
                        </div>

                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}  