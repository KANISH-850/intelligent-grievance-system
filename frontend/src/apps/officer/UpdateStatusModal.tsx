import React, { useState } from "react"
import type { Status } from "@/shared/types/grievance"
import { StatusBadge } from "@/shared/ui/StatusBadge"
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
  { label: "Assigned to Team",        value: "ASSIGNED" },
  { label: "Under Review",            value: "UNDER_REVIEW" },
  { label: "In Progress / Work Started", value: "IN_PROGRESS" },
  { label: "Resolved",                value: "RESOLVED" },
  { label: "Rejected / Invalid",      value: "REJECTED" },
]

export const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({
  currentStatus,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [targetStatus, setTarget] = useState<Status>(
    currentStatus === "SUBMITTED" ? "UNDER_REVIEW" : currentStatus
  )
  const [remarks, setRemarks]               = useState("")
  const [validationError, setValidationErr] = useState<string | null>(null)

  if (!isOpen) return null

  const isRemarksRequired = ["RESOLVED", "REJECTED"].includes(targetStatus)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationErr(null)

    if (targetStatus === currentStatus) {
      setValidationErr(`Grievance is already in status '${currentStatus}'. Please choose a different status.`)
      return
    }
    if (isRemarksRequired && !remarks.trim()) {
      setValidationErr(`Remarks are mandatory when setting status to ${targetStatus}.`)
      return
    }
    try {
      await onSubmit(targetStatus, remarks.trim())
    } catch (err: unknown) {
      setValidationErr(err instanceof Error ? err.message : "Failed to update status.")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-lg p-0 overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
          <div>
            <h3 className="font-bold text-base">Update Grievance Status</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Current status: <StatusBadge status={currentStatus} />
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {validationError && (
            <div className="flex items-start gap-3 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{validationError}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="form-label text-xs uppercase tracking-wider text-muted-foreground">
              New Status <span className="text-rose-500">*</span>
            </label>
            <div className="grid gap-2">
              {OFFICER_TARGET_STATUSES.map((opt) => {
                const isSelected = targetStatus === opt.value
                const isCurrent  = opt.value === currentStatus
                return (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all text-sm ${
                      isCurrent
                        ? "opacity-50 cursor-not-allowed bg-muted/30"
                        : isSelected
                        ? "border-primary bg-primary/5 font-semibold"
                        : "hover:bg-muted/20 hover:border-border/80"
                    }`}
                  >
                    <input
                      type="radio"
                      name="targetStatus"
                      value={opt.value}
                      checked={isSelected}
                      disabled={isCurrent}
                      onChange={() => setTarget(opt.value)}
                      className="accent-primary"
                    />
                    <span>{opt.label}</span>
                    {isCurrent && <span className="ml-auto text-[10px] text-muted-foreground">Current</span>}
                  </label>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="status-remarks" className="form-label text-xs uppercase tracking-wider text-muted-foreground mb-0">
                Officer Remarks {isRemarksRequired ? <span className="text-rose-500">*</span> : "(optional)"}
              </label>
              <span className="text-[10px] text-muted-foreground">{remarks.length} / 2000</span>
            </div>
            <textarea
              id="status-remarks"
              rows={4}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              maxLength={2000}
              placeholder={
                isRemarksRequired
                  ? "Describe the resolution actions taken or reasoning for rejection (required)…"
                  : "Add optional internal or departmental inspection remarks…"
              }
              className="form-textarea"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button id="confirm-status-btn" type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <span className="spinner w-4 h-4" />
                  Updating…
                </>
              ) : (
                "Confirm Status Update"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
