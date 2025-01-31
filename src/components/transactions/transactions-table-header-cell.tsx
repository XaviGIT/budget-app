"use client"

import { TableHead } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ArrowUpDown, ArrowUp, ArrowDown, X } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

interface TableHeaderCellProps {
  column: string
  title: string
  defaultSort?: boolean // Add this to identify the default sort column (date)
}

export function TableHeaderCell({ column, title, defaultSort }: TableHeaderCellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  const [filterValue, setFilterValue] = useState(searchParams.get(`filter_${column}`) || "")

  const currentSort = searchParams.get("sort")
  const [field, order] = (currentSort || "").split("_")
  const isCurrentSortField = field === column

  // // Function to remove emojis for sorting
  // const removeEmojis = (str: string) => {
  //   return str.replace(/[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]/gu, '').trim()
  // }

  const createQueryString = (params: Record<string, string | null>) => {
    const newSearchParams = new URLSearchParams(searchParams.toString())

    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        newSearchParams.delete(key)
      } else {
        newSearchParams.set(key, value)
      }
    })

    return newSearchParams.toString()
  }

  const handleSort = (direction: "asc" | "desc" | null) => {
    if (direction === null) {
      // If clearing sort and this isn't the default sort column,
      // revert to default date sort
      const query = createQueryString({
        sort: defaultSort ? null : 'date_desc'
      })
      router.push(`${pathname}?${query}`)
      return
    }

    const query = createQueryString({
      sort: `${column}_${direction}`
    })
    router.push(`${pathname}?${query}`)
  }

  const handleFilter = (value: string) => {
    const query = createQueryString({
      [`filter_${column}`]: value || null
    })
    router.push(`${pathname}?${query}`)
  }

  // Get the appropriate sort icon and color
  const getSortIcon = () => {
    if (!isCurrentSortField) return <ArrowUpDown className="h-4 w-4" />
    if (order === 'asc') return <ArrowUp className="h-4 w-4 text-primary" />
    return <ArrowDown className="h-4 w-4 text-primary" />
  }

  // Handle click on the header
  const handleHeaderClick = () => {
    if (!isCurrentSortField) {
      handleSort("asc")
    } else if (order === "asc") {
      handleSort("desc")
    } else {
      handleSort(null)
    }
  }

  return (
    <TableHead>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={`h-8 flex gap-2 items-center data-[state=open]:bg-accent ${
              isCurrentSortField ? 'text-primary font-medium' : ''
            }`}
            onClick={(e) => {
              // If clicking the button itself (not the dropdown arrow), handle sort
              if (e.target === e.currentTarget) {
                e.preventDefault()
                e.stopPropagation()
                handleHeaderClick()
              }
            }}
          >
            {title}
            {getSortIcon()}
            {filterValue && (
              <X
                className="h-4 w-4 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation()
                  setFilterValue("")
                  handleFilter("")
                }}
              />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[200px]">
          <div className="p-2">
            <Input
              placeholder={`Filter ${title.toLowerCase()}...`}
              value={filterValue}
              onChange={(e) => {
                setFilterValue(e.target.value)
                handleFilter(e.target.value)
              }}
              className="h-8"
            />
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => handleSort("asc")}
            className={order === "asc" && isCurrentSortField ? "bg-accent" : ""}
          >
            Sort A-Z
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleSort("desc")}
            className={order === "desc" && isCurrentSortField ? "bg-accent" : ""}
          >
            Sort Z-A
          </DropdownMenuItem>
          {isCurrentSortField && (
            <DropdownMenuItem onClick={() => handleSort(null)}>
              Clear sort
            </DropdownMenuItem>
          )}
          {filterValue && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setFilterValue("")
                  handleFilter("")
                }}
              >
                Clear filter
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </TableHead>
  )
}