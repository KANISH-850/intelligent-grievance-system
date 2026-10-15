import React from "react"
import type { Status } from "@/shared/types/grievance"

interface StatusBadgeProps {
  status: Status
  className?: string
}

const BADGE_CONFIG: Record<Status, { classes: string; dot: string; label: string }> = {
  SUBMITTED:    { classes: "bg-blue-50  text-blue-700   border-blue-200",   dot: "bg-blue-500",   label: "Submitted" },
  ASSIGNED:     { classes: "bg-violet-50 text-violet-700 border-violet-200",dot: "bg-violet-500", label: "Assigned" },
  UNDER_REVIEW: { classes: "bg-amber-50 text-amber-700  border-amber-200",  dot: "bg-amber-500",  label: "Under Review" },
  IN_PROGRESS:  { classes: "bg-indigo-50 text-indigo-700 border-indigo-200",dot: "bg-indigo-500", label: "In Progress" },
  RESOLVED:     { classes: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", label: "Resolved" },
  REJECTED:     { classes: "bg-rose-50  text-rose-700   border-rose-200",   dot: "bg-rose-500",   label: "Rejected" },
}

const DEFAULT_CONFIG = {
  classes: "bg-muted text-muted-foreground border-border",
  dot:     "bg-muted-foreground",
  label:   "",
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = "" }) => {
  const config = BADGE_CONFIG[status] ?? DEFAULT_CONFIG
  const label  = config.label || status.replace(/_/g, " ")

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.classes} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`} />
      {label}
    </span>
  )
}
