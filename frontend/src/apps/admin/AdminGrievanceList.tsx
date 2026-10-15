import { useEffect, useState, useCallback } from "react"
import { Link } from "react-router-dom"
import { getAdminGrievancesApi } from "@/core/api/grievanceApi"
import type { Grievance } from "@/shared/types/grievance"
import { StatusBadge } from "@/shared/ui/StatusBadge"
import { PriorityBadge } from "@/shared/ui/PriorityBadge"
import { Button } from "@/shared/ui/button"

const KNOWN_DEPARTMENTS = [
  { code: "", name: "All Departments" },
  { code: "WS",   name: "Water Supply" },
  { code: "ELEC", name: "Electricity" },
  { code: "RT",   name: "Roads & Transport" },
  { code: "HC",   name: "Healthcare" },
  { code: "EDU",  name: "Education" },
  { code: "SAN",  name: "Sanitation" },
  { code: "MS",   name: "Municipal Services" },
  { code: "REV",  name: "Revenue" },
  { code: "OTH",  name: "Other" },
]

export function AdminGrievanceList() {
  const [grievances, setGrievances]           = useState<Grievance[]>([])
  const [isLoading, setIsLoading]             = useState(true)
  const [error, setError]                     = useState<string | null>(null)
  const [departmentFilter, setDepartment]     = useState("")
  const [statusFilter, setStatus]             = useState("")
  const [priorityFilter, setPriority]         = useState("")
  const [searchQuery, setSearch]              = useState("")
  const [showAiReview, setShowAiReview]       = useState(false)

  const loadGrievances = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getAdminGrievancesApi({
        department_id: departmentFilter || undefined,
        status:        statusFilter     || undefined,
        priority:      priorityFilter   || undefined,
      })
      if (res.success && res.data) { setGrievances(res.data) }
      else throw new Error(res.message || "Failed to load system grievances.")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to fetch system grievances.")
    } finally {
      setIsLoading(false)
    }
  }, [departmentFilter, statusFilter, priorityFilter])

  useEffect(() => {
    let isMounted = true
    getAdminGrievancesApi({
      department_id: departmentFilter || undefined,
      status:        statusFilter     || undefined,
      priority:      priorityFilter   || undefined,
    })
      .then((res) => {
        if (!isMounted) return
        if (res.success && res.data) { setGrievances(res.data); setError(null) }
        else setError(res.message || "Failed.")
      })
      .catch((err: unknown) => {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : "Unable to fetch system grievances.")
      })
      .finally(() => { if (isMounted) setIsLoading(false) })
    return () => { isMounted = false }
  }, [departmentFilter, statusFilter, priorityFilter])

  const filtered = grievances.filter((g) => {
    if (showAiReview && !g.ai_review_required) return false
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      g.grievance_number.toLowerCase().includes(q) ||
      g.category.toLowerCase().includes(q) ||
      (g.user?.name ?? "").toLowerCase().includes(q) ||
      (g.department?.name ?? "").toLowerCase().includes(q)
    )
  })

  const aiReviewCount = grievances.filter((g) => g.ai_review_required).length

  const hasFilters = departmentFilter || statusFilter || priorityFilter || searchQuery || showAiReview

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header border-b pb-5">
        <div>
          <h1 className="page-title">System-Wide Grievance Oversight</h1>
          <p className="page-subtitle">Central Administrative Control &amp; Department Monitoring Dashboard</p>
        </div>
        {aiReviewCount > 0 && (
          <button
            onClick={() => setShowAiReview(!showAiReview)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${
              showAiReview
                ? "bg-amber-100 text-amber-800 border-amber-300"
                : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {showAiReview ? "Show All" : `AI Review Required (${aiReviewCount})`}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="section-card !p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search number, category, name…"
            value={searchQuery}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-9 text-xs"
          />
        </div>

        <select value={departmentFilter} onChange={(e) => setDepartment(e.target.value)} className="filter-select min-w-[150px]">
          {KNOWN_DEPARTMENTS.map((d) => (
            <option key={d.code} value={d.code}>{d.name}</option>
          ))}
        </select>

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

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => { setDepartment(""); setStatus(""); setPriority(""); setSearch(""); setShowAiReview(false) }} className="text-xs">
            Clear All
          </Button>
        )}
        {!isLoading && (
          <span className="text-xs text-muted-foreground ml-auto">
            {filtered.length} of {grievances.length} records
          </span>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="section-card">
          <div className="empty-state">
            <div className="spinner w-8 h-8 mx-auto" />
            <p className="text-sm text-muted-foreground mt-3">Loading system grievances…</p>
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
            <p className="text-sm text-muted-foreground">No grievances match the selected filter criteria.</p>
            {hasFilters && (
              <Button size="sm" variant="outline" className="mt-1" onClick={() => { setDepartment(""); setStatus(""); setPriority(""); setSearch(""); setShowAiReview(false) }}>
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
                  <th>Complainant</th>
                  <th>Category</th>
                  <th>Department</th>
                  <th>Priority</th>
                  <th>Status</th>
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
                    <td>
                      <p className="text-xs font-medium">{g.user?.name || "Citizen"}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{g.user?.email}</p>
                    </td>
                    <td className="text-xs font-medium max-w-[120px] truncate">{g.category}</td>
                    <td className="text-xs font-semibold max-w-[120px] truncate">{g.department?.name || g.category}</td>
                    <td><PriorityBadge priority={g.priority} /></td>
                    <td><StatusBadge status={g.status} /></td>
                    <td>
                      {g.ai_review_required ? (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">⚠ Required</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                      {new Date(g.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}
                    </td>
                    <td className="text-right pr-4">
                      <Link to={`/admin/grievances/${g.id}`}>
                        <Button variant="outline" size="sm" className="text-xs">Inspect</Button>
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
