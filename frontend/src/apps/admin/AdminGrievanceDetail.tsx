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
  const [grievance, setGrievance] = useState<Grievance | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isClassModalOpen, setIsClassModalOpen] = useState(false)
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false)
  const [isSubmittingClass, setIsSubmittingClass] = useState(false)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const loadDetail = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await getAdminGrievanceByIdApi(id)
      if (res.success && res.data) {
        setGrievance(res.data)
      } else {
        throw new Error(res.message || "Failed to load grievance details.")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Grievance not found."
      setError(msg)
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
        if (res.success && res.data) {
          setGrievance(res.data)
          setError(null)
        } else {
          setError(res.message || "Failed to load grievance details.")
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return
        const msg = err instanceof Error ? err.message : "Grievance not found."
        setError(msg)
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [id])

  const handleStatusSubmit = async (status: Status, remarks: string) => {
    if (!id) return
    setIsSubmittingStatus(true)
    setActionSuccess(null)
    try {
      const res = await updateAdminGrievanceStatusApi(id, status, remarks)
      if (res.success && res.data) {
        setGrievance(res.data)
        setIsModalOpen(false)
        setActionSuccess(`Admin status override to ${status} completed successfully.`)
      } else {
        throw new Error(res.message || "Failed to update status.")
      }
    } finally {
      setIsSubmittingStatus(false)
    }
  }

  const handleClassificationConfirm = async (category: string, remarks: string) => {
    if (!id) return
    setIsSubmittingClass(true)
    setActionSuccess(null)
    try {
      const res = await correctAdminClassificationApi(id, category, remarks)
      if (res.success && res.data) {
        setGrievance(res.data)
        setIsClassModalOpen(false)
        setActionSuccess(`Human classification corrected to '${category}'.`)
      } else {
        throw new Error(res.message || "Failed to correct classification.")
      }
    } finally {
      setIsSubmittingClass(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-card border rounded-xl p-12 text-center space-y-3">
        <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">Loading system grievance details...</p>
      </div>
    )
  }

  if (error || !grievance) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-8 text-center space-y-4">
        <p className="text-sm text-rose-700 font-medium">{error || "Grievance not found."}</p>
        <div className="flex justify-center space-x-3">
          <Button variant="outline" onClick={loadDetail}>
            Retry Loading
          </Button>
          <Link to="/admin/grievances">
            <Button variant="ghost">Back to Master List</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 rounded-lg flex items-center justify-between animate-in fade-in">
          <span>{actionSuccess}</span>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-xs font-semibold text-emerald-600 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header & Back Link */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b pb-4">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold font-mono text-primary">
              {grievance.grievance_number}
            </h2>
            <StatusBadge status={grievance.status} />
            {grievance.ai_review_required && (
              <span className="px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 rounded-full animate-pulse">
                AI Review Required
              </span>
            )}
            {grievance.is_human_corrected && (
              <span className="px-2.5 py-1 text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300 rounded-full">
                Human Corrected
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            System Record ID: {grievance.id} | Submitted {new Date(grievance.created_at).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => setIsClassModalOpen(true)}>
            Correct Category
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            Admin Status Override
          </Button>
          <Link to="/admin/grievances">
            <Button variant="ghost">Back to List</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Complaint Description & Audit History */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Citizen Complaint Statement
            </h3>

            <div className="p-4 bg-muted/30 border rounded-lg text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              {grievance.original_text}
            </div>

            {grievance.translated_text &&
              grievance.translated_text !== grievance.original_text && (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground">
                    English AI Translation ({grievance.detected_language || "Detected Script"}):
                  </span>
                  <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-xs italic text-blue-900 leading-relaxed">
                    &quot;{grievance.translated_text}&quot;
                  </div>
                </div>
              )}
          </div>

          <StatusTimeline
            currentStatus={grievance.status}
            history={grievance.status_history}
          />
        </div>

        {/* Sidebar Classification & Metadata */}
        <div className="space-y-6">
          <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              AI & Administrative Metadata
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block font-medium">Assigned Department</span>
                <span className="font-bold text-foreground">
                  {grievance.department?.name || grievance.category}
                </span>
                {grievance.department?.code && (
                  <span className="ml-2 text-xs font-mono text-muted-foreground">
                    ({grievance.department.code})
                  </span>
                )}
              </div>

              <div className="border-t pt-2">
                <span className="text-xs text-muted-foreground block font-medium">Current Category</span>
                <span className="font-semibold text-foreground">{grievance.category}</span>
                {grievance.ai_original_category && grievance.ai_original_category !== grievance.category && (
                  <span className="block text-xs text-muted-foreground italic mt-0.5">
                    Original AI Prediction: {grievance.ai_original_category}
                  </span>
                )}
              </div>

              {grievance.ai_confidence !== undefined && grievance.ai_confidence !== null && (
                <div className="border-t pt-2">
                  <span className="text-xs text-muted-foreground block font-medium">AI Classification Confidence</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="font-mono font-bold text-sm text-foreground">
                      {(grievance.ai_confidence * 100).toFixed(0)}%
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                      grievance.ai_confidence_level === "HIGH"
                        ? "bg-emerald-100 text-emerald-800"
                        : grievance.ai_confidence_level === "MEDIUM"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-800"
                    }`}>
                      {grievance.ai_confidence_level || "HIGH"}
                    </span>
                  </div>
                </div>
              )}

              {grievance.ai_explanation_terms && grievance.ai_explanation_terms.length > 0 && (
                <div className="border-t pt-2">
                  <span className="text-xs text-muted-foreground block font-medium">TF-IDF Contributing Terms</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {grievance.ai_explanation_terms.map((term, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-muted text-xs font-mono rounded text-muted-foreground">
                        {term}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-2">
                <span className="text-xs text-muted-foreground block font-medium">Priority Rating</span>
                <PriorityBadge priority={grievance.priority} />
              </div>

              <div className="border-t pt-2">
                <span className="text-xs text-muted-foreground block font-medium">Detected Language</span>
                <span className="font-medium text-foreground">
                  {grievance.detected_language || "English"}
                </span>
              </div>

              {grievance.user && (
                <div className="border-t pt-2">
                  <span className="text-xs text-muted-foreground block font-medium">Complainant Information</span>
                  <span className="font-semibold text-foreground">{grievance.user.name}</span>
                  <span className="block text-xs text-muted-foreground font-mono">{grievance.user.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Status Override Modal */}
      <UpdateStatusModal
        currentStatus={grievance.status}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleStatusSubmit}
        isSubmitting={isSubmittingStatus}
      />

      {/* Admin Classification Correction Modal */}
      <CorrectClassificationModal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        onConfirm={handleClassificationConfirm}
        currentCategory={grievance.category}
        isSubmitting={isSubmittingClass}
      />
    </div>
  )
}
