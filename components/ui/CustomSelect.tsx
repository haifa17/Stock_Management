"use client"

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  id: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  className?: string
}

export function CustomSelect({ id, value, options, onChange, className = "" }: SelectProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${className}`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}