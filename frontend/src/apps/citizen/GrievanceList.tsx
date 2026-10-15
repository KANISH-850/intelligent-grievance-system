import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getCitizenGrievancesApi } from "@/core/api/grievanceApi"
import type { Grievance } from "@/shared/types/grievance"
import { StatusBadge } from "@/shared/ui/StatusBadge"
import { PriorityBadge } from "@/shared/ui/PriorityBadge"
import { Button } from "@/shared/ui/button"

export function GrievanceList() {
  const [grievances, setGrievances]   = useState<Grievance[]>([])
  const [isLoading, setIsLoading]     = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [reloadTrigger, setReload]    = useState(0)
  const [statusFilter, setStatus]     = useState("")
  const [searchQuery, setSearch]      = useState("")

  useEffect(() => {
    let isMounted = true
    getCitizenGrievancesApi()
      .then((res) => {
        if (!isMounted) return
        if (res.success && res.data) {
          setGrievances(res.data)
          setError(null)
        } else {
          setError(res.message || "Failed to load grievances.")
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : "Unable to load grievances.")
      })
      .finally(() => { if (isMounted) setIsLoading(false) })
    return () => { isMounted = false }
  }, [reloadTrigger])

  const handleRetry = () => {
    setError(null)
    setReload((p) => p + 1)
  }

  const filtered = grievances.filter((g) => {
    const matchStatus = !statusFilter || g.status === statusFilter
    const q = searchQuery.toLowerCase()
    const matchSearch =
      !q ||
      g.grievance_number.toLowerCase().includes(q) ||
      g.category.toLowerCase().includes(q) ||
      (g.department?.name ?? "").toLowerCase().includes(q) ||
      g.original_text.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Grievances</h1>
          <p className="page-subtitle">Track and monitor the resolution status of your submitted complaints.</p>
        </div>
        <Link to="/citizen/submit">
          <Button id="citizen-submit-btn" className="gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Grievance
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="section-card !p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by number, category, department…"
            value={searchQuery}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-9 text-xs"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatus(e.target.value)}
          className="filter-select min-w-[140px]"
        >
          <option value="">All Statuses</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        {(statusFilter || searchQuery) && (
          <Button variant="ghost" size="sm" onClick={() => { setStatus(""); setSearch("") }} className="text-xs">
            Clear Filters
          </Button>
        )}
        {!isLoading && (
          <span className="text-xs text-muted-foreground ml-auto">
            {filtered.length} of {grievances.length} complaint{grievances.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="section-card">
          <div className="empty-state">
            <div className="spinner w-8 h-8 mx-auto" />
            <p className="text-sm text-muted-foreground mt-3">Loading your grievances…</p>
          </div>
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="error-banner flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={handleRetry}>Retry</Button>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && filtered.length === 0 && (
        <div className="section-card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            {grievances.length === 0 ? (
              <>
                <h3 className="text-sm font-semibold">No Grievances Yet</h3>
                <p className="text-sm text-muted-foreground">You haven't submitted any complaints yet.</p>
                <Link to="/citizen/submit"><Button size="sm" className="mt-1">Submit Your First Grievance</Button></Link>
              </>
            ) : (
              <>
                <h3 className="text-sm font-semibold">No Results</h3>
                <p className="text-sm text-muted-foreground">No grievances match your current filters.</p>
                <Button size="sm" variant="outline" className="mt-1" onClick={() => { setStatus(""); setSearch("") }}>
                  Clear Filters
                </Button>
              </>
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
                  <th>Department</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th className="text-right pr-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((g) => (
                  <tr key={g.id}>
                    <td>
                      <span className="font-mono font-bold text-primary text-xs">{g.grievance_number}</span>
                    </td>
                    <td className="font-medium text-xs max-w-[130px] truncate">{g.category}</td>
                    <td className="text-xs text-muted-foreground max-w-[140px] truncate">
                      {g.department?.name || g.category}
                    </td>
                    <td><PriorityBadge priority={g.priority} /></td>
                    <td><StatusBadge status={g.status} /></td>
                    <td className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                      {new Date(g.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="text-right pr-4">
                      <Link to={`/citizen/grievances/${g.id}`}>
                        <Button variant="outline" size="sm" className="text-xs">Track Details</Button>
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
