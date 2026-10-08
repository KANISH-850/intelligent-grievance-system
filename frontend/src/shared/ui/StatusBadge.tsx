import React from "react"
import type { Status } from "@/shared/types/grievance"

interface StatusBadgeProps {
  status: Status
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = "" }) => {
  const getBadgeStyle = (st: Status) => {
    switch (st) {
      case "SUBMITTED":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "ASSIGNED":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "UNDER_REVIEW":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "IN_PROGRESS":
        return "bg-indigo-100 text-indigo-800 border-indigo-200"
      case "RESOLVED":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "REJECTED":
        return "bg-rose-100 text-rose-800 border-rose-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatText = (st: string) => {
    return st.replace("_", " ")
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadgeStyle(
        status
      )} ${className}`}
    >
      {formatText(status)}
    </span>
  )
}
