import React from "react"
import type { Status, GrievanceStatusHistory } from "@/shared/types/grievance"
import { StatusBadge } from "./StatusBadge"

interface StatusTimelineProps {
  currentStatus: Status
  history?: GrievanceStatusHistory[]
}

const WORKFLOW_STEPS: Status[] = ["SUBMITTED", "ASSIGNED", "UNDER_REVIEW", "IN_PROGRESS", "RESOLVED"]

const STEP_LABELS: Record<Status, string> = {
  SUBMITTED:    "Submitted",
  ASSIGNED:     "Assigned",
  UNDER_REVIEW: "Under Review",
  IN_PROGRESS:  "In Progress",
  RESOLVED:     "Resolved",
  REJECTED:     "Rejected",
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ currentStatus, history = [] }) => {
  const isRejected = currentStatus === "REJECTED"
  const currentIdx = WORKFLOW_STEPS.indexOf(currentStatus)

  return (
    <div className="space-y-5">
      {/* Workflow progress stepper */}
      <div className="section-card space-y-5">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Grievance Lifecycle
        </h3>

        {isRejected ? (
          <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-rose-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-rose-800">Grievance Rejected</p>
              <p className="text-xs text-rose-600">Reviewed and rejected by the department officer.</p>
            </div>
          </div>
        ) : (
          <div className="relative flex items-center justify-between w-full px-2">
            {/* Track */}
            <div className="absolute left-4 right-4 top-4 h-0.5 bg-border z-0" />
            {/* Progress */}
            {currentIdx >= 0 && (
              <div
                className="absolute left-4 top-4 h-0.5 bg-primary z-0 transition-all duration-700"
                style={{
                  width: `calc(${(currentIdx / (WORKFLOW_STEPS.length - 1)) * 100}% - 2rem)`,
                }}
              />
            )}

            {WORKFLOW_STEPS.map((step, idx) => {
              const isCompleted = currentIdx >= idx
              const isCurrent   = currentStatus === step

              return (
                <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      isCurrent
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110 shadow-md"
                        : isCompleted
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border-2 border-border text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? (
                      isCurrent ? (
                        idx + 1
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-medium text-center max-w-[60px] leading-tight ${
                      isCurrent ? "font-bold text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {STEP_LABELS[step]}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Audit history log */}
      <div className="section-card space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Status Audit History
        </h3>

        {history.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No audit history recorded yet.</p>
        ) : (
          <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border">
            {history.map((item, index) => (
              <div key={item.id || index} className="relative">
                <div className="absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-[3px] ring-background" />

                <div className="bg-muted/20 border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <StatusBadge status={item.status} />
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(item.created_at).toLocaleString("en-IN")}
                    </span>
                  </div>

                  {item.user && (
                    <p className="text-[11px] text-muted-foreground">
                      Updated by:{" "}
                      <strong className="text-foreground font-semibold">{item.user.name}</strong>
                      <span className="ml-1 opacity-60">({item.user.role})</span>
                    </p>
                  )}

                  {item.remarks && (
                    <div className="mt-1 p-2.5 bg-background border rounded-md text-xs text-foreground leading-relaxed">
                      <span className="text-muted-foreground mr-1">→</span>
                      {item.remarks}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
