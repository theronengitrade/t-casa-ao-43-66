import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export interface ResponsiveFormProps {
  children: React.ReactNode
  className?: string
  title?: string
  description?: string
  onSubmit?: (event: React.FormEvent) => void
}

export interface ResponsiveFormRowProps {
  children: React.ReactNode
  className?: string
  columns?: number
}

export interface ResponsiveFormFieldProps {
  children: React.ReactNode
  label?: string
  description?: string
  error?: string
  required?: boolean
  className?: string
}

export interface ResponsiveFormActionsProps {
  children: React.ReactNode
  className?: string
  align?: "left" | "center" | "right"
}

export function ResponsiveForm({ 
  children, 
  className, 
  title, 
  description, 
  onSubmit 
}: ResponsiveFormProps) {
  const content = (
    <form onSubmit={onSubmit} className={cn("mobile-form space-y-4 sm:space-y-6", className)}>
      {children}
    </form>
  )

  if (title || description) {
    return (
      <Card className="mobile-card w-full">
        <CardHeader>
          {title && <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </CardHeader>
        <CardContent>
          {content}
        </CardContent>
      </Card>
    )
  }

  return content
}

export function ResponsiveFormRow({ 
  children, 
  className, 
  columns = 1 
}: ResponsiveFormRowProps) {
  const gridClass = cn(
    "grid gap-4 sm:gap-6",
    columns === 1 && "grid-cols-1",
    columns === 2 && "grid-cols-1 sm:grid-cols-2",
    columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    columns === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    className
  )

  return (
    <div className={gridClass}>
      {children}
    </div>
  )
}

export function ResponsiveFormField({ 
  children, 
  label, 
  description, 
  error, 
  required = false,
  className 
}: ResponsiveFormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {children}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}

export function ResponsiveFormActions({ 
  children, 
  className, 
  align = "left" 
}: ResponsiveFormActionsProps) {
  const alignClass = cn(
    "flex gap-2 pt-4",
    align === "left" && "justify-start",
    align === "center" && "justify-center",
    align === "right" && "justify-end",
    "mobile-button-stack",
    className
  )

  return (
    <div className={alignClass}>
      {children}
    </div>
  )
}

// Pre-configured form layouts
export interface QuickFormProps {
  title?: string
  description?: string
  fields: {
    name: string
    label: string
    type?: string
    placeholder?: string
    required?: boolean
    description?: string
    options?: { label: string; value: string }[]
  }[]
  onSubmit: (data: Record<string, any>) => void
  submitLabel?: string
  cancelLabel?: string
  onCancel?: () => void
  loading?: boolean
}

export function QuickForm({
  title,
  description,
  fields,
  onSubmit,
  submitLabel = "Guardar",
  cancelLabel = "Cancelar",
  onCancel,
  loading = false
}: QuickFormProps) {
  const [formData, setFormData] = React.useState<Record<string, any>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <ResponsiveForm title={title} description={description} onSubmit={handleSubmit}>
      <ResponsiveFormRow columns={fields.length > 2 ? 2 : 1}>
        {fields.map((field) => (
          <ResponsiveFormField
            key={field.name}
            label={field.label}
            description={field.description}
            required={field.required}
          >
            {field.type === "select" && field.options ? (
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background mobile-form-element"
                value={formData[field.name] || ""}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                required={field.required}
              >
                <option value="">Selecionar...</option>
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : field.type === "textarea" ? (
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background mobile-form-element"
                placeholder={field.placeholder}
                value={formData[field.name] || ""}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                required={field.required}
              />
            ) : (
              <input
                type={field.type || "text"}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background mobile-form-element"
                placeholder={field.placeholder}
                value={formData[field.name] || ""}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                required={field.required}
              />
            )}
          </ResponsiveFormField>
        ))}
      </ResponsiveFormRow>

      <ResponsiveFormActions align="right">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "A guardar..." : submitLabel}
        </Button>
      </ResponsiveFormActions>
    </ResponsiveForm>
  )
}