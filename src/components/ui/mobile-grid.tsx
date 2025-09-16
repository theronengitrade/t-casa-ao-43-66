import * as React from "react"
import { cn } from "@/lib/utils"

export interface MobileGridProps {
  children: React.ReactNode
  className?: string
  cols?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  gap?: string
}

export function MobileGrid({ 
  children, 
  className, 
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = "1rem"
}: MobileGridProps) {
  const gridClass = cn(
    "grid",
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
    <div className={gridClass} style={{ gap }}>
      {children}
    </div>
  )
}

export interface MobileStatsGridProps {
  children: React.ReactNode
  className?: string
}

export function MobileStatsGrid({ children, className }: MobileStatsGridProps) {
  return (
    <MobileGrid 
      cols={{ mobile: 1, tablet: 2, desktop: 4 }}
      gap="0.75rem"
      className={cn("mb-6", className)}
    >
      {children}
    </MobileGrid>
  )
}