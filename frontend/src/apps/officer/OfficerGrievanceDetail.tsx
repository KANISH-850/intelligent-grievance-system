import { useEffect, useState, useCallback } from "react"
import { useParams, Link } from "react-router-dom"
import {
  getOfficerGrievanceByIdApi,
  updateOfficerGrievanceStatusApi,
} from "@/core/api/grievanceApi"
import type { Grievance, Status } from "@/shared/types/grievance"
import { StatusBadge } from "@/shared/ui/StatusBadge"
import { PriorityBadge } from "@/shared/ui/PriorityBadge"
import { StatusTimeline } from "@/shared/ui/StatusTimeline"
import { Button } from "@/shared/ui/button"
import { UpdateStatusModal } from "./UpdateStatusModal"

export function OfficerGrievanceDetail() {
  const { id } = useParams<{ id: string }>()
  const [grievance, setGrievance]     = useState<Grievance | null>(null)
  const [isLoading, setIsLoading]     = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [isModalOpen, setModalOpen]   = useState(false)
  const [isSubmitting, setSubmitting] = useState(false)
  const [actionSuccess, setSuccess]   = useState<string | null>(null)

  const loadDetail = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await getOfficerGrievanceByIdApi(id)
      if (res.success && res.data) {
        setGrievance(res.data)
      } else {
        throw new Error(res.message || "Failed to load grievance details.")
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Grievance not found or access denied.")
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (!id) return
    let isMounted = true
    getOfficerGrievanceByIdApi(id)
      .then((res) => {
        if (!isMounted) return
        if (res.success && res.data) { setGrievance(res.data); setError(null) }
        else setError(res.message || "Failed to load grievance details.")
      })
      .catch((err: unknown) => {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : "Grievance not found or access denied.")
      })
      .finally(() => { if (isMounted) setIsLoading(false) })
    return () => { isMounted = false }
  }, [id])

  const handleStatusSubmit = async (status: Status, remarks: string) => {
    if (!id) return
    setSubmitting(true)
    setSuccess(null)
    try {
      const res = await updateOfficerGrievanceStatusApi(id, status, remarks)
      if (res.success && res.data) {
        setGrievance(res.data)
        setModalOpen(false)
        setSuccess(`Status successfully updated to ${status}.`)
      } else {
        throw new Error(res.message || "Failed to update status.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="section-card">
        <div className="empty-state">
          <div className="spinner w-8 h-8 mx-auto" />
          <p className="text-sm text-muted-foreground mt-3">Loading grievance details…</p>
        </div>
      </div>
    )
  }

  if (error || !grievance) {
    return (
      <div className="error-banner space-y-3">
        <p>{error || "Grievance not found."}</p>
        <div className="flex gap-3 pt-1">
          <Button variant="outline" size="sm" onClick={loadDetail}>Retry</Button>
          <Link to="/officer/grievances">
            <Button variant="ghost" size="sm">← Back to Department List</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Success banner */}
      {actionSuccess && (
        <div className="success-banner">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-xs text-emerald-700 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 border-b pb-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/officer/grievances" className="hover:text-primary transition-colors">Department Queue</Link>
            <span>/</span>
            <span className="font-mono text-foreground font-semibold">{grievance.grievance_number}</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold font-mono text-primary">{grievance.grievance_number}</h1>
            <StatusBadge status={grievance.status} />
            <PriorityBadge priority={grievance.priority} />
            {grievance.ai_review_required && (
              <span className="px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 rounded-full animate-pulse">
                ⚠ AI Review Required
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Submitted {new Date(grievance.created_at).toLocaleString("en-IN")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button id="officer-update-status-btn" onClick={() => setModalOpen(true)}>
            Update Status
          </Button>
          <Link to="/officer/grievances">
            <Button variant="outline" className="gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left: complaint + timeline */}
        <div className="md:col-span-2 space-y-5">
          <div className="section-card space-y-4">
            <h2 className="section-title">Citizen Complaint</h2>
            <div className="p-4 bg-muted/30 border rounded-lg text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              {grievance.original_text}
            </div>

            {grievance.translated_text &&
              grievance.translated_text !== grievance.original_text && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground">
                  AI English Translation ({grievance.detected_language || "Detected"}):
                </p>
                <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg text-xs italic text-sky-900 leading-relaxed">
                  "{grievance.translated_text}"
                </div>
              </div>
            )}
          </div>

          <StatusTimeline currentStatus={grievance.status} history={grievance.status_history} />
        </div>

        {/* Right: metadata */}
        <div className="space-y-5">
          <div className="section-card space-y-4">
            <h2 className="section-title">Classification & Details</h2>
            <dl className="space-y-3 text-sm">
              <div className="border-b pb-3">
                <dt className="text-xs text-muted-foreground font-medium mb-1">Assigned Department</dt>
                <dd className="font-bold text-foreground">
                  {grievance.department?.name || grievance.category}
                  {grievance.department?.code && (
                    <span className="ml-1.5 text-xs font-mono text-muted-foreground">[{grievance.department.code}]</span>
                  )}
                </dd>
              </div>

              <div className="border-b pb-3">
                <dt className="text-xs text-muted-foreground font-medium mb-1">Classified Category</dt>
                <dd className="font-semibold">{grievance.category}</dd>
              </div>

              <div className="border-b pb-3">
                <dt className="text-xs text-muted-foreground font-medium mb-1">Priority</dt>
                <dd><PriorityBadge priority={grievance.priority} /></dd>
              </div>

              <div className="border-b pb-3">
                <dt className="text-xs text-muted-foreground font-medium mb-1">Detected Language</dt>
                <dd className="font-medium">{grievance.detected_language || "English"}</dd>
              </div>

              {grievance.ai_confidence !== null && grievance.ai_confidence !== undefined && (
                <div className="border-b pb-3">
                  <dt className="text-xs text-muted-foreground font-medium mb-1">AI Confidence</dt>
                  <dd className="flex items-center gap-2">
                    <span className="font-mono font-bold">{(grievance.ai_confidence * 100).toFixed(0)}%</span>
                    {grievance.ai_confidence_level && (
                      <span className={`px-1.5 py-0.5 text-xs font-bold rounded ${
                        grievance.ai_confidence_level === "HIGH" ? "bg-emerald-100 text-emerald-800"
                        : grievance.ai_confidence_level === "MEDIUM" ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-800"
                      }`}>{grievance.ai_confidence_level}</span>
                    )}
                  </dd>
                </div>
              )}

              {grievance.user && (
                <div className="border-b pb-3">
                  <dt className="text-xs text-muted-foreground font-medium mb-1">Complainant</dt>
                  <dd>
                    <p className="font-semibold">{grievance.user.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{grievance.user.email}</p>
                  </dd>
                </div>
              )}

              <div>
                <dt className="text-xs text-muted-foreground font-medium mb-1">Last Updated</dt>
                <dd className="text-xs font-mono text-muted-foreground">
                  {new Date(grievance.updated_at).toLocaleString("en-IN")}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <UpdateStatusModal
        currentStatus={grievance.status}
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleStatusSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
