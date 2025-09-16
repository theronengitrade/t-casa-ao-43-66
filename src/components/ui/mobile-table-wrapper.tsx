import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Edit, Trash2, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface MobileTableWrapperProps {
  children: React.ReactNode
  className?: string
}

export function MobileTableWrapper({ children, className }: MobileTableWrapperProps) {
  return (
    <div className={cn("mobile-table-wrapper", className)}>
      <div className="hidden md:block">
        {children}
      </div>
    </div>
  )
}

export interface MobileCardItemProps {
  title: string
  subtitle?: string
  badge?: {
    text: string
    variant?: "default" | "secondary" | "destructive" | "outline"
  }
  actions?: Array<{
    label: string
    icon?: React.ReactNode
    onClick: () => void
    variant?: "default" | "secondary" | "destructive" | "outline" | "ghost"
  }>
  children?: React.ReactNode
  onClick?: () => void
  className?: string
}

export function MobileCardItem({ 
  title, 
  subtitle, 
  badge, 
  actions = [], 
  children, 
  onClick, 
  className 
}: MobileCardItemProps) {
  return (
    <Card 
      className={cn(
        "md:hidden mobile-card",
        onClick && "cursor-pointer hover:shadow-md transition-shadow",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-sm leading-tight truncate">{title}</h3>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-1 truncate">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              {badge && (
                <Badge variant={badge.variant || "secondary"} className="text-xs">
                  {badge.text}
                </Badge>
              )}
              {actions.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {actions.map((action, index) => (
                      <DropdownMenuItem 
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation()
                          action.onClick()
                        }}
                      >
                        {action.icon && <span className="mr-2">{action.icon}</span>}
                        {action.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Content */}
          {children && (
            <div className="space-y-2 text-xs">
              {children}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export interface MobileTableRowWithCardProps {
  children: React.ReactNode
  cardItem: React.ReactNode
  className?: string
}

export function MobileTableRowWithCard({ children, cardItem, className }: MobileTableRowWithCardProps) {
  return (
    <>
      {/* Desktop Table Row */}
      <TableRow className={cn("hidden md:table-row", className)}>
        {children}
      </TableRow>
      
      {/* Mobile Card */}
      {cardItem}
    </>
  )
}

export interface MobileListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  renderCard: (item: T, index: number) => React.ReactNode
  emptyMessage?: string
  className?: string
}

export function MobileList<T>({ 
  items, 
  renderItem, 
  renderCard, 
  emptyMessage = "Nenhum item encontrado.",
  className 
}: MobileListProps<T>) {
  if (items.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      {/* Desktop Table */}
      <div className="hidden md:block">
        <Table>
          {items.map((item, index) => renderItem(item, index))}
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {items.map((item, index) => renderCard(item, index))}
      </div>
    </div>
  )
}