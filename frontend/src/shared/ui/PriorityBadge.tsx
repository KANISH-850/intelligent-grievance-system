import React from "react"
import type { Priority } from "@/shared/types/grievance"

interface PriorityBadgeProps {
  priority: Priority
  className?: string
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className = "" }) => {
  const getStyle = (p: Priority) => {
    switch (p) {
      case "LOW":
        return "bg-slate-100 text-slate-700 border-slate-200"
      case "MEDIUM":
        return "bg-sky-100 text-sky-800 border-sky-200"
      case "HIGH":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "CRITICAL":
        return "bg-red-100 text-red-800 border-red-200 animate-pulse"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${getStyle(
        priority
      )} ${className}`}
    >
      {priority}
    </span>
  )
}
