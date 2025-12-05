// ~/components/movie/ActorMultiCombobox.tsx
import { useState, useEffect } from "react"
import { Button } from "~/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "~/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import { Badge } from "~/components/ui/badge"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { getActors } from "~/lib/api/movieApi"
import type { Actor } from "~/lib/api/types"

interface ActorMultiComboboxProps {
  value: Actor[]
  onChange: (actors: Actor[]) => void
}

export function ActorMultiCombobox({ value, onChange }: ActorMultiComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [actors, setActors] = useState<Actor[]>([])

  useEffect(() => {
    if (!open) return
    const fetch = async () => {
      const res = await getActors({ search: search || undefined, limit: 50 })
      setActors(res.data.rows)
    }
    fetch()
  }, [search, open])

  const toggleActor = (actor: Actor) => {
    const exists = value.some(a => a.id === actor.id || a.name === actor.name)
    if (exists) {
      onChange(value.filter(a => a.id !== actor.id && a.name !== actor.name))
    } else {
      onChange([...value, actor])
    }
  }

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            {value.length > 0 ? `${value.length} diễn viên được chọn` : "Chọn diễn viên..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Tìm diễn viên..." value={search} onValueChange={setSearch} />
            <CommandEmpty>Không tìm thấy</CommandEmpty>
            <CommandGroup className="max-h-60 overflow-auto">
              {actors.map((actor) => {
                const isSelected = value.some(a => a.id === actor.id || a.name === actor.name)
                return (
                  <CommandItem key={actor.id || actor.name} onSelect={() => toggleActor(actor)}>
                    <Check className={`mr-2 h-4 w-4 ${isSelected ? "opacity-100" : "opacity-0"}`} />
                    {actor.name}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {value.map((actor) => (
            <Badge key={actor.id || actor.name} variant="secondary">
              {actor.name}
              <button
                type="button"
                className="ml-2"
                onClick={() => onChange(value.filter(a => a.id !== actor.id && a.name !== actor.name))}
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