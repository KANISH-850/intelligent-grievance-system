import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getCitizenGrievancesApi } from "@/core/api/grievanceApi"
import type { Grievance } from "@/shared/types/grievance"
import { StatusBadge } from "@/shared/ui/StatusBadge"
import { PriorityBadge } from "@/shared/ui/PriorityBadge"
import { Button } from "@/shared/ui/button"
import { useAuth } from "@/features/auth/AuthContext"

function MetricCard({
  label,
  value,
  accent,
  icon,
  loading,
}: {
  label: string
  value: number
  accent?: string
  icon: React.ReactNode
  loading: boolean
}) {
  return (
    <div className="metric-card">
      <div className="flex items-start justify-between">
        <div className="space-y-1 min-w-0">
          <p className="metric-label">{label}</p>
          <p className={`metric-value ${accent ?? "text-foreground"}`}>
            {loading ? "—" : value}
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground">
          {icon}
        </div>
      </div>
    </div>
  )
}

export function Dashboard() {
  const { user } = useAuth()
  const [grievances, setGrievances] = useState<Grievance[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getCitizenGrievancesApi()
        if (res.success && res.data) {
          setGrievances(res.data)
        }
      } catch (err) {
        console.error("Dashboard error:", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const totalCount    = grievances.length
  const activeCount   = grievances.filter((g) => !["RESOLVED", "REJECTED"].includes(g.status)).length
  const resolvedCount = grievances.filter((g) => g.status === "RESOLVED").length

  const recentFive = grievances.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user?.name?.split(" ")[0] ?? "Citizen"}</h1>
          <p className="page-subtitle">
            Centralized Public Grievance Redressal Portal — track and manage your complaints.
          </p>
        </div>
        <Link to="/citizen/submit">
          <Button id="submit-new-grievance-btn" className="gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Submit New Grievance
          </Button>
        </Link>
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Total Submitted"
          value={totalCount}
          loading={isLoading}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <MetricCard
          label="Pending Resolution"
          value={activeCount}
          accent="text-amber-600"
          loading={isLoading}
          icon={
            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <MetricCard
          label="Successfully Resolved"
          value={resolvedCount}
          accent="text-emerald-600"
          loading={isLoading}
          icon={
            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Recent grievances */}
      <div className="section-card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title mb-0">Recent Grievances</h2>
          <Link to="/citizen/grievances">
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
            <p className="text-sm text-muted-foreground mt-3">Loading your grievances…</p>
          </div>
        )}

        {!isLoading && grievances.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-foreground">No grievances yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              You have not submitted any grievances. Submit your first complaint to get started.
            </p>
            <Link to="/citizen/submit">
              <Button size="sm" className="mt-2">Submit Your First Grievance</Button>
            </Link>
          </div>
        )}

        {!isLoading && recentFive.length > 0 && (
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Grievance No.</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentFive.map((g) => (
                    <tr key={g.id}>
                      <td>
                        <span className="font-mono font-bold text-primary text-xs">{g.grievance_number}</span>
                      </td>
                      <td className="font-medium text-xs text-foreground max-w-[140px] truncate">{g.category}</td>
                      <td><PriorityBadge priority={g.priority} /></td>
                      <td><StatusBadge status={g.status} /></td>
                      <td className="text-xs text-muted-foreground font-mono">
                        {new Date(g.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="text-right">
                        <Link to={`/citizen/grievances/${g.id}`}>
                          <Button variant="outline" size="sm" className="text-xs">Track</Button>
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

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/citizen/submit" className="section-card flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer group">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Submit New Grievance</p>
            <p className="text-xs text-muted-foreground">Write your complaint in any Indian language</p>
          </div>
        </Link>

        <Link to="/citizen/chatbot" className="section-card flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer group">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-500/20 transition-colors">
            <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">AI Assistant</p>
            <p className="text-xs text-muted-foreground">Ask about grievance status in your language</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
