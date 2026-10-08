import React from "react"
import type { Status, GrievanceStatusHistory } from "@/shared/types/grievance"
import { StatusBadge } from "./StatusBadge"

interface StatusTimelineProps {
  currentStatus: Status
  history?: GrievanceStatusHistory[]
}

const WORKFLOW_STEPS: Status[] = ["SUBMITTED", "ASSIGNED", "UNDER_REVIEW", "IN_PROGRESS", "RESOLVED"]

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ currentStatus, history = [] }) => {
  const isRejected = currentStatus === "REJECTED"

  const getStepIndex = (status: Status) => {
    return WORKFLOW_STEPS.indexOf(status)
  }

  const currentIdx = getStepIndex(currentStatus)

  return (
    <div className="space-y-6">
      {/* Workflow Progress Tracker */}
      <div className="bg-card border rounded-xl p-5 shadow-sm">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Grievance Lifecycle Progression
        </h4>

        {isRejected ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-center space-y-1">
            <span className="font-bold text-rose-800 text-lg">Grievance Rejected</span>
            <p className="text-xs text-rose-600">
              This grievance has been reviewed and marked as rejected by the department officer.
            </p>
          </div>
        ) : (
          <div className="relative flex items-center justify-between w-full">
            {/* Connecting line */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-muted w-full z-0" />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary transition-all duration-300 z-0"
              style={{
                width: `${Math.max(0, (currentIdx / (WORKFLOW_STEPS.length - 1)) * 100)}%`,
              }}
            />

            {WORKFLOW_STEPS.map((step, idx) => {
              const isCompleted = currentIdx >= idx
              const isCurrent = currentStatus === step

              return (
                <div key={step} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      isCurrent
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110"
                        : isCompleted
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground border-2 border-background"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span
                    className={`text-[11px] font-medium mt-2 text-center max-w-[70px] ${
                      isCurrent ? "font-bold text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {step.replace("_", " ")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detailed Status History Audit Log */}
      <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Status Audit History
        </h4>

        {history.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No history log recorded.</p>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-muted">
            {history.map((item, index) => (
              <div key={item.id || index} className="relative group">
                {/* Bullet node */}
                <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-background" />

                <div className="bg-muted/30 border rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <StatusBadge status={item.status} />
                    <span className="text-xs text-muted-foreground font-mono">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>

                  {item.user && (
                    <p className="text-xs text-muted-foreground pt-1">
                      Updated by: <strong className="text-foreground">{item.user.name}</strong> ({item.user.role})
                    </p>
                  )}

                  {item.remarks && (
                    <div className="mt-2 p-2 bg-background border rounded text-xs text-foreground italic">
                      &quot;{item.remarks}&quot;
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
