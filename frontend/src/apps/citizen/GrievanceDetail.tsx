import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { getCitizenGrievanceByIdApi, fetchGrievanceImageBlob } from "@/core/api/grievanceApi"
import type { Grievance, GrievanceImage } from "@/shared/types/grievance"
import { StatusBadge } from "@/shared/ui/StatusBadge"
import { PriorityBadge } from "@/shared/ui/PriorityBadge"
import { StatusTimeline } from "@/shared/ui/StatusTimeline"
import { Button } from "@/shared/ui/button"

/* ── Inline image gallery ─────────────────────────────── */
function ImageGallery({ grievanceId, images }: { grievanceId: string; images: GrievanceImage[] }) {
  const [blobUrls, setBlobUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(images.length > 0)
  const [lightbox, setLightbox] = useState<string | null>(null)

  useEffect(() => {
    if (images.length === 0) return
    let cancelled = false
    Promise.allSettled(
      images.map(async (img) => {
        const url = await fetchGrievanceImageBlob(grievanceId, img.id)
        return [img.id, url] as [string, string]
      })
    ).then((results) => {
      if (cancelled) return
      const map: Record<string, string> = {}
      results.forEach((r) => { if (r.status === "fulfilled") map[r.value[0]] = r.value[1] })
      setBlobUrls(map)
      setLoading(false)
    })
    return () => {
      cancelled = true
      Object.values(blobUrls).forEach((u) => URL.revokeObjectURL(u))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images, grievanceId])

  if (images.length === 0) {
    return (
      <div className="section-card space-y-2">
        <h2 className="section-title flex items-center gap-2">
          <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 20.25h18M3.75 4.875c0-.621.504-1.125 1.125-1.125h14.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125H4.875A1.125 1.125 0 013.75 16.125V4.875z" />
          </svg>
          Supporting Images
        </h2>
        <div className="p-3 bg-muted/20 border border-dashed rounded-lg text-xs text-muted-foreground">
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
        Supporting Images
        <span className="text-xs font-normal text-muted-foreground">({images.length})</span>
      </h2>

      {loading ? (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="spinner w-4 h-4" />
          Loading images…
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {images.map((img) => (
            <div key={img.id} className="border rounded-xl p-3 bg-muted/20 space-y-2.5">
              <button
                type="button"
                aria-label={`View ${img.filename}`}
                onClick={() => setLightbox(blobUrls[img.id] ?? null)}
                className="relative group rounded-lg overflow-hidden border bg-muted aspect-video w-full focus:outline-none focus:ring-2 focus:ring-primary block"
              >
                {blobUrls[img.id] ? (
                  <img
                    src={blobUrls[img.id]}
                    alt={img.filename}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                    Image loading…
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2.5 py-1 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[10px] truncate">{img.filename}</p>
                </div>
              </button>

              <div className="text-xs space-y-1.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-mono text-[11px] font-semibold truncate max-w-[150px]">{img.filename}</span>
                  {img.analysis_status === "analyzed" ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Analysis completed
                    </span>
                  ) : img.analysis_status === "pending" ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      Analysis in progress
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      Analysis unavailable
                    </span>
                  )}
                </div>

                {img.detected_issue && (
                  <p className="text-foreground font-medium">
                    <span className="text-muted-foreground font-normal">Identified Issue:</span> {img.detected_issue}
                  </p>
                )}
                {img.image_description && (
                  <p className="text-muted-foreground leading-relaxed italic">
                    "{img.image_description}"
                  </p>
                )}
                {!!img.visual_observations?.length && (
                  <p className="text-muted-foreground text-[11px]">
                    <strong className="text-foreground font-medium">Visible evidence:</strong> {img.visual_observations.join("; ")}
                  </p>
                )}
                {img.human_review_required && (
                  <p className="text-amber-700 text-[11px] font-medium flex items-center gap-1">
                    <span>⚠ Visual human review recommended</span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            aria-label="Close image"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            onClick={() => setLightbox(null)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={lightbox}
            alt="Full size preview"
            className="max-w-full max-h-full rounded-xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

/* ── Main component ───────────────────────────────────── */
export function GrievanceDetail() {
  const { id } = useParams<{ id: string }>()
  const [grievance, setGrievance]   = useState<Grievance | null>(null)
  const [isLoading, setIsLoading]   = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [reloadTrigger, setReload]  = useState(0)

  useEffect(() => {
    if (!id) return
    let isMounted = true
    getCitizenGrievanceByIdApi(id)
      .then((res) => {
        if (!isMounted) return
        if (res.success && res.data) {
          setGrievance(res.data)
          setError(null)
        } else {
          setError(res.message || "Failed to load grievance details.")
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : "Unable to fetch grievance details.")
      })
      .finally(() => { if (isMounted) setIsLoading(false) })
    return () => { isMounted = false }
  }, [id, reloadTrigger])

  const handleRetry = () => { setError(null); setReload((p) => p + 1) }

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
          <Button variant="outline" size="sm" onClick={handleRetry}>Retry</Button>
          <Link to="/citizen/grievances">
            <Button variant="ghost" size="sm">← Back to My Grievances</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb + header */}
      <div className="flex items-start justify-between flex-wrap gap-3 border-b pb-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/citizen/grievances" className="hover:text-primary transition-colors">My Grievances</Link>
            <span>/</span>
            <span className="font-mono text-foreground font-semibold">{grievance.grievance_number}</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold font-mono text-primary">{grievance.grievance_number}</h1>
            <StatusBadge status={grievance.status} />
            <PriorityBadge priority={grievance.priority} />
          </div>
          <p className="text-xs text-muted-foreground">
            Submitted {new Date(grievance.created_at).toLocaleString("en-IN")} ·
            Last updated {new Date(grievance.updated_at).toLocaleString("en-IN")}
          </p>
        </div>
        <Link to="/citizen/grievances">
          <Button variant="outline" size="sm" className="gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to List
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left: complaint + images + timeline */}
        <div className="md:col-span-2 space-y-5">
          {/* Complaint text */}
          <div className="section-card space-y-4">
            <h2 className="section-title">Complaint Description</h2>
            <div className="p-4 bg-muted/30 border rounded-lg text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              {grievance.original_text}
            </div>

            {grievance.translated_text &&
              grievance.translated_text !== grievance.original_text && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground">
                  AI English Translation
                  {grievance.detected_language ? ` (detected: ${grievance.detected_language})` : ""}:
                </p>
                <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg text-xs italic text-sky-900 leading-relaxed">
                  "{grievance.translated_text}"
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Original language: <span className="font-medium text-foreground">{grievance.detected_language || "English"}</span>
              {grievance.translation_status && (
                <> · Translation status: <span className="font-medium text-foreground">{grievance.translation_status}</span></>
              )}
            </p>
          </div>

          {/* Department Assignments & Live Progress Section */}
          {grievance.assignments && grievance.assignments.length > 0 && (
            <div className="section-card space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b pb-3">
                <h2 className="section-title flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Department Assignments & Independent Progress
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {grievance.assignments.length} {grievance.assignments.length === 1 ? "Department" : "Departments"} Assigned
                </span>
              </div>

              <div className="space-y-3.5">
                {grievance.assignments.map((assign) => (
                  <div
                    key={assign.id}
                    className="p-4 rounded-xl border bg-card/70 space-y-2.5 transition-all hover:border-primary/40 shadow-sm"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">
                          {assign.department?.name || "Department"}
                        </span>
                        {assign.department?.code && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                            {assign.department.code}
                          </span>
                        )}
                      </div>
                      <StatusBadge status={assign.status} />
                    </div>

                    {assign.routing_reason && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        <strong className="text-foreground/80 font-medium">Issue Routed:</strong> {assign.routing_reason}
                      </p>
                    )}

                    {/* Department Remarks or Progress notes */}
                    {(assign.remarks || assign.notes) && (
                      <div className="p-2.5 bg-sky-50/80 border border-sky-200 rounded-lg text-xs text-sky-900 leading-relaxed">
                        <strong className="font-semibold">Department Remarks: </strong>
                        {assign.remarks || assign.notes}
                      </div>
                    )}

                    {/* Resolution summary if resolved */}
                    {assign.status === "RESOLVED" && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-950 space-y-1">
                        <div className="flex items-center justify-between font-bold text-emerald-900 flex-wrap gap-1">
                          <span className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Department Action Completed
                          </span>
                          {assign.resolved_at && (
                            <span className="text-[10px] font-mono text-emerald-700 font-normal">
                              Resolved: {new Date(assign.resolved_at).toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                        {assign.resolution_description ? (
                          <p className="text-emerald-900 leading-relaxed pt-0.5 font-medium">
                            {assign.resolution_description}
                          </p>
                        ) : null}
                      </div>
                    )}

                    {/* Metadata & timestamps */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground pt-1.5 border-t">
                      <div>
                        <span>Assigned Officer: </span>
                        <strong className="text-foreground font-medium">
                          {assign.assigned_officer?.name || "Pending officer assignment"}
                        </strong>
                      </div>
                      <div className="sm:text-right">
                        <span>Last Update: </span>
                        <span className="font-mono">{new Date(assign.updated_at).toLocaleString("en-IN")}</span>
                      </div>
                      {assign.started_at && (
                        <div>
                          <span>Work Initiated: </span>
                          <span className="font-mono text-indigo-700 font-medium">{new Date(assign.started_at).toLocaleString("en-IN")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Image gallery */}
          <ImageGallery grievanceId={grievance.id} images={grievance.images || []} />

          {/* Status timeline */}
          <StatusTimeline currentStatus={grievance.status} history={grievance.status_history} />
        </div>

        {/* Right: classification metadata */}
        <div className="space-y-5">
          <div className="section-card space-y-4">
            <h2 className="section-title">Classification Details</h2>

            <dl className="space-y-3 text-sm">
              <div className="border-b pb-3">
                <dt className="text-xs text-muted-foreground font-medium mb-1">
                  {grievance.assignments && grievance.assignments.length > 1
                    ? `Assigned Departments (${grievance.assignments.length})`
                    : "Assigned Department"}
                </dt>
                {grievance.assignments && grievance.assignments.length > 1 ? (
                  <dd className="space-y-1.5 pt-1">
                    {grievance.assignments.map((a) => (
                      <div key={a.id} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground">
                          {a.department?.name || "Department"}
                        </span>
                        <StatusBadge status={a.status} className="text-[10px] px-2 py-0" />
                      </div>
                    ))}
                  </dd>
                ) : (
                  <dd className="font-bold text-foreground">
                    {grievance.department?.name || grievance.category}
                    {grievance.department?.code && (
                      <span className="ml-1.5 text-xs font-mono text-muted-foreground">
                        [{grievance.department.code}]
                      </span>
                    )}
                  </dd>
                )}
              </div>

              <div className="border-b pb-3">
                <dt className="text-xs text-muted-foreground font-medium mb-1">Dispatch Status</dt>
                <dd className="text-xs font-semibold">
                  {grievance.routing_status === "ASSIGNED" || grievance.routing_status === "DISPATCHED" ? (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Dispatched to Department
                    </span>
                  ) : grievance.ai_review_required ? (
                    <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Pending Administrative Review
                    </span>
                  ) : (
                    <span className="text-muted-foreground">{grievance.routing_status || "In Routing"}</span>
                  )}
                </dd>
              </div>

              <div className="border-b pb-3">
                <dt className="text-xs text-muted-foreground font-medium mb-1">Classified Category</dt>
                <dd className="font-semibold text-foreground">{grievance.category}</dd>
              </div>

              <div className="border-b pb-3">
                <dt className="text-xs text-muted-foreground font-medium mb-1">Priority Rating</dt>
                <dd><PriorityBadge priority={grievance.priority} /></dd>
              </div>

              <div className="border-b pb-3">
                <dt className="text-xs text-muted-foreground font-medium mb-1">Detected Language</dt>
                <dd className="font-medium text-foreground">{grievance.detected_language || "English"}</dd>
              </div>

              {grievance.ai_confidence !== null && grievance.ai_confidence !== undefined && (
                <div className="border-b pb-3">
                  <dt className="text-xs text-muted-foreground font-medium mb-1">AI Classification Confidence</dt>
                  <dd className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm">
                      {(grievance.ai_confidence * 100).toFixed(0)}%
                    </span>
                    {grievance.ai_confidence_level && (
                      <span className={`px-1.5 py-0.5 text-xs font-bold rounded ${
                        grievance.ai_confidence_level === "HIGH"
                          ? "bg-emerald-100 text-emerald-800"
                          : grievance.ai_confidence_level === "MEDIUM"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}>
                        {grievance.ai_confidence_level}
                      </span>
                    )}
                  </dd>
                </div>
              )}

              <div>
                <dt className="text-xs text-muted-foreground font-medium mb-1">Grievance ID</dt>
                <dd className="font-mono text-[11px] text-muted-foreground break-all">{grievance.id}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
