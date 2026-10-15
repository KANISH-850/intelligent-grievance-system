import { useEffect, useState, useCallback } from "react"
import { Link } from "react-router-dom"
import { getOfficerGrievancesApi } from "@/core/api/grievanceApi"
import type { Grievance } from "@/shared/types/grievance"
import { useAuth } from "@/features/auth/AuthContext"
import { StatusBadge } from "@/shared/ui/StatusBadge"
import { PriorityBadge } from "@/shared/ui/PriorityBadge"
import { Button } from "@/shared/ui/button"

export function OfficerGrievanceList() {
  const { user } = useAuth()
  const [grievances, setGrievances]   = useState<Grievance[]>([])
  const [isLoading, setIsLoading]     = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [statusFilter, setStatus]     = useState("")
  const [priorityFilter, setPriority] = useState("")
  const [searchQuery, setSearch]      = useState("")

  const departmentName = user?.department?.name || "Assigned Department"
  const departmentCode = user?.department?.code || ""

  const loadGrievances = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getOfficerGrievancesApi({
        status:   statusFilter || undefined,
        priority: priorityFilter || undefined,
      })
      if (res.success && res.data) {
        setGrievances(res.data)
      } else {
        throw new Error(res.message || "Failed to load departmental grievances.")
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to fetch grievances.")
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, priorityFilter])

  useEffect(() => {
    let isMounted = true
    getOfficerGrievancesApi({
      status:   statusFilter || undefined,
      priority: priorityFilter || undefined,
    })
      .then((res) => {
        if (!isMounted) return
        if (res.success && res.data) { setGrievances(res.data); setError(null) }
        else setError(res.message || "Failed.")
      })
      .catch((err: unknown) => {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : "Unable to fetch grievances.")
      })
      .finally(() => { if (isMounted) setIsLoading(false) })
    return () => { isMounted = false }
  }, [statusFilter, priorityFilter])

  // Client-side search on top of server filters
  const filtered = grievances.filter((g) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      g.grievance_number.toLowerCase().includes(q) ||
      g.category.toLowerCase().includes(q) ||
      g.original_text.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header border-b pb-5">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="page-title">Departmental Grievances</h1>
            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-primary/10 text-primary border border-primary/20 font-mono">
              {departmentCode ? `${departmentName} · ${departmentCode}` : departmentName}
            </span>
          </div>
          <p className="page-subtitle">Review, inspect, and process complaints routed to your administrative domain.</p>
        </div>
      </div>

      {/* Filters bar */}
      <div className="section-card !p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search grievances…"
            value={searchQuery}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-9 text-xs"
          />
        </div>

        <select value={statusFilter} onChange={(e) => setStatus(e.target.value)} className="filter-select min-w-[140px]">
          <option value="">All Statuses</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="REJECTED">Rejected</option>
        </select>

        <select value={priorityFilter} onChange={(e) => setPriority(e.target.value)} className="filter-select min-w-[130px]">
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>

        {(statusFilter || priorityFilter || searchQuery) && (
          <Button variant="ghost" size="sm" onClick={() => { setStatus(""); setPriority(""); setSearch("") }} className="text-xs">
            Clear Filters
          </Button>
        )}

        {!isLoading && (
          <span className="text-xs text-muted-foreground ml-auto">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="section-card">
          <div className="empty-state">
            <div className="spinner w-8 h-8 mx-auto" />
            <p className="text-sm text-muted-foreground mt-3">Loading departmental grievances…</p>
          </div>
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="error-banner flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={loadGrievances}>Retry</Button>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && filtered.length === 0 && (
        <div className="section-card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">No grievances found matching the selected criteria.</p>
            {(statusFilter || priorityFilter || searchQuery) && (
              <Button size="sm" variant="outline" className="mt-1" onClick={() => { setStatus(""); setPriority(""); setSearch("") }}>
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && filtered.length > 0 && (
        <div className="section-card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Grievance No.</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Language</th>
                  <th>AI Confidence</th>
                  <th>AI Review</th>
                  <th>Date</th>
                  <th className="text-right pr-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((g) => (
                  <tr key={g.id} className={g.ai_review_required ? "bg-amber-50/40" : ""}>
                    <td>
                      <span className="font-mono font-bold text-primary text-xs">{g.grievance_number}</span>
                    </td>
                    <td className="text-xs font-medium max-w-[120px] truncate">{g.category}</td>
                    <td><PriorityBadge priority={g.priority} /></td>
                    <td><StatusBadge status={g.status} /></td>
                    <td className="text-xs text-muted-foreground">{g.detected_language || "English"}</td>
                    <td className="text-xs">
                      {g.ai_confidence !== null && g.ai_confidence !== undefined ? (
                        <span className="font-mono">{(g.ai_confidence * 100).toFixed(0)}%</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td>
                      {g.ai_review_required ? (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
                          ⚠ Required
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                      {new Date(g.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}
                    </td>
                    <td className="text-right pr-4">
                      <Link to={`/officer/grievances/${g.id}`}>
                        <Button variant="outline" size="sm" className="text-xs">Review & Update</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
