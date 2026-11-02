import React, { useState, useRef, useCallback, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  submitGrievanceApi,
  analyzePreSubmissionImageApi,
  previewTranslationApi,
  type PreSubmissionImageAnalysis,
  type TranslationPreviewData,
} from "@/core/api/grievanceApi"
import type { Grievance } from "@/shared/types/grievance"
import { StatusBadge } from "@/shared/ui/StatusBadge"
import { PriorityBadge } from "@/shared/ui/PriorityBadge"
import { Button } from "@/shared/ui/button"

const MAX_FILES = 5
const MAX_SIZE_MB = 5
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const ALLOWED_EXT_LABEL = "JPEG, PNG, WebP"

interface ImagePreview {
  id: string
  file: File
  objectUrl: string
  status: "idle" | "analyzing" | "analyzed" | "failed" | "offline"
  analysis: PreSubmissionImageAnalysis | null
  error?: string
}

/* ── Helper: human-readable file size ── */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function SubmitGrievance() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [text, setText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submittedResult, setSubmittedResult] = useState<Grievance | null>(null)

  // Real-time language detection and English translation preview state
  const [translationPreview, setTranslationPreview] = useState<TranslationPreviewData | null>(null)
  const [translationStatus, setTranslationStatus] = useState<
    "idle" | "detecting" | "translating" | "completed" | "unavailable" | "unsupported"
  >("idle")

  const [previews, setPreviews] = useState<ImagePreview[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Debounced real-time language detection & translation preview
  useEffect(() => {
    const trimmed = text.trim()
    if (trimmed.length < 3) {
      setTranslationPreview(null)
      setTranslationStatus("idle")
      return
    }

    setTranslationStatus("detecting")
    const timer = setTimeout(async () => {
      try {
        setTranslationStatus("translating")
        const res = await previewTranslationApi(trimmed)
        if (res.success && res.data) {
          setTranslationPreview(res.data)
          if (res.data.detected_language === "English" || res.data.translation_status === "passthrough") {
            setTranslationStatus("completed")
          } else if (res.data.translation_status === "translated") {
            setTranslationStatus("completed")
          } else if (res.data.translation_status === "unsupported") {
            setTranslationStatus("unsupported")
          } else {
            setTranslationStatus("unavailable")
          }
        } else {
          setTranslationStatus("unavailable")
        }
      } catch {
        setTranslationStatus("unavailable")
      }
    }, 450)

    return () => clearTimeout(timer)
  }, [text])

  const charCount = text.length
  const hasValidText = text.trim().length >= 3 && text.length <= 5000

  // Check image analysis states
  const isAnyImageAnalyzing = previews.some((p) => p.status === "analyzing")
  const hasCivicImage = previews.some(
    (p) => p.analysis?.is_grievance_related && p.analysis?.issue_detected
  )
  const hasAnyImages = previews.length > 0
  const hasOnlyUnrelatedImages =
    hasAnyImages &&
    !hasValidText &&
    previews.every(
      (p) => p.analysis && !p.analysis.is_grievance_related && p.analysis.image_type === "unrelated"
    )

  // A submission is allowed if:
  // 1. Valid written text is provided, OR
  // 2. An image showing a civic defect is attached (image-only submission), OR
  // 3. An image is attached and vision service was offline (queued for manual officer review)
  // And it is BLOCKED if only unrelated images are attached without valid text.
  const canSubmit =
    !isSubmitting &&
    !isAnyImageAnalyzing &&
    !hasOnlyUnrelatedImages &&
    (hasValidText || hasCivicImage || previews.some((p) => p.status === "offline" || p.status === "failed"))

  /* ── Interactive Image Analysis ── */
  const runImageInspection = async (previewId: string, file: File) => {
    try {
      setPreviews((prev) =>
        prev.map((p) => (p.id === previewId ? { ...p, status: "analyzing", error: undefined } : p))
      )

      const res = await analyzePreSubmissionImageApi(file)
      if (res.success && res.data) {
        const data = res.data
        const isOffline = data.analysis_status === "unavailable"
        setPreviews((prev) =>
          prev.map((p) =>
            p.id === previewId
              ? {
                  ...p,
                  status: isOffline ? "offline" : "analyzed",
                  analysis: data,
                }
              : p
          )
        )
      } else {
        setPreviews((prev) =>
          prev.map((p) =>
            p.id === previewId ? { ...p, status: "offline", analysis: null } : p
          )
        )
      }
    } catch {
      // Graceful offline fallback
      setPreviews((prev) =>
        prev.map((p) =>
          p.id === previewId
            ? {
                ...p,
                status: "offline",
                analysis: null,
                error: "Vision AI unavailable — will be reviewed manually.",
              }
            : p
        )
      )
    }
  }

  /* ── Image helpers ── */
  const addFiles = useCallback((incoming: FileList | File[]) => {
    setFileError(null)
    const files = Array.from(incoming)
    const validated: File[] = []

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setFileError(`"${file.name}" is not a supported format. Allowed: ${ALLOWED_EXT_LABEL}.`)
        continue
      }
      if (file.size > MAX_SIZE_BYTES) {
        setFileError(`"${file.name}" exceeds ${MAX_SIZE_MB} MB limit.`)
        continue
      }
      validated.push(file)
    }

    if (validated.length === 0) return

    setPreviews((prev) => {
      const combined = [...prev.map((p) => p.file), ...validated]
      if (combined.length > MAX_FILES) {
        setFileError(`You can attach a maximum of ${MAX_FILES} images.`)
        return prev
      }
      const newItems: ImagePreview[] = validated.map((f) => ({
        id: `${Date.now()}-${Math.random()}`,
        file: f,
        objectUrl: URL.createObjectURL(f),
        status: "idle",
        analysis: null,
      }))

      // Kick off background analysis for each validated file
      setTimeout(() => {
        newItems.forEach((item) => runImageInspection(item.id, item.file))
      }, 50)

      return [...prev, ...newItems]
    })
  }, [])

  const removeImage = (idx: number) => {
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[idx].objectUrl)
      return prev.filter((_, i) => i !== idx)
    })
    setFileError(null)
  }

  /* ── Drag & Drop ── */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const handleDragLeave = () => setIsDragging(false)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
  }

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setError(null)
    setIsSubmitting(true)
    try {
      const files = previews.map((p) => p.file)
      const res = await submitGrievanceApi(text.trim(), files.length > 0 ? files : undefined)
      if (res.success && res.data) {
        previews.forEach((p) => URL.revokeObjectURL(p.objectUrl))
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

  /* ── Success screen ── */
  if (submittedResult) {
    const isImageOnly = submittedResult.ai_classification_method === "computer_vision_multimodal" && !text.trim()
    const usedFallback = submittedResult.ai_classification_method === "backend_keyword_fallback"

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
                {isImageOnly
                  ? "Your grievance was successfully diagnosed and routed using Computer Vision image understanding."
                  : usedFallback
                  ? "AI analysis is temporarily unavailable. Your grievance was submitted with a provisional classification and flagged for human review."
                  : "Your complaint has been automatically processed, categorized, and dispatched by the AI pipeline."}
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
              <span className="text-xs text-muted-foreground font-medium block mb-1">
                {isImageOnly ? "Vision-Identified Category" : "Classified Category"}
              </span>
              <span className="font-semibold text-foreground">{submittedResult.category}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-medium block mb-1">
                {submittedResult.assignments && submittedResult.assignments.length > 1
                  ? `Assigned Departments (${submittedResult.assignments.length})`
                  : "Assigned Department"}
              </span>
              {submittedResult.assignments && submittedResult.assignments.length > 1 ? (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {submittedResult.assignments.map((assign: any, idx: number) => (
                    <span
                      key={assign.id || idx}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
                    >
                      {assign.department?.name || assign.department_name}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="font-semibold text-foreground">
                  {submittedResult.department?.name || submittedResult.category}
                </span>
              )}
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-medium block mb-1">Priority Level</span>
              <PriorityBadge priority={submittedResult.priority} />
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-medium block mb-1">Routing Determination</span>
              <span className="font-semibold text-emerald-700">
                {submittedResult.routing_status === "ASSIGNED"
                  ? "✓ Dispatched to Department Queue"
                  : "⚠ Queued for Officer Review"}
              </span>
            </div>
          </div>

          {/* Multilingual Submission Record */}
          <div className="rounded-xl border bg-card p-4 space-y-3 text-sm">
            <div className="flex items-center justify-between border-b pb-2 flex-wrap gap-2">
              <span className="font-semibold text-foreground text-xs uppercase tracking-wider">
                Multilingual Record & Verification
              </span>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                  {submittedResult.detected_language || "English"} {submittedResult.detected_language_code ? `(${submittedResult.detected_language_code.toUpperCase()})` : ""}
                </span>
                <span className="text-xs text-emerald-600 font-semibold">
                  Submission Status: Successfully submitted
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-xs text-muted-foreground font-medium block mb-1">
                  Original Citizen Submission ({submittedResult.detected_language || "Original"})
                </span>
                <div className="p-3 bg-muted/40 rounded-lg border text-xs text-foreground font-sans whitespace-pre-wrap leading-relaxed">
                  {submittedResult.original_text}
                </div>
              </div>

              {submittedResult.translation_status === "translated" && submittedResult.translated_text && (
                <div>
                  <span className="text-xs font-semibold text-emerald-800 block mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    English Translation (Ingested by AI Routing Pipeline)
                  </span>
                  <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-lg text-xs text-foreground font-sans whitespace-pre-wrap leading-relaxed">
                    {submittedResult.translated_text}
                  </div>
                </div>
              )}

              {submittedResult.translation_status === "passthrough" && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Submitted natively in English (no translation required).
                </p>
              )}

              {(submittedResult.translation_status === "unavailable" || submittedResult.translation_status === "failed") && submittedResult.detected_language !== "English" && (
                <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
                  ⚠ Automated translation was unavailable at submission time. Your original complaint has been preserved verbatim for manual departmental review.
                </p>
              )}
            </div>
          </div>

          <div className="border-t pt-4 flex flex-wrap gap-3">
            <Button id="track-grievance-btn" onClick={() => navigate(`/citizen/grievances/${submittedResult.id}`)}>
              Track Grievance
            </Button>
            <Button variant="outline" onClick={() => { setSubmittedResult(null); setText(""); setPreviews([]) }}>
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

  /* ── Form ── */
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">Submit New Grievance</h1>
        <p className="page-subtitle mt-1">
          Upload an image of a civic defect for instant Vision AI diagnosis, or describe your complaint in any official Indian language or English.
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

      {hasOnlyUnrelatedImages && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
          <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-bold text-amber-950">Non-Civic Image Detected</p>
            <p className="mt-0.5">
              The uploaded image does not appear to show a recognizable public infrastructure problem (e.g., roads, garbage, water leaks, or electric poles). To submit a grievance, please upload a relevant defect photo or provide a written description below.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="section-card space-y-5">
        {/* Text input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="grievance-text" className="form-label mb-0">
              Complaint Description{" "}
              {hasCivicImage ? (
                <span className="text-xs font-normal text-muted-foreground">(optional — visual evidence detected)</span>
              ) : (
                <span className="text-rose-500">*</span>
              )}
            </label>
            <span className={`text-xs font-mono ${charCount > 5000 ? "text-rose-600 font-bold" : "text-muted-foreground"}`}>
              {charCount} / 5000
            </span>
          </div>
          <textarea
            id="grievance-text"
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              hasCivicImage
                ? "Optional: Add extra context or specific landmark details here…"
                : "Type or paste your complaint here… (e.g., There has been a broken water pipe on 4th cross street for 2 days.)"
            }
            className="form-textarea"
          />
          {text.length > 0 && text.trim().length < 3 && (
            <p className="text-xs text-rose-600">Minimum 3 characters required when submitting text.</p>
          )}

          {/* Real-time Language Detection & English Translation Preview Card */}
          {text.trim().length >= 3 && (
            <div id="translation-preview-panel" className="rounded-xl border bg-card p-3.5 space-y-3 transition-all duration-200">
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
                    </svg>
                    Language Detection:
                  </span>
                  {translationStatus === "detecting" || translationStatus === "translating" ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="spinner w-3 h-3" />
                      {translationStatus === "detecting" ? "Identifying language…" : "Translating to English…"}
                    </span>
                  ) : translationPreview ? (
                    <span id="detected-language-badge" className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {translationPreview.detected_language} ({translationPreview.detected_language_code.toUpperCase()})
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Evaluating text…</span>
                  )}
                </div>

                {/* Status indicator */}
                {translationPreview && (
                  <div>
                    {translationPreview.detected_language === "English" || translationPreview.translation_status === "passthrough" ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        Native English Submission
                      </span>
                    ) : translationPreview.translation_status === "translated" ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Translation Completed
                      </span>
                    ) : translationPreview.translation_status === "unsupported" ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        Unsupported Language · Queued for Manual Review
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                        Translation Unavailable · Original Preserved
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Translation preview text box */}
              {translationPreview && translationPreview.detected_language !== "English" && translationPreview.translation_status === "translated" && (
                <div id="english-translation-preview" className="bg-sky-50/70 border border-sky-200 rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-sky-900">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
                      English Translation Preview (Used for Department Routing):
                    </span>
                    <span className="text-[10px] text-sky-700 font-mono">EN · PROVISIONAL</span>
                  </div>
                  <p className="text-xs text-foreground font-sans leading-relaxed">
                    "{translationPreview.translated_text}"
                  </p>
                  <p className="text-[11px] text-muted-foreground pt-1">
                    ✓ Your original {translationPreview.detected_language} text is preserved and will be displayed in the officer oversight portal.
                  </p>
                </div>
              )}

              {/* Translation unavailable notice */}
              {translationPreview && translationPreview.detected_language !== "English" && translationPreview.translation_status !== "translated" && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Offline Translation / Human Officer Review
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Automatic translation is currently unavailable or unconfigured for this text. You may proceed with submission: your original {translationPreview.detected_language} text will be preserved verbatim and assigned for manual review.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Image upload zone */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="form-label mb-0">
              Supporting Images / Defect Photos{" "}
              <span className="text-xs font-normal text-muted-foreground">(up to {MAX_FILES} photos, supports image-only reporting)</span>
            </label>
            {previews.length > 0 && (
              <span className="text-xs text-muted-foreground">{previews.length} / {MAX_FILES} attached</span>
            )}
          </div>

          {/* Drop zone */}
          {previews.length < MAX_FILES && (
            <div
              role="button"
              tabIndex={0}
              aria-label="Upload defect photos"
              className={[
                "relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center cursor-pointer transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/60 hover:bg-muted/30",
              ].join(" ")}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {isDragging ? "Drop defect photos here" : "Click or drag defect images here"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {ALLOWED_EXT_LABEL} · Max {MAX_SIZE_MB} MB per file · Instant AI Vision analysis
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                id="grievance-images"
                multiple
                accept={ALLOWED_TYPES.join(",")}
                className="sr-only"
                onChange={(e) => {
                  if (e.target.files) {
                    addFiles(e.target.files)
                    e.target.value = ""
                  }
                }}
              />
            </div>
          )}

          {/* File error */}
          {fileError && (
            <p className="text-xs text-rose-600 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
              </svg>
              {fileError}
            </p>
          )}

          {/* Interactive Image Cards */}
          {previews.length > 0 && (
            <div className="space-y-3">
              {previews.map((p, idx) => {
                const analysis = p.analysis
                const isCivic = analysis?.is_grievance_related && analysis?.issue_detected
                const isUnrelated = analysis?.image_type === "unrelated" || (analysis && !analysis.is_grievance_related)
                const isUncertain = analysis?.image_type === "uncertain"

                return (
                  <div
                    key={p.id}
                    className="flex flex-col sm:flex-row items-start gap-4 p-3 rounded-xl border bg-card text-xs shadow-xs"
                  >
                    {/* Thumbnail preview */}
                    <div className="relative rounded-lg overflow-hidden border bg-muted aspect-video w-full sm:w-36 flex-shrink-0">
                      <img src={p.objectUrl} alt={p.file.name} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        aria-label={`Remove ${p.file.name}`}
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-rose-600 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Analysis diagnosis details */}
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-mono font-medium text-[11px] truncate max-w-[180px] text-muted-foreground">
                          {p.file.name} ({formatBytes(p.file.size)})
                        </span>

                        {/* Status Badges */}
                        {p.status === "analyzing" && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                            <span className="w-2 h-2 rounded-full bg-sky-600 animate-pulse" />
                            Analyzing with AI…
                          </span>
                        )}
                        {p.status === "analyzed" && isCivic && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ✓ Civic Issue: {analysis?.detected_issue}
                          </span>
                        )}
                        {p.status === "analyzed" && isUnrelated && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            ⚠ Non-Civic Image
                          </span>
                        )}
                        {p.status === "analyzed" && isUncertain && !isUnrelated && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            ⚠ Image Indistinct
                          </span>
                        )}
                        {(p.status === "offline" || p.status === "failed") && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            Vision Offline · Queued for Review
                          </span>
                        )}
                      </div>

                      {/* Content descriptions */}
                      {p.status === "analyzing" && (
                        <p className="text-muted-foreground italic">
                          Vision AI is inspecting visual features, objects, and defect patterns…
                        </p>
                      )}

                      {isCivic && analysis && (
                        <div className="space-y-1">
                          <p className="font-semibold text-foreground">
                            Recommended Department:{" "}
                            <span className="text-primary">{analysis.recommended_department}</span>
                          </p>
                          {analysis.issue_description && (
                            <p className="text-muted-foreground leading-snug">{analysis.issue_description}</p>
                          )}
                          {analysis.visual_observations && analysis.visual_observations.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {analysis.visual_observations.map((obs, i) => (
                                <span key={i} className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground">
                                  {obs}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {isUnrelated && analysis && (
                        <p className="text-rose-700 font-medium">
                          {analysis.citizen_message ||
                            "This image does not contain an identifiable civic grievance. Please remove it or add written complaint details."}
                        </p>
                      )}

                      {isUncertain && analysis && (
                        <p className="text-amber-800">
                          {analysis.citizen_message ||
                            "The defect in this image is unclear. Adding a text description will help officers process your grievance."}
                        </p>
                      )}

                      {(p.status === "offline" || p.status === "failed") && (
                        <p className="text-slate-600">
                          AI vision analysis is currently unconfigured or offline. Your image will be securely attached and verified manually by an officer.
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* AI pipeline info */}
        <div className="info-banner flex items-start gap-3">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold text-sky-800 mb-0.5">Automated Multimodal Dispatch Active</p>
            <p className="text-sky-700">
              {hasCivicImage && !text.trim()
                ? "Image-only submission mode enabled. The complaint will be created and routed directly to the diagnosed department."
                : "Category, priority, and department are assigned automatically using combined text NLP and Computer Vision inspection. Supports English and 10 Indian regional languages."}
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
            disabled={!canSubmit}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="spinner w-4 h-4" />
                Analyzing &amp; Submitting…
              </>
            ) : hasCivicImage && !text.trim() ? (
              `Submit Image Grievance (${previews.length})`
            ) : (
              `Submit Grievance${previews.length > 0 ? ` + ${previews.length} Image${previews.length > 1 ? "s" : ""}` : ""}`
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
