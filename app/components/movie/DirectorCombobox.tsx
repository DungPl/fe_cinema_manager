// ~/components/movie/DirectorCombobox.tsx
import { useState, useEffect } from "react"
import { Button } from "~/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "~/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { getDirectors } from "~/lib/api/movieApi"
import type { Director } from "~/lib/api/types"

interface DirectorComboboxProps {
  value: Director | null
  onChange: (director: Director | null) => void
  placeholder?: string
}

export function DirectorCombobox({ value, onChange, placeholder = "Chọn đạo diễn..." }: DirectorComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [directors, setDirectors] = useState<Director[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return

    const fetch = async () => {
      setLoading(true)
      try {
        const res = await getDirectors({ search: search || undefined, limit: 50 })
        setDirectors(res.data.rows)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [search, open])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between">
          {value ? value.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Tìm đạo diễn..." value={search} onValueChange={setSearch} />
          <CommandEmpty>
            <div className="py-6 text-center text-sm">
              Không tìm thấy. Nhập tên để tạo mới.
            </div>
          </CommandEmpty>
          <CommandGroup>
            {directors.map((d) => (
              <CommandItem
                key={d.id}
                onSelect={() => {
                  onChange(d)
                  setOpen(false)
                }}
              >
                <Check className={`mr-2 h-4 w-4 ${value?.id === d.id ? "opacity-100" : "opacity-0"}`} />
                {d.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}