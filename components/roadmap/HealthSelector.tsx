"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const HEALTH_OPTIONS = ["Not started", "On track", "At risk", "Delayed"] as const

interface HealthSelectorProps {
  health: string | null
  onHealthChange: (health: string | null) => void
  disabled?: boolean
}

export default function HealthSelector({
  health,
  onHealthChange,
  disabled,
}: HealthSelectorProps) {
  const getHealthColor = (h: string | null) => {
    if (!h) return "border-[hsl(var(--roadmap-border-default))] bg-[hsl(var(--roadmap-surface-subtle))] text-[hsl(var(--roadmap-text-muted))]"
    const colors: Record<string, string> = {
      "Not started": "border-gray-200 bg-gray-50 text-gray-700",
      "On track": "border-emerald-200 bg-emerald-50 text-emerald-700",
      "At risk": "border-amber-200 bg-amber-50 text-amber-800",
      Delayed: "border-rose-200 bg-rose-50 text-rose-700",
    }
    return colors[h] || "border-[hsl(var(--roadmap-border-default))] bg-[hsl(var(--roadmap-surface-subtle))] text-[hsl(var(--roadmap-text-primary))]"
  }

  return (
    <Select
      value={health || "none"}
      onValueChange={(v) => onHealthChange(v === "none" ? null : v)}
      disabled={disabled}
    >
      <SelectTrigger className={`h-8 w-auto min-w-[96px] rounded-full border text-xs font-medium focus-visible:ring-2 focus-visible:ring-[hsl(var(--roadmap-accent-brand))] ${getHealthColor(health)}`}>
        <SelectValue placeholder="Health" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">—</SelectItem>
        {HEALTH_OPTIONS.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
