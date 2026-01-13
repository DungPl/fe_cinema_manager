// src/pages/admin/StaffDialogs.tsx
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "~/components/ui/form"
import { Input } from "~/components/ui/input"
import { Button } from "~/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"
import { Switch } from "~/components/ui/switch"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "~/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "~/lib/utils"



import type { StaffWithAccount } from "~/lib/api/types"
import { apiClient } from "~/lib/api/client"
import { getCinemas } from "~/lib/api/cinemaApi"

// ── Schema cho CREATE ─────────────────────────────────────────────
const createSchema = z.object({
    firstname: z.string().min(1, "Họ không được để trống"),
    lastname: z.string().min(1, "Tên không được để trống"),
    phoneNumber: z.string().min(9, "Số điện thoại không hợp lệ"),
    email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
    identificationCard: z.string().min(9, "CMND/CCCD không hợp lệ"),
    position: z.string().optional(),

    username: z.string().min(4, "Tên đăng nhập ít nhất 4 ký tự"),
    password: z.string().min(6, "Mật khẩu ít nhất 6 ký tự"),
    role: z.enum(["ADMIN", "MANAGER", "MODERATOR", "SELLER"]),
    cinemaId: z.number().optional().nullable(),

    // Fix: Make active explicitly required (we always want it set)
    active: z.boolean(),
});

type CreateStaffForm = z.infer<typeof createSchema>

// ── Schema cho EDIT ───────────────────────────────────────────────
const editSchema = z.object({
    // Phần Staff
    firstname: z.string().min(1, "Họ không được để trống"),
    lastname: z.string().min(1, "Tên không được để trống"),
    phoneNumber: z.string().min(9, "Số điện thoại không hợp lệ"),
    email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
    identificationCard: z.string().min(9, "CMND/CCCD không hợp lệ"),
    position: z.string().optional(),

    // Phần Account (chỉ update những field cho phép)
    role: z.enum(["ADMIN", "MANAGER", "MODERATOR", "SELLER"]),
    cinemaId: z.number().optional().nullable(),
    active: z.boolean(),
})

type EditStaffForm = z.infer<typeof editSchema>

// ── CREATE Dialog ─────────────────────────────────────────────────
type CreateDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function CreateStaffDialog({ open, onOpenChange, onSuccess }: CreateDialogProps) {
    const form = useForm<z.infer<typeof createSchema>>({
        resolver: zodResolver(createSchema),
        defaultValues: {
            role: "SELLER",
            active: true,
            cinemaId: null,
        },
    });
    const [cinemas, setCinemas] = useState<{ id: number; name: string }[]>([])
    const [openCinema, setOpenCinema] = useState(false)
    const [cinemaSearch, setCinemaSearch] = useState("")
    useEffect(() => {
        const fetchCinemas = async () => {
            try {
                const res = await getCinemas({ limit: 999 })
                setCinemas(res.rows || [])
            } catch (err) {
                console.error("Lỗi tải rạp:", err)
            }
        }
        fetchCinemas()
    }, [])
    const onSubmit = async (values: CreateStaffForm) => {
        try {
            await apiClient.post("/staff/with-account", values)
            toast.success("Tạo nhân viên & tài khoản thành công!")
            onSuccess()
            form.reset()
        } catch (err: any) {
            const message = err.response?.data?.message || "Tạo thất bại"
            toast.error(message)
        }
    }
    const filteredCinemas = cinemas.filter((c) =>
        c.name.toLowerCase().includes(cinemaSearch.toLowerCase())
    )
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Thêm nhân viên mới</DialogTitle>
                    <DialogDescription>
                        Tạo thông tin nhân viên và tài khoản đăng nhập cùng lúc
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <FormField control={form.control} name="firstname" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Họ</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="lastname" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tên</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Số điện thoại</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email (tùy chọn)</FormLabel>
                                    <FormControl><Input type="email" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="identificationCard" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Căn cước công dân</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="username" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tên đăng nhập</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="password" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mật khẩu</FormLabel>
                                    <FormControl><Input type="password" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="role" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Vai trò</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn vai trò" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="ADMIN">Quản trị viên</SelectItem>
                                            <SelectItem value="MANAGER">Quản lý</SelectItem>
                                            <SelectItem value="MODERATOR">Kiểm duyệt viên</SelectItem>
                                            <SelectItem value="SELLER">Nhân viên bán vé</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField
                                control={form.control}
                                name="cinemaId"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Rạp quản lý (bắt buộc với Manager/Seller)</FormLabel>
                                        <Popover open={openCinema} onOpenChange={setOpenCinema}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openCinema}
                                                    className="w-full justify-between"
                                                >
                                                    {field.value
                                                        ? cinemas.find((c) => c.id === field.value)?.name || "Chọn rạp..."
                                                        : "Chọn rạp (hoặc để trống cho Admin/Moderator)"}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-full p-0">
                                                <Command>
                                                    <CommandInput
                                                        placeholder="Tìm rạp theo tên..."
                                                        value={cinemaSearch}
                                                        onValueChange={setCinemaSearch}
                                                    />
                                                    <CommandList className="max-h-[300px] overflow-y-auto"> {/* ← THÊM DÒNG NÀY */}
                                                        <CommandEmpty>Không tìm thấy rạp nào.</CommandEmpty>
                                                        <CommandGroup>
                                                            <CommandItem
                                                                value="none"
                                                                onSelect={() => {
                                                                    field.onChange(null)
                                                                    setOpenCinema(false)
                                                                    setCinemaSearch("")
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        field.value == null ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                Không thuộc rạp nào (Admin/Moderator)
                                                            </CommandItem>

                                                            {filteredCinemas.map((c) => (
                                                                <CommandItem
                                                                    key={c.id}
                                                                    value={c.name}
                                                                    onSelect={() => {
                                                                        field.onChange(c.id)
                                                                        setOpenCinema(false)
                                                                        setCinemaSearch("")
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            field.value === c.id ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
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
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Hủy
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                Tạo nhân viên
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

// ── EDIT Dialog ────────────────────────────────────────────────────
type EditDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    staff: StaffWithAccount | null
    onSuccess: () => void
}

export function EditStaffDialog({ open, onOpenChange, staff, onSuccess }: EditDialogProps) {
    const form = useForm<EditStaffForm>({
        resolver: zodResolver(editSchema),
    })
    const [cinemas, setCinemas] = useState<{ id: number; name: string }[]>([])
    const [openCinema, setOpenCinema] = useState(false)
    const [cinemaSearch, setCinemaSearch] = useState("")
    useEffect(() => {
        const fetchCinemas = async () => {
            try {
                const res = await getCinemas({ limit: 999 })
                setCinemas(res.rows || [])
            } catch (err) {
                console.error("Lỗi tải rạp:", err)
            }
        }
        fetchCinemas()
    }, [])
    useEffect(() => {
        if (staff) {
            form.reset({
                firstname: staff.firstname,
                lastname: staff.lastname,
                phoneNumber: staff.phoneNumber,
                email: staff.email || "",
                identificationCard: staff.identificationCard,


                role: (staff.account?.role as any) || "SELLER",
                cinemaId: staff.account?.cinemaId || null,
                active: staff.account?.active ?? true,
            })
        }
    }, [staff, form])

    const onSubmit = async (values: EditStaffForm) => {
        if (!staff) return

        try {
            // 1. Update thông tin Staff (luôn gửi trước)
            const staffData = {
                firstname: values.firstname,
                lastname: values.lastname,
                phoneNumber: values.phoneNumber,
                email: values.email,
                identificationCard: values.identificationCard,
                position: values.position,
            }

            await apiClient.put(`/staff/${staff.id}`, staffData)

            // 2. Nếu có account → update thông tin account riêng
            if (staff.account?.id) {
                const accountData = {
                    role: values.role,
                    cinemaId: values.cinemaId,
                    active: values.active,
                }

                await apiClient.put(`/staff/${staff.id}/account`, accountData)
            }

            toast.success("Cập nhật thành công!")
            onSuccess()
        } catch (err: any) {
            const message = err.response?.data?.message || "Cập nhật thất bại"
            toast.error(message)
        }
    }
    const filteredCinemas = cinemas.filter((c) =>
        c.name.toLowerCase().includes(cinemaSearch.toLowerCase())
    )
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Chỉnh sửa nhân viên</DialogTitle>
                    <DialogDescription>
                        Cập nhật thông tin nhân viên và trạng thái tài khoản
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <FormField control={form.control} name="firstname" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Họ</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="lastname" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tên</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Số điện thoại</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email (tùy chọn)</FormLabel>
                                    <FormControl><Input type="email" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="identificationCard" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Căn cước công dân</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            {/* Phần Account */}
                            {staff?.account && (
                                <>
                                    <FormField control={form.control} name="role" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Vai trò</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Chọn vai trò" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="ADMIN">Quản trị viên</SelectItem>
                                                    <SelectItem value="MANAGER">Quản lý</SelectItem>
                                                    <SelectItem value="MODERATOR">Kiểm duyệt viên</SelectItem>
                                                    <SelectItem value="SELLER">Nhân viên bán vé</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField
                                        control={form.control}
                                        name="cinemaId"
                                        render={({ field }) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel>Rạp quản lý (bắt buộc với Manager/Seller)</FormLabel>
                                                <Popover open={openCinema} onOpenChange={setOpenCinema}>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            aria-expanded={openCinema}
                                                            className="w-full justify-between"
                                                        >
                                                            {field.value
                                                                ? cinemas.find((c) => c.id === field.value)?.name || "Chọn rạp..."
                                                                : "Chọn rạp (hoặc để trống cho Admin/Moderator)"}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-full p-0">
                                                        <Command>
                                                            <CommandInput
                                                                placeholder="Tìm rạp theo tên..."
                                                                value={cinemaSearch}
                                                                onValueChange={setCinemaSearch}
                                                            />
                                                            <CommandList className="max-h-[300px] overflow-y-auto"> {/* ← THÊM DÒNG NÀY */}
                                                                <CommandEmpty>Không tìm thấy rạp nào.</CommandEmpty>
                                                                <CommandGroup>
                                                                    <CommandItem
                                                                        value="none"
                                                                        onSelect={() => {
                                                                            field.onChange(null)
                                                                            setOpenCinema(false)
                                                                            setCinemaSearch("")
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                field.value == null ? "opacity-100" : "opacity-0"
                                                                            )}
                                                                        />
                                                                        Không thuộc rạp nào (Admin/Moderator)
                                                                    </CommandItem>

                                                                    {filteredCinemas.map((c) => (
                                                                        <CommandItem
                                                                            key={c.id}
                                                                            value={c.name}
                                                                            onSelect={() => {
                                                                                field.onChange(c.id)
                                                                                setOpenCinema(false)
                                                                                setCinemaSearch("")
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    field.value === c.id ? "opacity-100" : "opacity-0"
                                                                                )}
                                                                            />
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
                                    <FormField control={form.control} name="active" render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 col-span-2">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Trạng thái tài khoản</FormLabel>
                                                <div className="text-sm text-muted-foreground">
                                                    {field.value ? "Đang hoạt động" : "Đã khóa"}
                                                </div>
                                            </div>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                        </FormItem>
                                    )} />
                                </>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Hủy
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                Lưu thay đổi
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}