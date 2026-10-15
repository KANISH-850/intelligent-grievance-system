import { useEffect, useState, useCallback } from "react"
import { useParams, Link } from "react-router-dom"
import {
  getAdminGrievanceByIdApi,
  updateAdminGrievanceStatusApi,
  correctAdminClassificationApi,
} from "@/core/api/grievanceApi"
import type { Grievance, Status } from "@/shared/types/grievance"
import { StatusBadge } from "@/shared/ui/StatusBadge"
import { PriorityBadge } from "@/shared/ui/PriorityBadge"
import { StatusTimeline } from "@/shared/ui/StatusTimeline"
import { Button } from "@/shared/ui/button"
import { UpdateStatusModal } from "../officer/UpdateStatusModal"
import { CorrectClassificationModal } from "./CorrectClassificationModal"

export function AdminGrievanceDetail() {
  const { id } = useParams<{ id: string }>()
  const [grievance, setGrievance]       = useState<Grievance | null>(null)
  const [isLoading, setIsLoading]       = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [isModalOpen, setModalOpen]     = useState(false)
  const [isClassModal, setClassModal]   = useState(false)
  const [isSubmittingStatus, setSubStatus] = useState(false)
  const [isSubmittingClass, setSubClass]   = useState(false)
  const [actionSuccess, setSuccess]     = useState<string | null>(null)

  const loadDetail = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await getAdminGrievanceByIdApi(id)
      if (res.success && res.data) { setGrievance(res.data) }
      else throw new Error(res.message || "Failed to load grievance details.")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Grievance not found.")
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (!id) return
    let isMounted = true
    getAdminGrievanceByIdApi(id)
      .then((res) => {
        if (!isMounted) return
        if (res.success && res.data) { setGrievance(res.data); setError(null) }
        else setError(res.message || "Failed to load.")
      })
      .catch((err: unknown) => {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : "Grievance not found.")
      })
      .finally(() => { if (isMounted) setIsLoading(false) })
    return () => { isMounted = false }
  }, [id])

  const handleStatusSubmit = async (status: Status, remarks: string) => {
    if (!id) return
    setSubStatus(true)
    setSuccess(null)
    try {
      const res = await updateAdminGrievanceStatusApi(id, status, remarks)
      if (res.success && res.data) {
        setGrievance(res.data)
        setModalOpen(false)
        setSuccess(`Admin status override to ${status} completed.`)
      } else throw new Error(res.message || "Failed to update status.")
    } finally {
      setSubStatus(false)
    }
  }

  const handleClassificationConfirm = async (category: string, remarks: string) => {
    if (!id) return
    setSubClass(true)
    setSuccess(null)
    try {
      const res = await correctAdminClassificationApi(id, category, remarks)
      if (res.success && res.data) {
        setGrievance(res.data)
        setClassModal(false)
        setSuccess(`Classification corrected to '${category}'.`)
      } else throw new Error(res.message || "Failed to correct classification.")
    } finally {
      setSubClass(false)
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
          <Link to="/admin/grievances">
            <Button variant="ghost" size="sm">← Back to Master List</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
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
            <Link to="/admin/grievances" className="hover:text-primary transition-colors">All Grievances</Link>
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
            {grievance.is_human_corrected && (
              <span className="px-2.5 py-1 text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300 rounded-full">
                ✓ Human Corrected
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            ID: <span className="font-mono">{grievance.id}</span> · Submitted {new Date(grievance.created_at).toLocaleString("en-IN")}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button id="admin-correct-category-btn" variant="outline" onClick={() => setClassModal(true)}>
            Correct Category
          </Button>
          <Button id="admin-status-override-btn" onClick={() => setModalOpen(true)}>
            Status Override
          </Button>
          <Link to="/admin/grievances">
            <Button variant="ghost" className="gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main content */}
        <div className="md:col-span-2 space-y-5">
          <div className="section-card space-y-4">
            <h2 className="section-title">Citizen Complaint Statement</h2>
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

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="section-card space-y-4">
            <h2 className="section-title">AI & Administrative Metadata</h2>
            <dl className="space-y-3 text-sm">
              <div className="border-b pb-3">
                <dt className="text-xs text-muted-foreground font-medium mb-1">Assigned Department</dt>
                <dd className="font-bold text-foreground">
                  {grievance.department?.name || grievance.category}
                  {grievance.department?.code && (
                    <span className="ml-1.5 text-xs font-mono text-muted-foreground">({grievance.department.code})</span>
                  )}
                </dd>
              </div>

              <div className="border-b pb-3">
                <dt className="text-xs text-muted-foreground font-medium mb-1">Current Category</dt>
                <dd className="font-semibold">{grievance.category}</dd>
                {grievance.ai_original_category && grievance.ai_original_category !== grievance.category && (
                  <p className="text-[11px] text-muted-foreground italic mt-0.5">
                    Original AI: {grievance.ai_original_category}
                  </p>
                )}
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

              {grievance.ai_explanation_terms && grievance.ai_explanation_terms.length > 0 && (
                <div className="border-b pb-3">
                  <dt className="text-xs text-muted-foreground font-medium mb-1">TF-IDF Terms</dt>
                  <dd className="flex flex-wrap gap-1.5 mt-1">
                    {grievance.ai_explanation_terms.map((term, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-muted text-[10px] font-mono rounded text-muted-foreground">
                        {term}
                      </span>
                    ))}
                  </dd>
                </div>
              )}

              <div className="border-b pb-3">
                <dt className="text-xs text-muted-foreground font-medium mb-1">Detected Language</dt>
                <dd className="font-medium">{grievance.detected_language || "English"}</dd>
              </div>

              {grievance.user && (
                <div className="border-b pb-3">
                  <dt className="text-xs text-muted-foreground font-medium mb-1">Complainant</dt>
                  <dd>
                    <p className="font-semibold">{grievance.user.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{grievance.user.email}</p>
                  </dd>
                </div>
              )}

              {grievance.human_corrected_at && (
                <div>
                  <dt className="text-xs text-muted-foreground font-medium mb-1">Human Correction</dt>
                  <dd className="text-xs font-mono text-muted-foreground">
                    {new Date(grievance.human_corrected_at).toLocaleString("en-IN")}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>

      <UpdateStatusModal
        currentStatus={grievance.status}
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleStatusSubmit}
        isSubmitting={isSubmittingStatus}
      />

      <CorrectClassificationModal
        isOpen={isClassModal}
        onClose={() => setClassModal(false)}
        onConfirm={handleClassificationConfirm}
        currentCategory={grievance.category}
        isSubmitting={isSubmittingClass}
      />
    </div>
  )
}
