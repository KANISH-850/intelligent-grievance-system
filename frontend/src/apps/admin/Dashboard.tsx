import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getAdminGrievancesApi } from "@/core/api/grievanceApi"
import type { Grievance } from "@/shared/types/grievance"
import { StatusBadge } from "@/shared/ui/StatusBadge"
import { PriorityBadge } from "@/shared/ui/PriorityBadge"
import { Button } from "@/shared/ui/button"

export function AdminDashboard() {
  const [grievances, setGrievances] = useState<Grievance[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getAdminGrievancesApi()
        if (res.success && res.data) {
          setGrievances(res.data)
        }
      } catch (err) {
        console.error("Admin Dashboard error:", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const totalCount = grievances.length
  const pendingCount = grievances.filter((g) =>
    ["SUBMITTED", "ASSIGNED", "UNDER_REVIEW", "IN_PROGRESS"].includes(g.status)
  ).length
  const resolvedCount = grievances.filter((g) => g.status === "RESOLVED").length
  const criticalCount = grievances.filter((g) => g.priority === "CRITICAL").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Admin Portal</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Central Government Portal System Overview & Administration
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link to="/admin/grievances">
            <Button>View All Grievances →</Button>
          </Link>
          <Link to="/admin/departments">
            <Button variant="outline">Department Breakdown</Button>
          </Link>
        </div>
      </div>

      {/* System Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
            Total System Grievances
          </h3>
          <p className="text-3xl font-bold mt-2 font-mono">{isLoading ? "..." : totalCount}</p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
            Pending Resolution
          </h3>
          <p className="text-3xl font-bold text-amber-600 mt-2 font-mono">
            {isLoading ? "..." : pendingCount}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
            Critical Escalations
          </h3>
          <p className="text-3xl font-bold text-red-600 mt-2 font-mono">
            {isLoading ? "..." : criticalCount}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
            Resolved Complaints
          </h3>
          <p className="text-3xl font-bold text-emerald-600 mt-2 font-mono">
            {isLoading ? "..." : resolvedCount}
          </p>
        </div>
      </div>

      {/* System Activity Overview */}
      <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">System-Wide Recent Submissions</h3>
          <Link to="/admin/grievances">
            <Button variant="ghost" size="sm">
              All Grievances →
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading system activity...</p>
        ) : grievances.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No grievances recorded in system.</p>
        ) : (
          <div className="divide-y border rounded-lg overflow-hidden">
            {grievances.slice(0, 5).map((g) => (
              <div
                key={g.id}
                className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors flex-wrap gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-primary">{g.grievance_number}</span>
                    <PriorityBadge priority={g.priority} />
                    <span className="text-xs font-semibold px-2 py-0.5 bg-muted rounded">
                      {g.department?.name || g.category}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 max-w-md">
                    {g.original_text}
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <StatusBadge status={g.status} />
                  <Link to={`/admin/grievances/${g.id}`}>
                    <Button variant="outline" size="sm">
                      Inspect
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
