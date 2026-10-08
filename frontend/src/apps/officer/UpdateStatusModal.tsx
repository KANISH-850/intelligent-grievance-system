import React, { useState } from "react"
import type { Status } from "@/shared/types/grievance"
import { Button } from "@/shared/ui/button"

interface UpdateStatusModalProps {
  currentStatus: Status
  isOpen: boolean
  onClose: () => void
  onSubmit: (status: Status, remarks: string) => Promise<void>
  isSubmitting: boolean
}

// Allowed target statuses for Officers (no SUBMITTED allowed)
const OFFICER_TARGET_STATUSES: { label: string; value: Status }[] = [
  { label: "Assigned to Team (ASSIGNED)", value: "ASSIGNED" },
  { label: "Under Review (UNDER_REVIEW)", value: "UNDER_REVIEW" },
  { label: "In Progress / Repair Started (IN_PROGRESS)", value: "IN_PROGRESS" },
  { label: "Resolved (RESOLVED)", value: "RESOLVED" },
  { label: "Rejected / Invalid Complaint (REJECTED)", value: "REJECTED" },
]

export const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({
  currentStatus,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [targetStatus, setTargetStatus] = useState<Status>(
    currentStatus === "SUBMITTED" ? "UNDER_REVIEW" : currentStatus
  )
  const [remarks, setRemarks] = useState("")
  const [validationError, setValidationError] = useState<string | null>(null)

  if (!isOpen) return null

  const isRemarksRequired = ["RESOLVED", "REJECTED"].includes(targetStatus)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    if (targetStatus === currentStatus) {
      setValidationError(`Grievance is already in status '${currentStatus}'.`)
      return
    }

    if (isRemarksRequired && !remarks.trim()) {
      setValidationError(`Remarks are mandatory when changing status to ${targetStatus}.`)
      return
    }

    try {
      await onSubmit(targetStatus, remarks.trim())
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update status."
      setValidationError(msg)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border rounded-xl shadow-xl w-full max-w-lg p-6 space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-bold text-lg">Update Grievance Status</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>

        {validationError && (
          <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
            {validationError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Current Status</label>
            <div className="text-sm font-bold font-mono px-3 py-2 bg-muted/40 rounded border">
              {currentStatus}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase">New Target Status *</label>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value as Status)}
              className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {OFFICER_TARGET_STATUSES.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.value === currentStatus}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase flex justify-between">
              <span>Officer Action Remarks {isRemarksRequired && "*"}</span>
              <span className="text-[10px] text-muted-foreground">Max 2000 chars</span>
            </label>
            <textarea
              rows={4}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={
                isRemarksRequired
                  ? "Describe the resolution actions taken or reasoning for rejection (Required)..."
                  : "Add optional internal or departmental inspection remarks..."
              }
              className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Confirm Status Update"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
