import * as React from "react"
import { cn } from "@/lib/utils"

export interface StepsProps {
  className?: string
  children?: React.ReactNode
}

const Steps = React.forwardRef<HTMLDivElement, StepsProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center space-x-4", className)}
      {...props}
    />
  )
)
Steps.displayName = "Steps"

export { Steps }