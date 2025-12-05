import { useEffect, useState } from "react"
import { Button } from "~/components/ui/button"
import { Popover, PopoverTrigger, PopoverContent } from "~/components/ui/popover"
import { Command, CommandInput, CommandItem, CommandEmpty, CommandGroup } from "~/components/ui/command"
import { Badge } from "~/components/ui/badge"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { getFormats } from "~/lib/api/roomApi"
import type { Format } from "~/lib/api/types"

export function FormatMultiCombobox({
  value,
  onChange,
}: {
  value: Format[]
  onChange: (formats: Format[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [list, setList] = useState<Format[]>([])

  useEffect(() => {
    if (!open) return
    const fetchData = async () => {
      const res = await getFormats({ search: search || undefined, limit: 50 })
      setList(res || [])
    }
    fetchData()
  }, [search, open])

  const toggle = (item: Format) => {
    const exists = value.some((i) => i.id === item.id)
    if (exists) onChange(value.filter((i) => i.id !== item.id))
    else onChange([...value, item])
  }

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            {value.length > 0
              ? `${value.length} định dạng được chọn`
              : "Chọn định dạng..."}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput
              placeholder="Tìm định dạng..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandEmpty>Không có kết quả</CommandEmpty>

            <CommandGroup className="max-h-60 overflow-auto">
              {list.map((format) => {
                const selected = value.some((v) => v.id === format.id)
                return (
                  <CommandItem
                    key={format.id}
                    onSelect={() => toggle(format)}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        selected ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    {format.name}
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
                onClick={() =>
                  onChange(value.filter((f) => f.id !== format.id))
                }
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
