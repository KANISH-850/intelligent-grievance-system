import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getOfficerGrievancesApi } from "@/core/api/grievanceApi"
import type { Grievance } from "@/shared/types/grievance"
import { useAuth } from "@/features/auth/AuthContext"
import { StatusBadge } from "@/shared/ui/StatusBadge"
import { PriorityBadge } from "@/shared/ui/PriorityBadge"
import { Button } from "@/shared/ui/button"

export function OfficerDashboard() {
  const { user }   = useAuth()
  const [grievances, setGrievances] = useState<Grievance[]>([])
  const [isLoading, setIsLoading]   = useState(true)

  const departmentName = user?.department?.name || "Assigned Department"
  const departmentCode = user?.department?.code || ""

  useEffect(() => {
    async function load() {
      try {
        const res = await getOfficerGrievancesApi()
        if (res.success && res.data) setGrievances(res.data)
      } catch (err) {
        console.error("Officer Dashboard error:", err)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const totalCount    = grievances.length
  const pendingCount  = grievances.filter((g) => ["SUBMITTED","ASSIGNED","UNDER_REVIEW","IN_PROGRESS"].includes(g.status)).length
  const criticalCount = grievances.filter((g) => g.priority === "CRITICAL").length
  const resolvedCount = grievances.filter((g) => g.status === "RESOLVED").length
  const reviewRequired = grievances.filter((g) => g.ai_review_required).length

  const metrics = [
    { label: "Total Departmental", value: totalCount, accent: "text-foreground",
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { label: "Pending Action", value: pendingCount, accent: "text-amber-600",
      icon: <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { label: "Critical / Emergency", value: criticalCount, accent: "text-rose-600",
      icon: <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> },
    { label: "Resolved", value: resolvedCount, accent: "text-emerald-600",
      icon: <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="page-title">Officer Workspace</h1>
            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-primary/10 text-primary border border-primary/20 font-mono">
              {departmentCode ? `${departmentName} · ${departmentCode}` : departmentName}
            </span>
          </div>
          <p className="page-subtitle">Departmental Grievance Operations &amp; Action Queue</p>
        </div>
        <Link to="/officer/grievances">
          <Button id="officer-view-queue-btn" className="gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            View Full Queue
          </Button>
        </Link>
      </div>

      {/* AI Review Required alert */}
      {!isLoading && reviewRequired > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-amber-800 font-medium">
            <strong>{reviewRequired}</strong> grievance{reviewRequired > 1 ? "s require" : " requires"} manual AI classification review.
          </span>
          <Link to="/officer/grievances" className="ml-auto">
            <Button variant="outline" size="sm" className="text-xs border-amber-300 text-amber-800 hover:bg-amber-100">
              Review Now
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

      {/* Action Queue */}
      <div className="section-card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title mb-0">Recent Action Queue</h2>
          <Link to="/officer/grievances">
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              All Grievances
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </Link>
        </div>

        {isLoading && (
          <div className="empty-state">
            <div className="spinner w-8 h-8 mx-auto" />
            <p className="text-sm text-muted-foreground mt-3">Loading action queue…</p>
          </div>
        )}

        {!isLoading && grievances.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">No complaints pending in your department queue.</p>
          </div>
        )}

        {!isLoading && grievances.length > 0 && (
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Grievance No.</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>AI Review</th>
                    <th>Date</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {grievances.slice(0, 8).map((g) => (
                    <tr key={g.id} className={g.ai_review_required ? "bg-amber-50/50" : ""}>
                      <td>
                        <span className="font-mono font-bold text-primary text-xs">{g.grievance_number}</span>
                      </td>
                      <td className="text-xs font-medium max-w-[130px] truncate">{g.category}</td>
                      <td><PriorityBadge priority={g.priority} /></td>
                      <td><StatusBadge status={g.status} /></td>
                      <td>
                        {g.ai_review_required ? (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800 border border-amber-200">
                            Required
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="text-xs text-muted-foreground font-mono">
                        {new Date(g.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </td>
                      <td className="text-right">
                        <Link to={`/officer/grievances/${g.id}`}>
                          <Button variant="outline" size="sm" className="text-xs">Review</Button>
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
