// Thêm imports mới
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog" // Remove DialogTrigger
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form"
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
import { Calendar } from "~/components/ui/calendar"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "~/components/ui/command"
import { Check, ChevronsUpDown, CalendarIcon, X, Plus } from "lucide-react"
import { toast } from "sonner"
import { format as formatDate } from "date-fns"
import { vi } from "date-fns/locale"
import { useState, useEffect } from "react"
// Giả sử API fetch movies, cinemas, rooms
import { getMovieById, getMovies } from "~/lib/api/movieApi"
import { getCinemas } from "~/lib/api/cinemaApi"
import { getAvailableRoomsByCinemaId, getRoomsByCinemaId } from "~/lib/api/roomApi"
import { createShowtimeBatch, getShowtimeByCinemaAndDate, getShowtimes } from "~/lib/api/showtimeApi"
import type { Movie, Cinema, Room, Format } from "~/lib/api/types"
type CreateShowtimeDialogProps = {
    selectedDate?: Date // có thể undefined
    refreshShowtimes: () => Promise<void>
    open: boolean
    onOpenChange: (open: boolean) => void
}
export type LanguageType =
    | "VI_SUB"
    | "VI_DUB"
    | "EN_SUB"
    | "EN_DUB"
const LANGUAGE_OPTIONS: { key: LanguageType; label: string }[] = [
    { key: "VI_SUB", label: "Phụ đề Việt" },
    { key: "VI_DUB", label: "Lồng tiếng Việt" },
    { key: "EN_SUB", label: "Phụ đề Anh" },
    { key: "EN_DUB", label: "Lồng tiếng Anh" },
]
// Schema validation
const formSchema = z.object({
    movieId: z.string().min(1, "Chọn phim"),
    province: z.string().min(1, "Chọn khu vực"),
    cinemaId: z.string().min(1, "Chọn rạp"),
    roomIds: z.array(z.string()).min(1, "Chọn ít nhất 1 phòng"),
    formats: z.array(z.enum(["2D", "3D", "IMAX", "4DX"])).min(1, "Chọn ít nhất 1 format"),
    languageType: z.enum(["VI_SUB", "VI_DUB", "EN_SUB", "EN_DUB"])
        .refine(val => !!val, {
            message: "Vui lòng chọn phụ đề / lồng tiếng",
        }),



    startDate: z.date(),
    endDate: z.date(),
    timeSlots: z.array(
        z.object({
            value: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Giờ không hợp lệ")
        })
    ).min(1, "Cần ít nhất 1 khung giờ"),
    price: z.number().min(10000, "Giá vé tối thiểu 10.000 đ"),
})
    .refine((data) => data.startDate, {
        message: "Chọn ngày bắt đầu",
        path: ["startDate"],
    })
    .refine((data) => data.endDate, {
        message: "Chọn ngày kết thúc",
        path: ["endDate"],
    })
    .refine((data) => data.endDate >= data.startDate, {
        message: "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu",
        path: ["endDate"],
    })
    .refine((data) => new Set(data.timeSlots.map(t => t.value)).size === data.timeSlots.length, {
        message: "Khung giờ không được trùng lặp",
        path: ["timeSlots"],
    })
    .refine(data => data.roomIds.length <= 6, {
        message: "Tối đa 6 phòng cho 1 phim",
        path: ["roomIds"],
    })
    .refine(data => {
        for (const fmt of data.formats) {
            let maxRooms = Infinity
            if (["IMAX", "4DX"].includes(fmt)) {
                maxRooms = 2
            }
            if (data.roomIds.length > maxRooms) {
                return false
            }
        }
        return true
    }, {
        message: "Định dạng đặc biệt chỉ được chiếu tối đa ở 2 phòng",
        path: ["roomIds"],
    });
function isOverlap(startA: Date, endA: Date, startB: Date, endB: Date) {
    return !(endA <= startB || startA >= endB);
}
function toLocalDate(dateString: string) {
    return new Date(dateString);
}

export function CreateShowtimeDialog({ selectedDate, refreshShowtimes, open, onOpenChange }: CreateShowtimeDialogProps) {
    // States
    const [movies, setMovies] = useState<Movie[]>([])
    const [cinemas, setCinemas] = useState<Cinema[]>([])
    const [rooms, setRooms] = useState<Room[]>([])
    const [selectedProvince, setSelectedProvince] = useState("")
    const [selectedCinema, setSelectedCinema] = useState<number | null>(null)
    const [selectedRooms, setSelectedRooms] = useState<string[]>([])
    const [selectedFormats, setSelectedFormats] = useState<string[]>([])
    const [previewShowtimes, setPreviewShowtimes] = useState<any[]>([]) // {date, roomName, roomId, format, startTime, endTime, startDate: Date, endDate: Date}
    const [skippedPreviews, setSkippedPreviews] = useState<any[]>([]) // {date, room, format, startTime, endTime, reason, conflicts: string[]}
    const [skippedCount, setSkippedCount] = useState(0)
    const [movieDuration, setMovieDuration] = useState<number>(0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isFetchingMovie, setIsFetchingMovie] = useState(false);
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
    const [existingShowtimes, setExistingShowtimes] = useState<any[]>([])
    const [isLoadingExisting, setIsLoadingExisting] = useState(false);
    const [isMovieLocked, setIsMovieLocked] = useState(false)
    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [nowRes, soonRes] = await Promise.all([
                    getMovies({ showingStatus: "NOW_SHOWING" }),
                    getMovies({ showingStatus: "COMING_SOON" }),
                ])

                const movieMap = new Map<number, Movie>()

                // Ưu tiên thêm NOW_SHOWING trước (thông tin đầy đủ hơn)
                nowRes.rows.forEach(movie => {
                    movieMap.set(movie.id, movie)
                })

                // Sau đó thêm COMING_SOON (chỉ thêm nếu chưa có)
                soonRes.rows.forEach(movie => {
                    if (!movieMap.has(movie.id)) {
                        movieMap.set(movie.id, movie)
                    }
                })

                const uniqueMovies = Array.from(movieMap.values())

                // Sắp xếp: phim đang chiếu lên trước, sau đó đến phim sắp chiếu
                uniqueMovies.sort((a, b) => {
                    const aIsNow = nowRes.rows.some(m => m.id === a.id)
                    const bIsNow = nowRes.rows.some(m => m.id === b.id)
                    if (aIsNow && !bIsNow) return -1
                    if (!aIsNow && bIsNow) return 1
                    return a.title.localeCompare(b.title)
                })

                setMovies(uniqueMovies)
                // Fetch all cinemas with paging
                let allCinemas: Cinema[] = [];
                let page = 1;
                const limit = 100;
                while (true) {
                    const cinemasRes = await getCinemas({ limit, page });
                    allCinemas = [...allCinemas, ...cinemasRes.rows];
                    if (page * limit >= cinemasRes.totalCount) {
                        break;
                    }
                    page++;
                }
                setCinemas(allCinemas);
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
                    const roomsRes = await getAvailableRoomsByCinemaId(selectedCinema)
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

    // Form
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            movieId: "",
            province: "",
            cinemaId: "",
            roomIds: [],
            formats: ["2D"],
            languageType: "VI_SUB",
            startDate: selectedDate || new Date(),
            endDate: selectedDate || new Date(),
            timeSlots: [],
            price: 50000,
        },
    })
    const { watch } = form
    const watchedStartDate = watch("startDate")
    const watchedEndDate = watch("endDate")
    const watchedCinemaId = watch("cinemaId")
    useEffect(() => {
        const fetchExisting = async () => {
            if (!watchedCinemaId || !watchedStartDate || !watchedEndDate) return;

            setIsLoadingExisting(true);
            try {
                let fetchDate = new Date(watchedStartDate);
                const lastDate = new Date(watchedEndDate);
                const allExisting: any[] = [];

                while (fetchDate <= lastDate) {
                    const dateStr = formatDate(fetchDate, "yyyy-MM-dd");
                    const showtimes = await getShowtimeByCinemaAndDate(Number(watchedCinemaId), dateStr);
                    if (Array.isArray(showtimes)) allExisting.push(...showtimes);
                    fetchDate = addDays(fetchDate, 1);
                }

                setExistingShowtimes(allExisting);
            } catch (err) {
                console.error("Lỗi fetch existing:", err);
                setExistingShowtimes([]);
            } finally {
                setIsLoadingExisting(false);
            }
        };

        fetchExisting();
    }, [watchedCinemaId, watchedStartDate, watchedEndDate]);
    useEffect(() => {
        const parseTimeOnDate = (date: Date, hhmm: string) => {
            return new Date(date.getFullYear(), date.getMonth(), date.getDate(), ...hhmm.split(":").map(Number));
        };
        const isOverlap = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) => {
            return aStart < bEnd && bStart < aEnd;
        };

        const hasMinGap = (aEnd: Date, bStart: Date, minGapMs: number) => {
            return bStart.getTime() - aEnd.getTime() >= minGapMs;
        };

        const DEBUG = true; // set false to silence debug logs
        const subscription = watch(async (value) => {
            if (
                value.movieId &&
                value.roomIds && value.roomIds.length > 0 &&
                value.formats && value.formats.length > 0 &&
                value.timeSlots && value.timeSlots.length > 0 &&
                value.startDate &&
                value.endDate
            ) {
                try {
                    // --- FETCH EXISTING into local allExisting (use this for all checks) ---
                    let fetchDate = new Date(value.startDate);
                    const lastDate = new Date(value.endDate);
                    const allExisting: any[] = [];
                    while (fetchDate <= lastDate) {
                        const dateStr = formatDate(fetchDate, "yyyy-MM-dd");
                        const showtimes = await getShowtimeByCinemaAndDate(Number(value.cinemaId), dateStr) as any[];
                        if (Array.isArray(showtimes) && showtimes.length) allExisting.push(...showtimes);
                        fetchDate = addDays(fetchDate, 1);
                    }
                    setExistingShowtimes(allExisting);
                    //if (DEBUG) console.log("allExisting loaded:", allExisting.length);
                    // --- PREPARE ---
                    let previewDate = new Date(value.startDate);
                    const lastPreviewDate = new Date(value.endDate);
                    const movie = await getMovieById(Number(value.movieId));
                    setMovieDuration(movie.duration || 120);
                    const previews: any[] = [];
                    const skippedPreviews: any[] = [];
                    let skipped = 0;
                    const formatConfigs: { [key: string]: { offsetMinutes: number; maxPerDay: number; maxRooms: number } } = {
                        "2D": { offsetMinutes: 10, maxPerDay: 8, maxRooms: Infinity },
                        "3D": { offsetMinutes: 10, maxPerDay: 6, maxRooms: Infinity },
                        "IMAX": { offsetMinutes: 10, maxPerDay: 4, maxRooms: 2 },
                        "4DX": { offsetMinutes: 10, maxPerDay: 4, maxRooms: 2 },
                    };
                    const minGapBetweenRooms = 10 * 60 * 1000;
                    const breakStartHour = 11;
                    const breakEndHour = 14;
                    const imaxLateCountPerDay: { [key: string]: number } = {};
                    // Precompute ordered room ids (numbers)
                    const orderedRoomIds = (value.roomIds ?? []).map(Number);
                    while (previewDate <= lastPreviewDate) {
                        const dateKey = formatDate(previewDate, "yyyy-MM-dd");
                        imaxLateCountPerDay[dateKey] = 0;
                        // build map of existing by room for this date (use allExisting local!)
                        const existingByRoom = new Map<number, any[]>();
                        for (const s of allExisting) {  // ← Dùng state thay vì allExisting local
                            const sDate = new Date(s.start).toLocaleDateString('en-CA', { // 'en-CA' cho yyyy-MM-dd chuẩn
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                timeZone: 'Asia/Ho_Chi_Minh' // Đồng bộ timezone VN
                            }).replace(/\//g, '-'); // Đồng bộ format yyyy-MM-dd
                            if (sDate !== dateKey) continue;

                            const rid = Number(s.roomId);
                            if (!existingByRoom.has(rid)) existingByRoom.set(rid, []);
                            existingByRoom.get(rid)!.push(s);
                        }
                        const validSlots: string[] = (value.timeSlots ?? [])
                            .filter((t: any) => t?.value !== undefined)
                            .map((t: any) => t.value);
                        const dailyCreatedByFormat = Object.fromEntries(
                            value.formats.map(fmt => [fmt, 0])
                        ) as Record<string, number>
                        for (const roomIdNum of orderedRoomIds) {
                            const room = rooms.find(r => r.id === roomIdNum);
                            if (!room) continue;
                            for (const format of (value.formats ?? [])) {
                                if (!format) { skipped++; continue; }
                                if (!room.formats?.some((f: any) => f.name === format)) { skipped += validSlots.length; continue; }
                                const config = formatConfigs[format];
                                if (!config) continue;
                                const maxPerDay = config.maxPerDay;
                                const offsetMinutes = config.offsetMinutes;
                                for (const slot of validSlots) {
                                    if (dailyCreatedByFormat[format] >= maxPerDay) break;
                                    // base startTime from slot on previewDate
                                    let startTime = parseTimeOnDate(previewDate, slot);
                                    const idx = orderedRoomIds.indexOf(roomIdNum);
                                    if (idx === -1) { skipped++; continue; }
                                    // apply offset
                                    startTime = addMinutes(startTime, idx * offsetMinutes);
                                    if (startTime.getHours() >= 11 && startTime.getHours() < 14) {
                                        const lunchRoomGapMinutes = 20;
                                        startTime = addMinutes(startTime, idx * lunchRoomGapMinutes);
                                    }
                                    // normalize date to previewDate (prevent day shift)
                                    startTime = new Date(previewDate.getFullYear(), previewDate.getMonth(), previewDate.getDate(), startTime.getHours(), startTime.getMinutes(), 0);
                                    // if date changed after normalization -> skip
                                    if (formatDate(startTime, "yyyy-MM-dd") !== dateKey) {
                                        skipped++;
                                        skippedPreviews.push({
                                            date: formatDate(previewDate, "dd/MM/yyyy"),
                                            room: room?.name || "",
                                            format,
                                            startTime: formatDate(startTime, "HH:mm"),
                                            endTime: "N/A",
                                            reason: "Vượt quá giờ chiếu cho phép",
                                            conflicts: []
                                        });
                                        continue;
                                    }
                                    const endTime = addMinutes(startTime, movie.duration || 120);
                                    function isInLunchRange(date: Date, breakStartHour: number, breakEndHour: number) {
                                        const h = date.getHours();
                                        return h >= breakStartHour && h < breakEndHour;
                                    }
                                    const startInLunch = isInLunchRange(startTime, breakStartHour, breakEndHour);
                                    const endInLunch = isInLunchRange(endTime, breakStartHour, breakEndHour);

                                    const min_gap_in_room_minutes =
                                        startInLunch && endInLunch ? 20 : 10;
                                    const min_gap_in_room_ms = min_gap_in_room_minutes * 60 * 1000;
                                    // IMAX late limit
                                    console.log("Thời gian nghỉ ", min_gap_in_room_ms)
                                    if (format === "IMAX" && startTime.getHours() >= 22) {
                                        if ((imaxLateCountPerDay[dateKey] ?? 0) >= 1) {
                                            skipped++;
                                            skippedPreviews.push({ date: formatDate(previewDate, "dd/MM/yyyy"), room: room?.name || "", format, startTime: formatDate(startTime, "HH:mm"), endTime: formatDate(endTime, "HH:mm"), reason: "Vượt quá 1 suất IMAX sau 22:00", conflicts: [] });
                                            continue;
                                        }
                                        imaxLateCountPerDay[dateKey] = (imaxLateCountPerDay[dateKey] ?? 0) + 1;
                                    }
                                    // --- CHECK WITH EXISTING IN SAME ROOM (use existingByRoom) ---
                                    const roomExisting = existingByRoom.get(roomIdNum) ?? [];
                                    //if (DEBUG) console.log("Checking roomExisting for", roomIdNum, "count:", roomExisting.length);
                                    let conflictingExisting: any[] = [];
                                    for (const s of roomExisting) {
                                        const sStart = toLocalDate(s.start);
                                        const sEnd = toLocalDate(s.end);
                                        // Gap mặc định

                                        if (isOverlap(startTime, endTime, sStart, sEnd) ||
                                            (endTime <= sStart && (sStart.getTime() - endTime.getTime()) < min_gap_in_room_ms) ||
                                            (sEnd <= startTime && (startTime.getTime() - sEnd.getTime()) < min_gap_in_room_ms)
                                        ) {
                                            conflictingExisting.push(s);
                                            break;
                                        }
                                    }
                                    if (conflictingExisting.length > 0) {
                                        //if (DEBUG) console.log("Conflicting existing found:", conflictingExisting);
                                        skipped++;
                                        const hasTrueOverlap = conflictingExisting.some(s =>
                                            isOverlap(startTime, endTime, toLocalDate(s.start), toLocalDate(s.end))
                                        );
                                        skippedPreviews.push({
                                            date: formatDate(previewDate, "dd/MM/yyyy"),
                                            room: room.name,
                                            format,
                                            startTime: formatDate(startTime, "HH:mm"),
                                            endTime: formatDate(endTime, "HH:mm"),
                                            //reason: conflictingExisting.some((s: any) => isOverlap(startTime, endTime, toLocalDate(s.start), toLocalDate(s.end))) ? "Trùng lịch phòng (tồn tại)" : "Khoảng cách suất chiếu trong phòng quá gần (tồn tại)",
                                            reason: hasTrueOverlap
                                                ? "Trùng lịch phòng (tồn tại - chồng lấn)"
                                                : `Khoảng cách suất chiếu trong phòng quá gần (tồn tại - cần ít nhất ${min_gap_in_room_minutes} phút)`,

                                            conflicts: conflictingExisting.map((c: any) => {
                                                const title = c.Movie?.title || "Phim khác";
                                                const start = formatDate(toLocalDate(c.start), "HH:mm");
                                                const end = formatDate(toLocalDate(c.end), "HH:mm");
                                                return `${title} (${start}-${end})`;
                                            })
                                        });
                                        continue;
                                    }
                                    // CHECK WITH PREVIEWS IN SAME ROOM
                                    const roomPreviews = previews.filter(
                                        p => p.roomId === roomIdNum && p.date === formatDate(previewDate, "dd/MM/yyyy")
                                    );

                                    let conflictingPreviews: any[] = [];

                                    for (const p of roomPreviews) {
                                        const pStart = parseTimeOnDate(previewDate, p.startTime);
                                        const pEnd = parseTimeOnDate(previewDate, p.endTime);

                                        const isOverlapping = isOverlap(startTime, endTime, pStart, pEnd);

                                        const gapBeforeTooSmall = pEnd < startTime && (startTime.getTime() - pEnd.getTime() < min_gap_in_room_ms);
                                        const gapAfterTooSmall = endTime < pStart && (pStart.getTime() - endTime.getTime() < min_gap_in_room_ms);

                                        if (isOverlapping || gapBeforeTooSmall || gapAfterTooSmall) {
                                            conflictingPreviews.push(p);
                                            // Có thể break sớm nếu chỉ cần phát hiện có xung đột (tăng hiệu suất)
                                            // break;
                                        }
                                    }

                                    if (conflictingPreviews.length > 0) {
                                        if (DEBUG) {
                                            console.log("Conflicting previews found:", conflictingPreviews.map(p => ({
                                                format: p.format,
                                                time: `${p.startTime} → ${p.endTime}`
                                            })));
                                        }

                                        skipped++;

                                        const isTrueOverlap = conflictingPreviews.some(p =>
                                            isOverlap(
                                                startTime,
                                                endTime,
                                                parseTimeOnDate(previewDate, p.startTime),
                                                parseTimeOnDate(previewDate, p.endTime)
                                            )
                                        );

                                        skippedPreviews.push({
                                            date: formatDate(previewDate, "dd/MM/yyyy"),
                                            room: room.name,
                                            format,
                                            startTime: formatDate(startTime, "HH:mm"),
                                            endTime: formatDate(endTime, "HH:mm"),
                                            reason: isTrueOverlap
                                                ? "Trùng lịch phòng (preview - chồng lấn)"
                                                : "Khoảng cách suất chiếu trong phòng quá gần (preview)",
                                            conflicts: conflictingPreviews.map(c => `${c.format} (${c.startTime}-${c.endTime})`)
                                        });

                                        continue;
                                    }
                                    // --- NEARBY checks (other rooms) using allExisting ---
                                    const sameRoomExisting = allExisting.filter(s =>
                                        Number(s.roomId) === roomIdNum &&
                                        s.start.split('T')[0] === dateKey
                                    );

                                    const overlappingSameRoom = sameRoomExisting.filter((s: any) => {
                                        const sStart = toLocalDate(s.start);
                                        const sEnd = toLocalDate(s.end);
                                        return isOverlap(startTime, endTime, sStart, sEnd);
                                    });

                                    if (overlappingSameRoom.length > 0) {
                                        skipped++;
                                        skippedPreviews.push({
                                            date: formatDate(previewDate, "dd/MM/yyyy"),
                                            room: room?.name || "",
                                            format,
                                            startTime: formatDate(startTime, "HH:mm"),
                                            endTime: formatDate(endTime, "HH:mm"),
                                            reason: "Trùng thời gian trong cùng phòng",
                                            conflicts: overlappingSameRoom.map(c =>
                                                `${c.Room?.name || "Room " + c.roomId} (${formatDate(new Date(c.start), "HH:mm")}-${formatDate(new Date(c.end), "HH:mm")})`
                                            )
                                        });
                                        continue;
                                    }
                                    const nearbySameRoom = sameRoomExisting.filter((s: any) => {
                                        const sStart = toLocalDate(s.start);
                                        const sEnd = toLocalDate(s.end);

                                        const gapBefore = startTime.getTime() - sEnd.getTime();
                                        const gapAfter = sStart.getTime() - endTime.getTime();

                                        return (
                                            (gapBefore >= 0 && gapBefore < minGapBetweenRooms) ||
                                            (gapAfter >= 0 && gapAfter < minGapBetweenRooms)
                                        );
                                    });

                                    if (nearbySameRoom.length > 0) {
                                        skipped++;
                                        skippedPreviews.push({
                                            date: formatDate(previewDate, "dd/MM/yyyy"),
                                            room: room?.name || "",
                                            format,
                                            startTime: formatDate(startTime, "HH:mm"),
                                            endTime: formatDate(endTime, "HH:mm"),
                                            reason: "Khoảng cách giữa 2 suất chiếu trong cùng phòng < 10 phút",
                                            conflicts: nearbySameRoom.map(c =>
                                                `${c.Room?.name || "Room " + c.roomId} (${formatDate(new Date(c.start), "HH:mm")}-${formatDate(new Date(c.end), "HH:mm")})`
                                            )
                                        });
                                        continue;
                                    }
                                    const MIN_GAP_BETWEEN_ROOMS_MS = 10 * 60 * 1000;
                                    const otherRoomExisting = allExisting.filter(s =>
                                        Number(s.roomId) !== roomIdNum &&
                                        s.start.split("T")[0] === dateKey
                                    );

                                    const conflictOtherRoomStart = otherRoomExisting.filter(s => {
                                        const sStart = toLocalDate(s.start);
                                        return Math.abs(startTime.getTime() - sStart.getTime()) < MIN_GAP_BETWEEN_ROOMS_MS;
                                    });

                                    if (conflictOtherRoomStart.length > 0) {
                                        skipped++;
                                        skippedPreviews.push({
                                            date: formatDate(previewDate, "dd/MM/yyyy"),
                                            room: room.name,
                                            format,
                                            startTime: formatDate(startTime, "HH:mm"),
                                            endTime: formatDate(endTime, "HH:mm"),
                                            reason: "Giờ bắt đầu quá gần suất chiếu phòng khác (< 10 phút)",
                                            conflicts: conflictOtherRoomStart.map(c =>
                                                `${c.Room?.name || "Room " + c.roomId} (${formatDate(toLocalDate(c.start), "HH:mm")})`
                                            )
                                        });
                                        continue;
                                    }
                                    const otherRoomPreviews = previews.filter(p =>
                                        p.roomId !== roomIdNum &&
                                        p.date === formatDate(previewDate, "dd/MM/yyyy")
                                    );

                                    const conflictPreviewStart = otherRoomPreviews.filter(p => {
                                        const pStart = parseTimeOnDate(previewDate, p.startTime);
                                        return Math.abs(startTime.getTime() - pStart.getTime()) < MIN_GAP_BETWEEN_ROOMS_MS;
                                    });

                                    if (conflictPreviewStart.length > 0) {
                                        skipped++;
                                        skippedPreviews.push({
                                            date: formatDate(previewDate, "dd/MM/yyyy"),
                                            room: room.name,
                                            format,
                                            startTime: formatDate(startTime, "HH:mm"),
                                            endTime: formatDate(endTime, "HH:mm"),
                                            reason: "Giờ bắt đầu quá gần suất chiếu phòng khác (preview)",
                                            conflicts: conflictPreviewStart.map(c =>
                                                `${c.room} (${c.startTime})`
                                            )
                                        });
                                        continue;
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
                                    dailyCreatedByFormat[format]++;
                                } // end slots
                            } // end format
                        } // end room loop
                        previewDate = addDays(previewDate, 1);
                    } // end previewDate while
                    setPreviewShowtimes(previews);
                    setSkippedPreviews(skippedPreviews);
                    setSkippedCount(skipped);
                } catch (err) {
                    console.error("Lỗi preview:", err);
                }
            } else {
                setPreviewShowtimes([]);
                setSkippedPreviews([]);
                setSkippedCount(0);
                setExistingShowtimes([]);
            }
        });
        return () => subscription.unsubscribe();
    }, [watch, rooms]);

    // onSubmit
    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true)
        try {
            const payload = {
                movieId: Number(values.movieId),
                roomIds: values.roomIds.map(Number),
                startDate: formatDate(values.startDate, "yyyy-MM-dd"),
                endDate: formatDate(values.endDate, "yyyy-MM-dd"),
                formats: values.formats,
                languageType: values.languageType,
                timeSlots: values.timeSlots.map(t => t.value),
                price: values.price, // Nếu backend hỗ trợ override
            }
            const response = await createShowtimeBatch(payload)
            //console.log("API response:", response)
            toast.success(`Tạo thành công ${response.data.created} suất chiếu, bỏ qua ${response.data.skipped} suất chiếu do trùng lịch hoặc giờ không hợp lệ!`)
            onOpenChange(false)
            setSelectedProvince("");
            setSelectedCinema(null);
            setSelectedRooms([]);
            setSelectedFormats([]);
            setPreviewShowtimes([]);
            setSkippedPreviews([]);
            setSkippedCount(0);
            setExistingShowtimes([]);
            setIsMovieLocked(false);
            form.reset()
            refreshShowtimes()
        } catch (err: any) {
            console.log(err)
            toast.error(err.response.data.message || "Không thể tạo suất chiếu")
        } finally {
            setIsSubmitting(false)
        }
    }
    // Provinces unique từ cinemas
    const provinces = [
        ...new Set(
            cinemas
                .map(c => c.address?.[0]?.province)
                .filter((p): p is string => typeof p === "string")
        )
    ]

    // Cinemas filtered by province
    const filteredCinemas = selectedProvince ? cinemas.filter(c => c.address?.[0]?.province === selectedProvince) : cinemas
    const timeOptions: string[] = [];
    for (let h = 8; h <= 23; h++) {
        for (let m of [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]) {
            if (h === 24 && m > 30) continue;
            const hh = h.toString().padStart(2, "0");
            const mm = m.toString().padStart(2, "0");
            timeOptions.push(`${hh}:${mm}`);
        }
    }
    const nowShowingMovies = movies.filter(
        m => m.statusMovie === "NOW_SHOWING"
    )

    const comingSoonMovies = movies.filter(
        m => m.statusMovie === "COMING_SOON"
    )
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Tạo Batch Suất Chiếu</DialogTitle>
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
                                render={({ field }) => {
                                    const selectedMovieId = field.value;
                                    const selectedMovieData = [...nowShowingMovies, ...comingSoonMovies].find(
                                        m => m.id.toString() === selectedMovieId
                                    );

                                    return (
                                        <FormItem className="flex flex-col">
                                            <div className="flex items-center justify-between">
                                                <FormLabel>Phim</FormLabel>
                                                {selectedMovieData && isMovieLocked && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        type="button"
                                                        onClick={() => setIsMovieLocked(false)}
                                                        className="text-xs text-muted-foreground hover:text-primary"
                                                    >
                                                        Sửa phim
                                                    </Button>
                                                )}
                                            </div>

                                            {/* Nếu locked → hiển thị info phim, ẩn Combobox */}
                                            {isMovieLocked && selectedMovieData ? (
                                                <div className="mt-2 space-y-3 border rounded-md p-3 bg-muted/50">
                                                    <div className="flex items-start gap-4">
                                                        {selectedMovieData.posters?.[0]?.url && (
                                                            <img
                                                                src={selectedMovieData.posters[0].url}
                                                                alt={selectedMovieData.title}
                                                                className="w-24 h-36 object-cover rounded-md shadow-sm"
                                                                onError={(e) => (e.currentTarget.style.display = "none")}
                                                            />
                                                        )}
                                                        <div>
                                                            <p className="font-medium">{selectedMovieData.title}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                Thời lượng: {selectedMovieData.duration || "N/A"} phút
                                                            </p>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                {selectedMovieData.statusMovie === "NOW_SHOWING" ? "Đang chiếu" : "Sắp chiếu"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {/* Hidden input để giữ giá trị trong form */}
                                                    <input type="hidden" {...field} value={field.value} />
                                                </div>
                                            ) : (
                                                /* Combobox chọn phim - chỉ hiện khi chưa lock hoặc đang sửa */
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                className="w-full justify-between"
                                                            >
                                                                {field.value
                                                                    ? selectedMovieData?.title || "Chọn phim"
                                                                    : "Chọn phim"}
                                                                <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>

                                                    <PopoverContent className="w-[400px] p-0">
                                                        <Command>
                                                            <CommandInput placeholder="Tìm phim theo tên..." />
                                                            <CommandEmpty>Không tìm thấy phim</CommandEmpty>

                                                            <CommandList className="max-h-72 overflow-y-auto">
                                                                <CommandGroup heading="🎬 Đang chiếu">
                                                                    {nowShowingMovies.map(m => (
                                                                        <CommandItem
                                                                            key={m.id}
                                                                            value={m.title}
                                                                            onSelect={() => {
                                                                                field.onChange(m.id.toString());
                                                                                fetchMovieDetails(m.id.toString());
                                                                                // Lock lại sau khi chọn
                                                                                setIsMovieLocked(true);
                                                                            }}
                                                                        >
                                                                            {m.title}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>

                                                                <CommandGroup heading="⏳ Sắp chiếu">
                                                                    {comingSoonMovies.map(m => (
                                                                        <CommandItem
                                                                            key={m.id}
                                                                            value={m.title}
                                                                            onSelect={() => {
                                                                                field.onChange(m.id.toString());
                                                                                fetchMovieDetails(m.id.toString());
                                                                                setIsMovieLocked(true);
                                                                            }}
                                                                        >
                                                                            {m.title}
                                                                            <span className="ml-2 text-xs text-muted-foreground">
                                                                                (Coming soon)
                                                                            </span>
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                            )}

                                            <FormMessage />

                                            {/* Nếu đang lock, hiện poster + info nhỏ bên dưới */}
                                            {isMovieLocked && selectedMovieData && (
                                                <div className="mt-2">
                                                    {selectedMovieData.posters?.[0]?.url && (
                                                        <img
                                                            src={selectedMovieData.posters[0].url}
                                                            alt={selectedMovieData.title}
                                                            className="w-full max-h-48 object-cover rounded-md"
                                                            onError={(e) => (e.currentTarget.style.display = "none")}
                                                        />
                                                    )}
                                                </div>
                                            )}
                                        </FormItem>
                                    );
                                }}
                            />



                            {/* KHU VỰC */}
                            <FormField
                                control={form.control}
                                name="province"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Khu vực</FormLabel>
                                        <Select
                                            onValueChange={(val) => {
                                                field.onChange(val)
                                                setSelectedProvince(val)
                                                setSelectedCinema(null)
                                                setRooms([])
                                                form.setValue("cinemaId", "")
                                                form.setValue("roomIds", [])
                                            }}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn khu vực" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="max-h-60 overflow-y-auto">
                                                {provinces.map(prov => (
                                                    <SelectItem key={prov} value={prov}>
                                                        {prov}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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
                            {/* MULTI SELECT PHÒNG */}
                            <FormField
                                control={form.control}
                                name="roomIds"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phòng</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button variant="outline" className="w-full justify-between">
                                                        {selectedRooms.length > 0
                                                            ? `${selectedRooms.length} phòng đã chọn`
                                                            : "Chọn phòng"}
                                                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-full p-0">
                                                <Command>
                                                    <CommandInput placeholder="Tìm phòng..." />
                                                    <CommandList className="max-h-60 overflow-y-auto">
                                                        <CommandEmpty>Không tìm thấy phòng</CommandEmpty>
                                                        <CommandGroup>
                                                            {rooms.map(room => {
                                                                const id = room.id.toString()
                                                                const selected = selectedRooms.includes(id)
                                                                return (
                                                                    <CommandItem
                                                                        key={room.id}
                                                                        onSelect={() => {
                                                                            const updated = selected
                                                                                ? selectedRooms.filter(x => x !== id)
                                                                                : [...selectedRooms, id]
                                                                            setSelectedRooms(updated)
                                                                            field.onChange(updated)
                                                                        }}
                                                                    >
                                                                        <Check className={cn("mr-2 h-4", selected ? "opacity-100" : "opacity-0")} />
                                                                        {room.name}
                                                                    </CommandItem>
                                                                )
                                                            })}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {/* FORMAT MULTI SELECT */}
                            <FormField
                                control={form.control}
                                name="formats"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Format</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button variant="outline" className="w-full justify-between">
                                                        {selectedFormats.length > 0
                                                            ? selectedFormats.join(", ")
                                                            : "Chọn format"}
                                                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-full p-0">
                                                <Command>
                                                    <CommandGroup>
                                                        {["2D", "3D", "IMAX", "4DX"].map(fmt => {
                                                            const selected = selectedFormats.includes(fmt)
                                                            return (
                                                                <CommandItem
                                                                    key={fmt}
                                                                    onSelect={() => {
                                                                        const updated = selected
                                                                            ? selectedFormats.filter(f => f !== fmt)
                                                                            : [...selectedFormats, fmt]
                                                                        setSelectedFormats(updated)
                                                                        field.onChange(updated)
                                                                    }}
                                                                >
                                                                    <Check className={cn("mr-2 h-4", selected ? "opacity-100" : "opacity-0")} />
                                                                    {fmt}
                                                                </CommandItem>
                                                            )
                                                        })}
                                                    </CommandGroup>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="languageType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phụ đề / Lồng tiếng</FormLabel>

                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button variant="outline" className="w-full justify-between">
                                                        {field.value
                                                            ? LANGUAGE_OPTIONS.find(o => o.key === field.value)?.label
                                                            : "Chọn phụ đề / lồng tiếng"}
                                                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>

                                            <PopoverContent className="w-full p-0">
                                                <Command>
                                                    <CommandGroup>
                                                        {LANGUAGE_OPTIONS.map(item => (
                                                            <CommandItem
                                                                key={item.key}
                                                                onSelect={() => {
                                                                    field.onChange(item.key)
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4",
                                                                        field.value === item.key
                                                                            ? "opacity-100"
                                                                            : "opacity-0"
                                                                    )}
                                                                />
                                                                {item.label}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                        </div>
                        {/* NGÀY BẮT ĐẦU - KẾT THÚC */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* startDate */}
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ngày bắt đầu</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full justify-start">
                                                    {field.value
                                                        ? formatDate(field.value, "dd/MM/yyyy")
                                                        : "Chọn ngày"}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent>
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {/* endDate */}
                            <FormField
                                control={form.control}
                                name="endDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ngày kết thúc</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full justify-start">
                                                    {field.value
                                                        ? formatDate(field.value, "dd/MM/yyyy")
                                                        : "Chọn ngày"}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent>
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        {/* KHUNG GIỜ */}
                        <FormField
                            control={form.control}
                            name="timeSlots"
                            render={({ field }) => {
                                const watchedStartDate = watch("startDate")
                                const now = new Date()
                                const currentHour = now.getHours()
                                const currentMinute = now.getMinutes()
                                const isToday = watchedStartDate && formatDate(watchedStartDate, "yyyy-MM-dd") === formatDate(now, "yyyy-MM-dd")
                                return (
                                    <FormItem>
                                        <FormLabel>Khung giờ</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button variant="outline" className="w-full justify-between">
                                                        {field.value.length > 0
                                                            ? `${field.value.length} khung giờ đã chọn`
                                                            : "Chọn khung giờ"}
                                                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-full p-0">
                                                <Command>
                                                    <CommandInput placeholder="Tìm khung giờ..." />
                                                    <CommandList className="max-h-60 overflow-y-auto">
                                                        <CommandEmpty>Không tìm thấy khung giờ</CommandEmpty>
                                                        <CommandGroup>
                                                            {timeOptions.map((time) => {
                                                                const selected = field.value.some((slot: { value: string }) => slot.value === time);
                                                                const [hh, mm] = time.split(':').map(Number)
                                                                const isPast = isToday && (hh < currentHour || (hh === currentHour && mm < currentMinute))
                                                                const disabled = isPast
                                                                return (
                                                                    <CommandItem
                                                                        key={time}
                                                                        disabled={disabled}
                                                                        onSelect={() => {
                                                                            if (disabled) return
                                                                            const updated = selected
                                                                                ? field.value.filter((slot: { value: string }) => slot.value !== time)
                                                                                : [...field.value, { value: time }];
                                                                            field.onChange(updated);
                                                                        }}
                                                                    >
                                                                        <Check className={cn("mr-2 h-4 w-4", selected ? "opacity-100" : "opacity-0")} />
                                                                        {time}
                                                                    </CommandItem>
                                                                );
                                                            })}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {field.value.map((slot: { value: string }, idx: number) => (
                                                <Badge key={idx} variant="secondary">
                                                    {slot.value}
                                                    <X
                                                        className="w-3 h-3 ml-1 cursor-pointer"
                                                        onClick={() => {
                                                            const updated = field.value.filter((_: any, i: number) => i !== idx);
                                                            field.onChange(updated);
                                                        }}
                                                    />
                                                </Badge>
                                            ))}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )
                            }}
                        />
                        {/* GIÁ */}
                        <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Giá vé</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} onChange={(e) => field.onChange(+e.target.value)} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {/* PREVIEW */}
                        {previewShowtimes.length > 0 && (
                            <div className="border rounded-lg p-4 bg-muted max-h-60 overflow-auto">
                                <h3 className="font-bold mb-2">
                                    Preview: {previewShowtimes.length} suất chiếu (ước tính bỏ qua {skippedCount})
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
                                        {previewShowtimes.slice(0, 30).map((p, i) => (
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
                                {previewShowtimes.length > 30 && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        (Đang hiển thị 30 dòng đầu)
                                    </p>
                                )}
                            </div>
                        )}
                        {skippedPreviews.length > 0 && (
                            <div className="border rounded-lg p-4 bg-muted max-h-60 overflow-auto mt-4">
                                <h3 className="font-bold mb-2 text-red-500">
                                    Suất bị bỏ qua do trùng lịch: {skippedPreviews.length}
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
                                            <TableHead>Trùng với</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {skippedPreviews.slice(0, 30).map((p, i) => (
                                            <TableRow key={i} className="text-red-500">
                                                <TableCell>{p.date}</TableCell>
                                                <TableCell>{p.room}</TableCell>
                                                <TableCell>{p.format}</TableCell>
                                                <TableCell>{p.startTime}</TableCell>
                                                <TableCell>{p.endTime}</TableCell>
                                                <TableCell>{p.reason}</TableCell>
                                                <TableCell> {p.conflicts && p.conflicts.length > 0
                                                    ? p.conflicts.filter(Boolean).join(", ")
                                                    : "—"}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                {skippedPreviews.length > 30 && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        (Đang hiển thị 30 dòng đầu)
                                    </p>
                                )}
                            </div>
                        )}
                        {/* ACTION BUTTONS */}
                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                                Hủy
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Đang tạo..." : "Tạo suất chiếu"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}