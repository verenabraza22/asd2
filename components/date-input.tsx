'use client'

import { cn } from '@/lib/utils'

interface DateInputProps {
  value: string
  onChange: (value: string) => void
  id?: string
  className?: string
  placeholder?: string
}

/** Masked numeric input that enforces a DD/MM/AAAA format with fixed slashes. */
export function DateInput({
  value,
  onChange,
  id,
  className,
  placeholder = 'DD/MM/AAAA',
}: DateInputProps) {
  function handleChange(raw: string) {
    // Keep only digits, cap at 8 (DDMMYYYY)
    const digits = raw.replace(/\D/g, '').slice(0, 8)
    let out = digits
    if (digits.length > 4) {
      out = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
    } else if (digits.length > 2) {
      out = `${digits.slice(0, 2)}/${digits.slice(2)}`
    }
    onChange(out)
  }

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm tabular-nums outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/30',
        className,
      )}
    />
  )
}
