"use client"

import * as React from "react"
import { CarrotIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Group {
  label: string
  items: Item[]
}

interface Item {
  value: string
  label: string
}

interface SearchableSelectProps {
  placeholder: string
  value: string
  onChange: (value: string) => void
  groups?: Group[]
  items?: Item[]
}

export function SearchableSelect({
  placeholder,
  value,
  onChange,
  groups,
  items
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const filterItems = (items: Item[]) =>
    items.filter(item =>
      item.label.toLowerCase().includes(search.toLowerCase())
    )

  const selectedLabel = React.useMemo(() => {
    if (!value) return placeholder
    if (items) {
      return items.find(item => item.value === value)?.label
    }
    if (groups) {
      for (const group of groups) {
        const item = group.items.find(item => item.value === value)
        if (item) return item.label
      }
    }
    return placeholder
  }, [value, items, groups, placeholder])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {selectedLabel}
          <CarrotIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput
            placeholder={`Search ${placeholder.toLowerCase()}...`}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {groups ? (
              groups.map(group => (
                <CommandGroup key={group.label} heading={group.label}>
                  {filterItems(group.items).map(item => (
                    <CommandItem
                      key={item.value}
                      onSelect={() => {
                        onChange(item.value)
                        setOpen(false)
                      }}
                    >
                      {item.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))
            ) : items ? (
              <CommandGroup>
                {filterItems(items).map(item => (
                  <CommandItem
                    key={item.value}
                    onSelect={() => {
                      onChange(item.value)
                      setOpen(false)
                    }}
                  >
                    {item.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}