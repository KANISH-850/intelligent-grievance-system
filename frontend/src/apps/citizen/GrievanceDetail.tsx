import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { getCitizenGrievanceByIdApi } from "@/core/api/grievanceApi"
import type { Grievance } from "@/shared/types/grievance"
import { StatusBadge } from "@/shared/ui/StatusBadge"
import { PriorityBadge } from "@/shared/ui/PriorityBadge"
import { StatusTimeline } from "@/shared/ui/StatusTimeline"
import { Button } from "@/shared/ui/button"

export function GrievanceDetail() {
  const { id } = useParams<{ id: string }>()
  const [grievance, setGrievance]     = useState<Grievance | null>(null)
  const [isLoading, setIsLoading]     = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [reloadTrigger, setReload]    = useState(0)

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
        {/* Left: complaint + timeline */}
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
          </div>

          {/* Status timeline */}
          <StatusTimeline currentStatus={grievance.status} history={grievance.status_history} />
        </div>

        {/* Right: classification metadata */}
        <div className="space-y-5">
          <div className="section-card space-y-4">
            <h2 className="section-title">Classification Details</h2>

            <dl className="space-y-3 text-sm">
              <div className="border-b pb-3">
                <dt className="text-xs text-muted-foreground font-medium mb-1">Assigned Department</dt>
                <dd className="font-bold text-foreground">
                  {grievance.department?.name || grievance.category}
                  {grievance.department?.code && (
                    <span className="ml-1.5 text-xs font-mono text-muted-foreground">
                      [{grievance.department.code}]
                    </span>
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
