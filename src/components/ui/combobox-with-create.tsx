"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command"

interface ComboboxWithCreateProps {
  placeholder: string
  value?: string
  onChange: (value: string) => void
  onCreateNew: (value: string) => Promise<string>
  options: { value: string; label: string }[]
}

export function ComboboxWithCreate({
  placeholder,
  value,
  onChange,
  onCreateNew,
  options = [],
}: ComboboxWithCreateProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const cleanText = (text: string) => {
    return text
      .replace(/[\p{Emoji}\s]+/gu, '')
      .toLowerCase()
      .trim()
  }

  const filteredOptions = React.useMemo(() => {
    if (!inputValue) return options
    const searchValue = cleanText(inputValue)
    return options.filter((option) =>
      cleanText(option.label).includes(searchValue)
    )
  }, [options, inputValue])

  const handleCreateNew = async () => {
    if (!inputValue) return
    setIsCreating(true)
    try {
      const newId = await onCreateNew(inputValue)
      onChange(newId)
      setOpen(false)
      setInputValue("")
    } finally {
      setIsCreating(false)
    }
  }

  const selectedItem = React.useMemo(() =>
    options.find((item) => item.value === value),
    [options, value]
  )

  // Handle keyboard focus
  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault()
      setOpen(true)
      // Use setTimeout to ensure the popover is open before focusing
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          onKeyDown={handleTriggerKeyDown}
        >
          {selectedItem?.label || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            ref={inputRef}
            placeholder={`Search ${placeholder.toLowerCase()}...`}
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty className="py-2">
              {inputValue && (
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={handleCreateNew}
                  disabled={isCreating}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create "{inputValue}"
                </Button>
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}