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
  const isValid = text.trim().length >= 3 && text.length <= 5000

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
      const msg = err instanceof Error ? err.message : "Unable to submit grievance. Please try again."
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submittedResult) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-card border border-emerald-200 rounded-xl p-6 shadow-md space-y-5">
          <div className="flex items-center space-x-3 text-emerald-600">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-lg">
              ✓
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Grievance Submitted Successfully!</h2>
              <p className="text-xs text-muted-foreground">
                Your complaint has been automatically processed, categorized, and dispatched.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/40 rounded-lg text-sm">
            <div>
              <span className="text-xs text-muted-foreground block font-medium">Grievance Number</span>
              <strong className="text-base text-primary font-mono">{submittedResult.grievance_number}</strong>
            </div>

            <div>
              <span className="text-xs text-muted-foreground block font-medium">Status</span>
              <StatusBadge status={submittedResult.status} />
            </div>

            <div>
              <span className="text-xs text-muted-foreground block font-medium">Auto-Classified Category</span>
              <span className="font-semibold text-foreground">{submittedResult.category}</span>
            </div>

            <div>
              <span className="text-xs text-muted-foreground block font-medium">Assigned Department</span>
              <span className="font-semibold text-foreground">
                {submittedResult.department?.name || submittedResult.category}
              </span>
            </div>

            <div>
              <span className="text-xs text-muted-foreground block font-medium">Priority Level</span>
              <PriorityBadge priority={submittedResult.priority} />
            </div>

            <div>
              <span className="text-xs text-muted-foreground block font-medium">Detected Language</span>
              <span className="font-medium text-foreground">{submittedResult.detected_language || "English"}</span>
            </div>
          </div>

          <div className="border-t pt-4 flex flex-wrap gap-3">
            <Button onClick={() => navigate(`/citizen/grievances/${submittedResult.id}`)}>
              Track Grievance Details
            </Button>
            <Button variant="outline" onClick={() => { setSubmittedResult(null); setText(""); }}>
              Submit Another Complaint
            </Button>
            <Button variant="ghost" onClick={() => navigate("/citizen/grievances")}>
              View All Grievances
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Submit New Grievance</h2>
        <p className="text-sm text-muted-foreground">
          Describe your complaint in any official Indian language or English. Our AI microservice will automatically detect language, translate, determine priority, and route it to the appropriate department.
        </p>
      </div>

      {error && (
        <div className="p-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
          <strong>Submission Error:</strong> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-card border rounded-xl p-6 shadow-sm space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-semibold leading-none flex justify-between">
            <span>Complaint Description *</span>
            <span className={`text-xs font-mono ${charCount > 5000 ? "text-rose-600 font-bold" : "text-muted-foreground"}`}>
              {charCount} / 5000 chars
            </span>
          </label>
          <textarea
            required
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste your complaint details here... (e.g. There has been no water supply in our locality for 3 days.)"
            className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
          />
          {text.length > 0 && text.trim().length < 3 && (
            <p className="text-xs text-rose-600 font-medium">Minimum 3 characters required.</p>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 space-y-1">
          <p className="font-semibold">AI Automated Dispatch Pipeline Active:</p>
          <p>You do not need to manually choose department, priority, or category. Our AI pipeline handles routing automatically upon submission.</p>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/citizen/dashboard")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!isValid || isSubmitting}>
            {isSubmitting ? "Analyzing & Submitting..." : "Submit Grievance"}
          </Button>
        </div>
      </form>
    </div>
  )
}
