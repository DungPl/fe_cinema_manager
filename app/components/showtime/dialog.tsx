// Thêm imports mới
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog"
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
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { useState, useEffect } from "react"

// Giả sử API fetch movies, cinemas, rooms
import { getMovieById, getMovies } from "~/lib/api/movieApi"
import { getCinemas } from "~/lib/api/cinemaApi"
import { getRoomsByCinemaId } from "~/lib/api/roomApi"
import { createShowtimeBatch } from "~/lib/api/showtimeApi"
import type { Movie, Cinema, Room } from "~/lib/api/types"

type CreateShowtimeDialogProps = {
    selectedDate?: Date // có thể undefined
    refreshShowtimes: () => Promise<void>
}

// Schema validation
const formSchema = z.object({
    movieId: z.string().min(1, "Chọn phim"),
    province: z.string().min(1, "Chọn khu vực"),
    cinemaId: z.string().min(1, "Chọn rạp"),
    roomIds: z.array(z.string()).min(1, "Chọn ít nhất 1 phòng"),
    formats: z.array(z.enum(["2D", "3D", "IMAX", "4DX"])).min(1, "Chọn ít nhất 1 format"),

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
    });

export function CreateShowtimeDialog({ selectedDate, refreshShowtimes }: CreateShowtimeDialogProps) {
    // States
    const [movies, setMovies] = useState<Movie[]>([])
    const [cinemas, setCinemas] = useState<Cinema[]>([])
    const [rooms, setRooms] = useState<Room[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [selectedProvince, setSelectedProvince] = useState("")
    const [selectedCinema, setSelectedCinema] = useState<number | null>(null)
    const [selectedRooms, setSelectedRooms] = useState<string[]>([])
    const [selectedFormats, setSelectedFormats] = useState<string[]>([])
    const [previewShowtimes, setPreviewShowtimes] = useState<any[]>([]) // {date, roomName, format, startTime, endTime}
    const [movieDuration, setMovieDuration] = useState<number>(0)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [moviesRes, cinemasRes] = await Promise.all([
                    getMovies({ showingStatus: "NOW_SHOWING" }),
                    getCinemas({ limit: 100 })
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

    // Form
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            movieId: "",
            province: "",
            cinemaId: "",
            roomIds: [],
            formats: ["2D"],
            startDate: selectedDate || new Date(),
            endDate: selectedDate || new Date(),
            timeSlots: [],
            price: 80000,
        },
    })

    // Tính preview khi fields thay đổi (dùng watch)
    const { watch } = form
    useEffect(() => {
        const subscription = watch(async (value) => {
            if (value.movieId && value.roomIds?.length && value.formats?.length && value.timeSlots?.length && value.startDate && value.endDate) {
                try {
                    const movie = await getMovieById(Number(value.movieId)) // Fetch duration
                    setMovieDuration(movie.duration || 120) // Default 120p
                    const previews: any[] = []
                    let currentDate = new Date(value.startDate)
                    while (currentDate <= value.endDate) {
                        value.roomIds.forEach((roomId) => {
                            const room = rooms.find(r => r.id === Number(roomId))
                            value.formats?.forEach((movieFormat) => {
                                value.timeSlots?.forEach((slotObj) => {
                                    const slot = slotObj?.value
                                    const startTime = new Date(`${format(currentDate, "yyyy-MM-dd")}T${slot}:00`)
                                    const endTime = addMinutes(startTime, movie.duration || 120)
                                    previews.push({
                                        date: format(currentDate, "dd/MM/yyyy"),
                                        room: room?.name || "",
                                        format: movieFormat,
                                        startTime: format(startTime, "HH:mm"),
                                        endTime: format(endTime, "HH:mm"),
                                    })
                                })
                            })
                        })
                        currentDate = addDays(currentDate, 1) // +1 day
                    }
                    setPreviewShowtimes(previews)
                } catch (err) {
                    console.error("Lỗi preview:", err)
                }
            } else {
                setPreviewShowtimes([])
            }
        })
        return () => subscription.unsubscribe()
    }, [watch, rooms])

    // onSubmit
    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true)
        try {
            const payload = {
                movieId: Number(values.movieId),
                roomIds: values.roomIds.map(Number),
                startDate: format(values.startDate, "yyyy-MM-dd"),
                endDate: format(values.endDate, "yyyy-MM-dd"),
                formats: values.formats,
                timeSlots: values.timeSlots.map(t => t.value),
                price: values.price, // Nếu backend hỗ trợ override
            }
            await createShowtimeBatch(payload)
            toast.success(`Tạo thành công ${previewShowtimes.length} suất chiếu!`)
            setIsOpen(false)
            form.reset()
            refreshShowtimes()
        } catch (err: any) {
            toast.error(err.message || "Không thể tạo suất chiếu")
        } finally {
            setIsSubmitting(false)
        }
    }

    // Provinces unique từ cinemas
    const provinces = [
        ...new Set(
            cinemas
                .map(c => c.address?.[0]?.province)
                .filter(Boolean)
        )
    ]

    // Cinemas filtered by province
    const filteredCinemas = selectedProvince ? cinemas.filter(c => c.address?.[0]?.province === selectedProvince) : cinemas

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="w-4 h-4 mr-2" /> Tạo Suất Chiếu
                </Button>
            </DialogTrigger>

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
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phim</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
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
                                            <SelectContent>
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
                                                    <CommandEmpty>Không tìm thấy rạp</CommandEmpty>

                                                    <CommandGroup>
                                                        {filteredCinemas.map((c) => (
                                                            <CommandItem
                                                                key={c.id}
                                                                value={c.name}
                                                                onSelect={() => {
                                                                    field.onChange(c.id!.toString())
                                                                    setSelectedCinema(c.id!)
                                                                    form.setValue("roomIds", [])
                                                                }}
                                                            >
                                                                {c.name}
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
                                                    <CommandList>
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
                                                        ? format(field.value, "dd/MM/yyyy")
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
                                                        ? format(field.value, "dd/MM/yyyy")
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
                            render={() => {
                                const { fields, append, remove } = useFieldArray({
                                    control: form.control,
                                    name: "timeSlots"
                                })
                                const [slot, setSlot] = useState("")

                                return (
                                    <FormItem>
                                        <FormLabel>Khung giờ</FormLabel>
                                        <div className="flex gap-2">
                                            <Input type="time" value={slot} onChange={e => setSlot(e.target.value)} />
                                            <Button
                                                type="button"
                                                onClick={() => {
                                                    if (slot && !fields.some(f => f.value === slot)) {
                                                        append({ value: slot })
                                                        setSlot("")
                                                    }
                                                }}
                                            >
                                                Thêm
                                            </Button>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {fields.map((f, idx) => (
                                                <Badge key={f.id} variant="secondary">
                                                    {f.value}
                                                    <X
                                                        className="w-3 h-3 ml-1 cursor-pointer"
                                                        onClick={() => remove(idx)}
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
                                    Preview: {previewShowtimes.length} suất chiếu
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

                        {/* ACTION BUTTONS */}
                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
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