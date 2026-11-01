import { useEffect, useState, useCallback } from "react"
import { useParams, Link } from "react-router-dom"
import {
  getAdminGrievanceByIdApi,
  updateAdminGrievanceStatusApi,
  correctAdminClassificationApi,
  fetchGrievanceImageBlob,
} from "@/core/api/grievanceApi"
import type { Grievance, GrievanceImage, Status } from "@/shared/types/grievance"
import { StatusBadge } from "@/shared/ui/StatusBadge"
import { PriorityBadge } from "@/shared/ui/PriorityBadge"
import { StatusTimeline } from "@/shared/ui/StatusTimeline"
import { Button } from "@/shared/ui/button"
import { UpdateStatusModal } from "../officer/UpdateStatusModal"
import { CorrectClassificationModal } from "./CorrectClassificationModal"

function ImageGallery({ grievanceId, images, routePrefix = "/grievances" }: { grievanceId: string; images: GrievanceImage[]; routePrefix?: string }) {
  const [blobUrls, setBlobUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(images.length > 0)
  const [lightbox, setLightbox] = useState<string | null>(null)

  useEffect(() => {
    if (images.length === 0) return
    let cancelled = false
    Promise.allSettled(
      images.map(async (img) => {
        const url = await fetchGrievanceImageBlob(grievanceId, img.id, routePrefix)
        return [img.id, url] as [string, string]
      })
    ).then((results) => {
      if (cancelled) return
      const map: Record<string, string> = {}
      results.forEach((r) => { if (r.status === "fulfilled") map[r.value[0]] = r.value[1] })
      setBlobUrls(map)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [grievanceId, images, routePrefix])

  const getStatusBadge = (status?: string | null) => {
    switch (status) {
      case "completed":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">Analysis completed</span>
      case "in_progress":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">Analysis in progress</span>
      case "unavailable":
      case "failed":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">Analysis unavailable</span>
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">Image uploaded</span>
    }
  }

  if (images.length === 0) {
    return (
      <div className="section-card space-y-2">
        <h2 className="section-title flex items-center gap-2">
          <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 20.25h18M3.75 4.875c0-.621.504-1.125 1.125-1.125h14.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125H4.875A1.125 1.125 0 013.75 16.125V4.875z" />
          </svg>
          Supporting Images
        </h2>
        <div className="rounded-lg border border-dashed border-border/80 p-4 text-center text-xs text-muted-foreground bg-muted/20">
          No image attached with this grievance.
        </div>
      </div>
    )
  }

  return (
    <div className="section-card space-y-4">
      <h2 className="section-title flex items-center gap-2">
        <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 20.25h18M3.75 4.875c0-.621.504-1.125 1.125-1.125h14.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125H4.875A1.125 1.125 0 013.75 16.125V4.875z" />
        </svg>
        Supporting Images <span className="text-xs font-normal text-muted-foreground">({images.length})</span>
      </h2>
      {loading ? (
        <div className="flex items-center gap-3 text-sm text-muted-foreground"><span className="spinner w-4 h-4" /> Loading images…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {images.map((img) => (
            <div key={img.id} className="rounded-lg border bg-card p-3 space-y-3">
              <button type="button" aria-label={`View ${img.filename}`}
                onClick={() => setLightbox(blobUrls[img.id] ?? null)}
                className="relative group rounded-md overflow-hidden border bg-muted aspect-video w-full focus:outline-none focus:ring-2 focus:ring-primary block">
                {blobUrls[img.id] ? (
                  <img src={blobUrls[img.id]} alt={img.filename} className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">Failed to load preview</div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[10px] truncate">{img.filename}</p>
                </div>
              </button>
              <div className="text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-mono text-[11px] truncate max-w-[140px]">{img.filename}</span>
                  {getStatusBadge(img.analysis_status)}
                </div>
                {img.detected_issue && (
                  <p className="font-medium text-foreground">
                    Issue: {img.detected_issue}
                    {img.analysis_confidence != null ? <span className="text-muted-foreground ml-1 font-normal">({Math.round(img.analysis_confidence * 100)}% conf)</span> : null}
                  </p>
                )}
                {img.image_description && <p className="text-muted-foreground line-clamp-3">{img.image_description}</p>}
                {!!img.visual_observations?.length && (
                  <p className="text-muted-foreground"><span className="font-medium text-foreground/80">Visible:</span> {img.visual_observations.join(", ")}</p>
                )}
                {img.human_review_required && (
                  <p className="text-amber-700 font-medium flex items-center gap-1 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Human review required based on image findings
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {lightbox && (
        <div role="dialog" aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setLightbox(null)}>
          <button type="button" aria-label="Close" onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <img src={lightbox} alt="Full size" className="max-w-full max-h-full rounded-xl shadow-2xl object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}

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
            <div className="flex items-center justify-between">
              <h2 className="section-title">
                {grievance.translation_status === "translated" && grievance.translated_text ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    English Translation (Default Oversight View)
                  </span>
                ) : (
                  <span>Citizen Complaint Statement</span>
                )}
              </h2>
              {grievance.detected_language && grievance.detected_language !== "English" && (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-100 text-sky-800 border border-sky-200">
                  Detected Language: {grievance.detected_language}
                </span>
              )}
            </div>

            {/* If translated, display English translation prominently as primary statement */}
            {grievance.translation_status === "translated" && grievance.translated_text ? (
              <div className="space-y-3">
                <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-lg text-sm leading-relaxed text-foreground whitespace-pre-wrap font-sans">
                  {grievance.translated_text}
                </div>

                {/* Collapsible / labeled Original Text section */}
                <details className="group rounded-lg border bg-muted/20 p-3">
                  <summary className="cursor-pointer text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                      View Original {grievance.detected_language || "Non-English"} Submission
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">Original Text</span>
                  </summary>
                  <div className="mt-3 p-3 bg-muted/40 rounded border text-sm text-foreground whitespace-pre-wrap">
                    {grievance.original_text}
                  </div>
                </details>
              </div>
            ) : (
              /* Passthrough (English native) or Translation Pending/Unavailable */
              <div className="space-y-3">
                <div className="p-4 bg-muted/30 border rounded-lg text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                  {grievance.original_text}
                </div>

                {grievance.translation_status === "passthrough" && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Submitted in English (no translation required).
                  </p>
                )}

                {(grievance.translation_status === "unavailable" || grievance.translation_status === "failed") && grievance.detected_language !== "English" && (
                  <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1">
                    <p className="font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Translation Unavailable
                    </p>
                    <p className="text-muted-foreground">
                      Automated translation provider was offline or not configured. The original {grievance.detected_language || "regional"} text is preserved above for manual review.
                    </p>
                  </div>
                )}

                {grievance.translation_status === "unsupported" && (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 space-y-1">
                    <p className="font-semibold">Language Unsupported for Automated Translation</p>
                    <p className="text-muted-foreground">
                      Original complaint in {grievance.detected_language} has been flagged for human review.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="text-[11px] text-muted-foreground flex items-center gap-3 pt-1 border-t">
              <span>Original Language: <strong className="text-foreground">{grievance.detected_language || "English"}</strong></span>
              <span>·</span>
              <span>Translation Status: <strong className="text-foreground">{grievance.translation_status || "unknown"}</strong></span>
              {grievance.translation_method && (
                <>
                  <span>·</span>
                  <span>Method: <span className="font-mono">{grievance.translation_method}</span></span>
                </>
              )}
            </div>
          </div>

          {/* Multi-Department Routing Overview */}
          {grievance.assignments && grievance.assignments.length > 0 && (
            <div className="section-card space-y-3">
              <h2 className="section-title flex items-center justify-between">
                <span>Multi-Department Assignments & Routing Rationale</span>
                <span className="text-xs font-normal text-muted-foreground">
                  ({grievance.assignments.length} {grievance.assignments.length === 1 ? "Department" : "Departments"})
                </span>
              </h2>
              <div className="space-y-2.5">
                {grievance.assignments.map((assign) => (
                  <div key={assign.id} className="p-3 rounded-lg border bg-card/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {assign.department?.name || "Department"}
                        </span>
                        {assign.department?.code && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {assign.department.code}
                          </span>
                        )}
                        {assign.assigned_officer && (
                          <span className="text-[11px] text-muted-foreground">
                            · Officer: <strong>{assign.assigned_officer.name}</strong>
                          </span>
                        )}
                      </div>
                      <StatusBadge status={assign.status} />
                    </div>
                    {assign.routing_reason && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        <strong className="text-foreground/80 font-medium">Routing Reason:</strong> {assign.routing_reason}
                      </p>
                    )}
                    {assign.notes && (
                      <p className="text-xs text-sky-800 bg-sky-50 px-2 py-1 rounded border border-sky-200">
                        <strong>Department Notes:</strong> {assign.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Image gallery */}
          <ImageGallery grievanceId={grievance.id} images={grievance.images || []} routePrefix="/admin/grievances" />

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
                <div className="mt-1.5">
                  {grievance.routing_status === "ASSIGNED" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      ✓ Auto-Dispatched to Department Queue
                    </span>
                  ) : grievance.ai_review_required ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                      ⚠ Pending Administrative Review
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground font-mono">Routing: {grievance.routing_status || "ASSIGNED"}</span>
                  )}
                </div>
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
