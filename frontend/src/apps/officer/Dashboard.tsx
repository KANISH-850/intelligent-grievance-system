import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getOfficerGrievancesApi } from "@/core/api/grievanceApi"
import type { Grievance } from "@/shared/types/grievance"
import { useAuth } from "@/features/auth/AuthContext"
import { StatusBadge } from "@/shared/ui/StatusBadge"
import { PriorityBadge } from "@/shared/ui/PriorityBadge"
import { Button } from "@/shared/ui/button"

export function OfficerDashboard() {
  const { user } = useAuth()
  const [grievances, setGrievances] = useState<Grievance[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const departmentName = user?.department?.name || "Assigned Department"
  const departmentCode = user?.department?.code || ""

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getOfficerGrievancesApi()
        if (res.success && res.data) {
          setGrievances(res.data)
        }
      } catch (err) {
        console.error("Officer Dashboard error:", err)
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
  const criticalCount = grievances.filter((g) => g.priority === "CRITICAL").length
  const resolvedCount = grievances.filter((g) => g.status === "RESOLVED").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold tracking-tight">Officer Portal</h2>
            <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-primary text-primary-foreground font-mono">
              {departmentCode ? `${departmentName} [${departmentCode}]` : departmentName}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Departmental Grievance Operations & Action Queue
          </p>
        </div>
        <Link to="/officer/grievances">
          <Button>View Department Queue →</Button>
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
            Total Departmental
          </h3>
          <p className="text-3xl font-bold mt-2 font-mono">{isLoading ? "..." : totalCount}</p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
            Pending Action
          </h3>
          <p className="text-3xl font-bold text-amber-600 mt-2 font-mono">
            {isLoading ? "..." : pendingCount}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
            Critical Emergency
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

      {/* Action Queue */}
      <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Action Needed (Recent Submissions)</h3>
          <Link to="/officer/grievances">
            <Button variant="ghost" size="sm">
              All Grievances →
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading action queue...</p>
        ) : grievances.length === 0 ? (
          <div className="p-8 text-center border border-dashed rounded-lg space-y-2">
            <p className="text-sm text-muted-foreground">No complaints currently pending in your department queue.</p>
          </div>
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
                    <span className="text-xs text-muted-foreground font-mono">
                      {new Date(g.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 max-w-md">
                    {g.original_text}
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <StatusBadge status={g.status} />
                  <Link to={`/officer/grievances/${g.id}`}>
                    <Button variant="outline" size="sm">
                      Review & Update
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
