"use client"

import { CalendarIcon, Clock, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import { Button } from "~/components/ui/button"
import { Calendar } from "~/components/ui/calendar"
import { useState } from "react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form"

type Props = {
    form: any
}

const TIME_SLOTS = [
    "08:00", "09:00", "10:00", "11:00",
    "12:00", "13:00", "14:00", "15:00",
    "16:00", "17:00", "18:00", "19:00",
    "20:00", "21:00", "22:00"
]

export function AdvancedShowtimePicker({ form }: Props) {
    const [open, setOpen] = useState(false)

    return (
        <div className="space-y-6">

            {/* ======================== DATE RANGE ======================== */}
            <FormField
                control={form.control}
                name="dateRange"
                render={({ field }) => (
                    <FormItem className="space-y-2">
                        <FormLabel className="font-medium text-base">Khoảng ngày chiếu</FormLabel>

                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full justify-between font-normal"
                                >
                                    {field.value?.from ? (
                                        field.value.to ? (
                                            `${format(field.value.from, "dd/MM/yyyy")} → ${format(field.value.to, "dd/MM/yyyy")}`
                                        ) : (
                                            format(field.value.from, "dd/MM/yyyy")
                                        )
                                    ) : (
                                        "Chọn khoảng ngày"
                                    )}
                                    <CalendarIcon className="h-4 w-4 opacity-60" />
                                </Button>
                            </PopoverTrigger>

                            <PopoverContent className="p-4" align="start">
                                <Calendar
                                    locale={vi}
                                    mode="range"
                                    numberOfMonths={2}
                                    selected={field.value}
                                    onSelect={(v) => field.onChange(v)}
                                    defaultMonth={field.value?.from}
                                />

                                {/* Presets */}
                                <div className="border-t mt-4 pt-4 space-y-2">
                                    <p className="font-medium text-sm text-muted-foreground">
                                        Lựa chọn nhanh
                                    </p>
                                    <div className="flex gap-2 flex-wrap">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => {
                                                const today = new Date()
                                                field.onChange({
                                                    from: today,
                                                    to: today
                                                })
                                                setOpen(false)
                                            }}
                                        >
                                            Hôm nay
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => {
                                                const start = new Date()
                                                const end = new Date()
                                                end.setDate(start.getDate() + 7)
                                                field.onChange({ from: start, to: end })
                                                setOpen(false)
                                            }}
                                        >
                                            7 ngày tới
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => {
                                                const start = new Date()
                                                const end = new Date()
                                                end.setDate(start.getDate() + 30)
                                                field.onChange({ from: start, to: end })
                                                setOpen(false)
                                            }}
                                        >
                                            30 ngày tới
                                        </Button>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>

                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* ======================== TIME SLOTS ======================== */}
            <FormField
                control={form.control}
                name="timeSlots"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormLabel className="font-medium text-base">
                            Giờ chiếu
                        </FormLabel>

                        <div className="grid grid-cols-4 gap-2">
                            {TIME_SLOTS.map(time => {
                                const isSelected = field.value?.includes(time)

                                return (
                                    <Button
                                        key={time}
                                        type="button"
                                        variant={isSelected ? "default" : "outline"}
                                        className={`w-full ${isSelected ? "bg-primary text-white" : ""}`}
                                        onClick={() => {
                                            const next = isSelected
                                                ? field.value.filter((t: string) => t !== time)
                                                : [...field.value, time]
                                            field.onChange(next)
                                        }}
                                    >
                                        <Clock className="w-3 h-3 mr-1" /> {time}
                                    </Button>
                                )
                            })}
                        </div>

                        {/* Selected preview */}
                        {field.value?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {field.value.map((time: string) => (
                                    <div
                                        key={time}
                                        className="flex items-center px-2 py-1 bg-primary/10 rounded-full text-sm"
                                    >
                                        {time}
                                        <X
                                            className="w-4 h-4 ml-1 cursor-pointer"
                                            onClick={() =>
                                                field.onChange(field.value.filter((t: string) => t !== time))
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    )
}
