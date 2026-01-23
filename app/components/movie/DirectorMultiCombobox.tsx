import { useState, useEffect } from "react"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "~/components/ui/command"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { getDirectors } from "~/lib/api/movieApi"
import type { Director } from "~/lib/api/types"

interface Props {
  value: Director[]
  onChange: (directors: Director[]) => void
}

export function DirectorMultiCombobox({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [directors, setDirectors] = useState<Director[]>([])

  useEffect(() => {
    if (!open) return
    getDirectors({ search: search || undefined, limit: 50 })
      .then(res => setDirectors(res.data.rows))
      .catch(console.error)
  }, [open, search])

  const toggle = (director: Director) => {
    const exists = value.some(d => d.id === director.id)
    if (exists) {
      onChange(value.filter(d => d.id !== director.id))
    } else {
      onChange([...value, director])
    }
  }

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            {value.length > 0
              ? `${value.length} đạo diễn được chọn`
              : "Chọn đạo diễn..."}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput
              placeholder="Tìm đạo diễn..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandEmpty>Không tìm thấy</CommandEmpty>
            <CommandGroup className="max-h-60 overflow-auto">
              {directors.map(d => {
                const selected = value.some(v => v.id === d.id)
                return (
                  <CommandItem key={d.id} onSelect={() => toggle(d)}>
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        selected ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    {d.name}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {value.map(d => (
            <Badge key={d.id} variant="secondary">
              {d.name}
              <button
                type="button"
                className="ml-2"
                onClick={() => onChange(value.filter(x => x.id !== d.id))}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
