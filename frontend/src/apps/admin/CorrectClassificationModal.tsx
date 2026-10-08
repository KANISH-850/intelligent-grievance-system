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
  const [selectedCategory, setSelectedCategory] = useState(currentCategory)
  const [remarks, setRemarks] = useState("")
  const [error, setError] = useState<string | null>(null)

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border rounded-xl shadow-xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in duration-150">
        <div className="border-b pb-3">
          <h3 className="text-lg font-bold text-foreground">Human Classification Correction</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manually override AI classification and update destination department routing.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Select Correct Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-background border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Correction Remarks (Optional)
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Verified by admin officer; corrected department routing from Water to Electricity"
              className="w-full bg-background border rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Confirm Correction"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
