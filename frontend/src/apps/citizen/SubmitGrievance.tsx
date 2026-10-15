import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { submitGrievanceApi } from "@/core/api/grievanceApi"
import type { Grievance } from "@/shared/types/grievance"
import { StatusBadge } from "@/shared/ui/StatusBadge"
import { PriorityBadge } from "@/shared/ui/PriorityBadge"
import { Button } from "@/shared/ui/button"

export function SubmitGrievance() {
  const navigate = useNavigate()
  const [text, setText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submittedResult, setSubmittedResult] = useState<Grievance | null>(null)

  const charCount = text.length
  const isValid   = text.trim().length >= 3 && text.length <= 5000

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    setError(null)
    setIsSubmitting(true)
    try {
      const res = await submitGrievanceApi(text.trim())
      if (res.success && res.data) {
        setSubmittedResult(res.data)
      } else {
        throw new Error(res.message || "Failed to submit grievance.")
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to submit grievance. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  /* ── Success screen ──────────────────────────────────── */
  if (submittedResult) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="section-card border-emerald-200 space-y-5">
          {/* Success header */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Grievance Submitted Successfully</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your complaint has been automatically processed, categorized, and dispatched by the AI pipeline.
              </p>
            </div>
          </div>

          {/* Details grid */}
          <div className="rounded-xl bg-muted/40 border p-4 grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-muted-foreground font-medium block mb-1">Grievance Number</span>
              <span className="font-mono font-bold text-primary text-base">{submittedResult.grievance_number}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-medium block mb-1">Status</span>
              <StatusBadge status={submittedResult.status} />
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-medium block mb-1">Auto-Classified Category</span>
              <span className="font-semibold text-foreground">{submittedResult.category}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-medium block mb-1">Assigned Department</span>
              <span className="font-semibold text-foreground">
                {submittedResult.department?.name || submittedResult.category}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-medium block mb-1">Priority Level</span>
              <PriorityBadge priority={submittedResult.priority} />
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-medium block mb-1">Detected Language</span>
              <span className="font-medium text-foreground">{submittedResult.detected_language || "English"}</span>
            </div>
          </div>

          <div className="border-t pt-4 flex flex-wrap gap-3">
            <Button id="track-grievance-btn" onClick={() => navigate(`/citizen/grievances/${submittedResult.id}`)}>
              Track Grievance
            </Button>
            <Button variant="outline" onClick={() => { setSubmittedResult(null); setText("") }}>
              Submit Another
            </Button>
            <Button variant="ghost" onClick={() => navigate("/citizen/grievances")}>
              View All Grievances
            </Button>
          </div>
        </div>
      </div>
    )
  }

  /* ── Form ────────────────────────────────────────────── */
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">Submit New Grievance</h1>
        <p className="page-subtitle mt-1">
          Describe your complaint in any official Indian language or English. Our AI pipeline detects language, translates, determines priority, and routes automatically.
        </p>
      </div>

      {error && (
        <div className="error-banner flex items-start gap-3">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-semibold">Submission Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="section-card space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="grievance-text" className="form-label mb-0">
              Complaint Description <span className="text-rose-500">*</span>
            </label>
            <span className={`text-xs font-mono ${charCount > 5000 ? "text-rose-600 font-bold" : "text-muted-foreground"}`}>
              {charCount} / 5000
            </span>
          </div>
          <textarea
            id="grievance-text"
            required
            rows={7}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste your complaint here… (e.g., There has been no water supply in our locality for 3 days.)"
            className="form-textarea"
          />
          {text.length > 0 && text.trim().length < 3 && (
            <p className="text-xs text-rose-600">Minimum 3 characters required.</p>
          )}
        </div>

        {/* AI pipeline info */}
        <div className="info-banner flex items-start gap-3">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold text-sky-800 mb-0.5">AI Automated Dispatch Active</p>
            <p className="text-sky-700">
              No manual selection required — category, priority, and department are assigned automatically. You may write in Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Gujarati, Marathi, Punjabi, Urdu, or English.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/citizen/dashboard")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            id="grievance-submit-btn"
            type="submit"
            disabled={!isValid || isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="spinner w-4 h-4" />
                Analyzing & Submitting…
              </>
            ) : (
              "Submit Grievance"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
