"use client"

interface QuarterBarProps {
  quarter: number
  isActive: boolean
  year: number
  isAdmin?: boolean
  onToggle?: (quarter: number) => void
}

export default function QuarterBar({ 
  quarter, 
  isActive, 
  year, 
  isAdmin = false,
  onToggle 
}: QuarterBarProps) {
  const handleClick = () => {
    if (isAdmin && onToggle) {
      onToggle(quarter)
    }
  }

  return (
    <div className="flex items-center justify-center">
      {isActive ? (
        <div
          onClick={handleClick}
          className={`h-7 w-full rounded-md border border-[hsl(var(--roadmap-accent-brand))]/80 bg-[hsl(var(--roadmap-accent-brand))] ${
            isAdmin ? "cursor-pointer transition-colors hover:bg-[hsl(var(--roadmap-accent-brand))]/90" : ""
          }`}
          title={isAdmin ? "Click to toggle" : ""}
        ></div>
      ) : (
        <div
          onClick={handleClick}
          className={`h-7 w-full rounded-md border border-[hsl(var(--roadmap-border-default))] bg-[hsl(var(--roadmap-surface-subtle))] ${
            isAdmin ? "cursor-pointer transition-colors hover:border-[hsl(var(--roadmap-accent-brand))]/30 hover:bg-[hsl(var(--roadmap-accent-brand))]/10" : ""
          }`}
          title={isAdmin ? "Click to toggle" : ""}
        ></div>
      )}
    </div>
  )
}
