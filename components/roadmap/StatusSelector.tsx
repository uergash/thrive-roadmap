"use client"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const STATUS_OPTIONS = [
  "Not started",
  "Discovery",
  "Design",
  "Planning",
  "Development",
  "Released",
]

interface StatusSelectorProps {
  status: string
  onStatusChange: (status: string) => void
}

export default function StatusSelector({
  status,
  onStatusChange,
}: StatusSelectorProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "Not started": "border-gray-200 bg-gray-50 text-gray-700",
      Discovery: "border-sky-200 bg-sky-50 text-sky-700",
      Design: "border-indigo-200 bg-indigo-50 text-indigo-700",
      Planning: "border-violet-200 bg-violet-50 text-violet-700",
      Development: "border-violet-300 bg-violet-200 text-violet-900",
      Released: "border-emerald-200 bg-emerald-50 text-emerald-700",
    }
    return colors[status] || "border-[hsl(var(--roadmap-border-default))] bg-[hsl(var(--roadmap-surface-subtle))] text-[hsl(var(--roadmap-text-primary))]"
  }

  return (
    <Select value={status} onValueChange={onStatusChange}>
      <SelectTrigger className={`h-8 w-auto min-w-[108px] rounded-full border text-xs font-medium focus-visible:ring-2 focus-visible:ring-[hsl(var(--roadmap-accent-brand))] ${getStatusColor(status)}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
