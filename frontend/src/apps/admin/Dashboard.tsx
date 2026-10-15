import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getAdminGrievancesApi } from "@/core/api/grievanceApi"
import type { Grievance } from "@/shared/types/grievance"
import { StatusBadge } from "@/shared/ui/StatusBadge"
import { PriorityBadge } from "@/shared/ui/PriorityBadge"
import { Button } from "@/shared/ui/button"

export function AdminDashboard() {
  const [grievances, setGrievances] = useState<Grievance[]>([])
  const [isLoading, setIsLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await getAdminGrievancesApi()
        if (res.success && res.data) setGrievances(res.data)
      } catch (err) {
        console.error("Admin Dashboard error:", err)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const totalCount    = grievances.length
  const pendingCount  = grievances.filter((g) => ["SUBMITTED","ASSIGNED","UNDER_REVIEW","IN_PROGRESS"].includes(g.status)).length
  const resolvedCount = grievances.filter((g) => g.status === "RESOLVED").length
  const criticalCount = grievances.filter((g) => g.priority === "CRITICAL").length
  const aiReviewCount = grievances.filter((g) => g.ai_review_required).length

  const resolutionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0

  const metrics = [
    { label: "Total System Grievances", value: totalCount, accent: "text-foreground",
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
    { label: "Pending Resolution", value: pendingCount, accent: "text-amber-600",
      icon: <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { label: "Critical Escalations", value: criticalCount, accent: "text-rose-600",
      icon: <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> },
    { label: "Resolved Complaints", value: resolvedCount, accent: "text-emerald-600",
      icon: <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header border-b pb-5">
        <div>
          <h1 className="page-title">Admin Command Centre</h1>
          <p className="page-subtitle">Central Government Portal — System-wide overview &amp; administration</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/admin/grievances">
            <Button id="admin-view-all-btn" className="gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              All Grievances
            </Button>
          </Link>
          <Link to="/admin/departments">
            <Button variant="outline">Department View</Button>
          </Link>
        </div>
      </div>

      {/* AI Review Alert */}
      {!isLoading && aiReviewCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-amber-800 font-medium">
            <strong>{aiReviewCount}</strong> grievance{aiReviewCount > 1 ? "s require" : " requires"} AI classification review.
          </span>
          <Link to="/admin/grievances" className="ml-auto">
            <Button variant="outline" size="sm" className="text-xs border-amber-300 text-amber-800 hover:bg-amber-100">
              Review Queue
            </Button>
          </Link>
        </div>
      )}

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="metric-card">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="metric-label">{m.label}</p>
                <p className={`metric-value ${m.accent}`}>{isLoading ? "—" : m.value}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                {m.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resolution rate bar */}
      {!isLoading && totalCount > 0 && (
        <div className="section-card">
          <div className="flex items-center justify-between mb-2">
            <h2 className="section-title mb-0">System Resolution Rate</h2>
            <span className="text-2xl font-extrabold font-mono text-emerald-600">{resolutionRate}%</span>
          </div>
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill bg-emerald-500"
              style={{ width: `${resolutionRate}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {resolvedCount} resolved out of {totalCount} total complaints
          </p>
        </div>
      )}

      {/* Recent activity */}
      <div className="section-card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title mb-0">Recent System Activity</h2>
          <Link to="/admin/grievances">
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              View All
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </Link>
        </div>

        {isLoading && (
          <div className="empty-state">
            <div className="spinner w-8 h-8 mx-auto" />
            <p className="text-sm text-muted-foreground mt-3">Loading system activity…</p>
          </div>
        )}

        {!isLoading && grievances.length === 0 && (
          <div className="empty-state">
            <p className="text-sm text-muted-foreground">No grievances recorded in the system.</p>
          </div>
        )}

        {!isLoading && grievances.length > 0 && (
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Grievance No.</th>
                    <th>Category / Department</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>AI Review</th>
                    <th>Date</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {grievances.slice(0, 8).map((g) => (
                    <tr key={g.id} className={g.ai_review_required ? "bg-amber-50/40" : ""}>
                      <td>
                        <span className="font-mono font-bold text-primary text-xs">{g.grievance_number}</span>
                      </td>
                      <td>
                        <p className="text-xs font-medium">{g.category}</p>
                        <p className="text-[11px] text-muted-foreground">{g.department?.name}</p>
                      </td>
                      <td><PriorityBadge priority={g.priority} /></td>
                      <td><StatusBadge status={g.status} /></td>
                      <td>
                        {g.ai_review_required ? (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800 border border-amber-200">⚠ Required</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                        {new Date(g.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}
                      </td>
                      <td className="text-right">
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
    </div>
  )
}
