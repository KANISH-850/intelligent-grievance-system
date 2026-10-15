import { useState } from "react"
import { Button } from "@/shared/ui/button"

interface CorrectClassificationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (category: string, remarks: string) => Promise<void>
  currentCategory: string
  isSubmitting?: boolean
}

const CATEGORIES = [
  "Water Supply",
  "Electricity",
  "Roads and Transport",
  "Healthcare",
  "Education",
  "Sanitation",
  "Municipal Services",
  "Revenue",
  "Other",
]

export function CorrectClassificationModal({
  isOpen,
  onClose,
  onConfirm,
  currentCategory,
  isSubmitting = false,
}: CorrectClassificationModalProps) {
  const [selectedCategory, setSelected] = useState(currentCategory)
  const [remarks, setRemarks]           = useState("")
  const [error, setError]               = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCategory) {
      setError("Please select a target category.")
      return
    }
    try {
      setError(null)
      await onConfirm(selectedCategory, remarks)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update category.")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
          <div>
            <h3 className="font-bold text-base">Human Classification Correction</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Override AI classification and update department routing.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Current category display */}
          <div className="flex items-center gap-3 p-3 bg-muted/30 border rounded-lg text-sm">
            <span className="text-xs text-muted-foreground font-medium">Current AI Category:</span>
            <span className="font-semibold text-foreground">{currentCategory}</span>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
              </svg>
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="correct-category-select" className="form-label text-xs uppercase tracking-wider text-muted-foreground mb-0">
              Corrected Category <span className="text-rose-500">*</span>
            </label>
            <select
              id="correct-category-select"
              value={selectedCategory}
              onChange={(e) => setSelected(e.target.value)}
              className="filter-select w-full text-sm py-2"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="correction-remarks" className="form-label text-xs uppercase tracking-wider text-muted-foreground mb-0">
              Correction Remarks (optional)
            </label>
            <textarea
              id="correction-remarks"
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Verified by admin officer; corrected from Water Supply to Electricity…"
              className="form-textarea text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button id="confirm-classification-btn" type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <span className="spinner w-4 h-4" />
                  Saving…
                </>
              ) : (
                "Confirm Correction"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
