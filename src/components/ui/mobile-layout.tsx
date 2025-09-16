import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, RefreshCw } from "lucide-react"

export interface MobilePageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
}

export function MobilePageHeader({ title, description, children, className }: MobilePageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6", className)}>
      <div className="min-w-0 flex-1">
        <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
        {description && (
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {children}
        </div>
      )}
    </div>
  )
}

export interface MobileSearchProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function MobileSearch({ searchTerm, onSearchChange, placeholder = "Pesquisar...", className }: MobileSearchProps) {
  return (
    <div className={cn("relative w-full sm:max-w-sm", className)}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10"
      />
    </div>
  )
}

export interface MobileActionButtonsProps {
  children: React.ReactNode
  className?: string
}

export function MobileActionButtons({ children, className }: MobileActionButtonsProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row gap-3 sm:gap-4", className)}>
      {children}
    </div>
  )
}

export interface MobileAddButtonProps {
  onClick: () => void
  label: string
  loading?: boolean
  className?: string
}

export function MobileAddButton({ onClick, label, loading = false, className }: MobileAddButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={loading}
      className={cn("w-full sm:w-auto", className)}
    >
      <Plus className="h-4 w-4 mr-2" />
      <span className="sm:hidden">{label.split(' ')[0]}</span>
      <span className="hidden sm:inline">{label}</span>
    </Button>
  )
}

export interface MobileRefreshButtonProps {
  onClick: () => void
  loading?: boolean
  className?: string
}

export function MobileRefreshButton({ onClick, loading = false, className }: MobileRefreshButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={loading}
      className={cn("w-full sm:w-auto", className)}
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
      <span>Atualizar</span>
    </Button>
  )
}

export interface MobileContainerProps {
  children: React.ReactNode
  className?: string
}

export function MobileContainer({ children, className }: MobileContainerProps) {
  return (
    <div className={cn("space-y-4 sm:space-y-6 mobile-scroll", className)}>
      {children}
    </div>
  )
}

export interface MobileCardGridProps {
  children: React.ReactNode
  cols?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  className?: string
}

export function MobileCardGrid({ children, cols = { mobile: 1, tablet: 2, desktop: 3 }, className }: MobileCardGridProps) {
  const gridClass = cn(
    "grid gap-4 sm:gap-6",
    cols.mobile === 1 && "grid-cols-1",
    cols.mobile === 2 && "grid-cols-2",
    cols.tablet === 2 && "sm:grid-cols-2",
    cols.tablet === 3 && "sm:grid-cols-3",
    cols.desktop === 2 && "lg:grid-cols-2",
    cols.desktop === 3 && "lg:grid-cols-3",
    cols.desktop === 4 && "lg:grid-cols-4",
    className
  )

  return (
    <div className={gridClass}>
      {children}
    </div>
  )
}