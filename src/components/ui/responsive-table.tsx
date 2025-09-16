import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

export interface ResponsiveTableProps {
  children: React.ReactNode
  className?: string
}

export interface ResponsiveTableHeaderProps {
  children: React.ReactNode
  className?: string
}

export interface ResponsiveTableBodyProps {
  children: React.ReactNode
  className?: string
}

export interface ResponsiveTableRowProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export interface ResponsiveTableCellProps {
  children: React.ReactNode
  className?: string
  header?: boolean
  mobileLabel?: string
}

// Main responsive table wrapper
export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Desktop view */}
      <div className="hidden md:block mobile-table-wrapper">
        <table className="w-full border-collapse">
          {children}
        </table>
      </div>

      {/* Mobile view */}
      <div className="md:hidden space-y-3">
        {children}
      </div>
    </div>
  )
}

export function ResponsiveTableHeader({ children, className }: ResponsiveTableHeaderProps) {
  return (
    <thead className={cn("hidden md:table-header-group", className)}>
      {children}
    </thead>
  )
}

export function ResponsiveTableBody({ children, className }: ResponsiveTableBodyProps) {
  return (
    <tbody className={cn("md:table-row-group", className)}>
      {children}
    </tbody>
  )
}

export function ResponsiveTableRow({ children, className, onClick }: ResponsiveTableRowProps) {
  return (
    <>
      {/* Desktop row */}
      <tr 
        className={cn(
          "hidden md:table-row border-b hover:bg-muted/50 transition-colors",
          onClick && "cursor-pointer",
          className
        )}
        onClick={onClick}
      >
        {children}
      </tr>

      {/* Mobile card */}
      <Card 
        className={cn(
          "md:hidden mobile-card",
          onClick && "cursor-pointer",
          className
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="space-y-2">
            {children}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export function ResponsiveTableCell({ children, className, header = false, mobileLabel }: ResponsiveTableCellProps) {
  if (header) {
    return (
      <th className={cn(
        "h-12 px-4 text-left align-middle font-medium text-muted-foreground border-b",
        className
      )}>
        {children}
      </th>
    )
  }

  return (
    <>
      {/* Desktop cell */}
      <td className={cn(
        "hidden md:table-cell p-4 align-middle border-b",
        className
      )}>
        {children}
      </td>

      {/* Mobile row item */}
      <div className={cn("md:hidden flex justify-between items-center", className)}>
        {mobileLabel && (
          <span className="text-sm font-medium text-muted-foreground">
            {mobileLabel}:
          </span>
        )}
        <span className="text-sm">{children}</span>
      </div>
    </>
  )
}

// Responsive data table component
export interface ResponsiveDataTableProps<T> {
  data: T[]
  columns: {
    header: string
    accessorKey: string
    cell?: (item: T) => React.ReactNode
    mobileLabel?: string
  }[]
  onRowClick?: (item: T) => void
  className?: string
  emptyMessage?: string
}

export function ResponsiveDataTable<T>({ 
  data, 
  columns, 
  onRowClick, 
  className,
  emptyMessage = "Nenhum item encontrado."
}: ResponsiveDataTableProps<T>) {
  if (data.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <ResponsiveTable className={className}>
      <ResponsiveTableHeader>
        <ResponsiveTableRow>
          {columns.map((column, index) => (
            <ResponsiveTableCell key={index} header>
              {column.header}
            </ResponsiveTableCell>
          ))}
        </ResponsiveTableRow>
      </ResponsiveTableHeader>
      <ResponsiveTableBody>
        {data.map((item, rowIndex) => (
          <ResponsiveTableRow 
            key={rowIndex} 
            onClick={() => onRowClick?.(item)}
          >
            {columns.map((column, colIndex) => (
              <ResponsiveTableCell 
                key={colIndex}
                mobileLabel={column.mobileLabel || column.header}
              >
                {column.cell 
                  ? column.cell(item) 
                  : String((item as any)[column.accessorKey] || '-')
                }
              </ResponsiveTableCell>
            ))}
          </ResponsiveTableRow>
        ))}
      </ResponsiveTableBody>
    </ResponsiveTable>
  )
}