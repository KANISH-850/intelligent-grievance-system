import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getCitizenGrievancesApi } from "@/core/api/grievanceApi"
import type { Grievance } from "@/shared/types/grievance"
import { StatusBadge } from "@/shared/ui/StatusBadge"
import { PriorityBadge } from "@/shared/ui/PriorityBadge"
import { Button } from "@/shared/ui/button"

export function Dashboard() {
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

  const totalCount = grievances.length
  const activeCount = grievances.filter(
    (g) => !["RESOLVED", "REJECTED"].includes(g.status)
  ).length
  const resolvedCount = grievances.filter((g) => g.status === "RESOLVED").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Citizen Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Welcome to the Centralized Public Grievance Redressal Portal.
          </p>
        </div>
        <Link to="/citizen/submit">
          <Button>+ Submit New Grievance</Button>
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
            Total Submitted
          </h3>
          <p className="text-3xl font-bold mt-2 font-mono">{isLoading ? "..." : totalCount}</p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
            Active / Pending Resolution
          </h3>
          <p className="text-3xl font-bold text-amber-600 mt-2 font-mono">
            {isLoading ? "..." : activeCount}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
            Successfully Resolved
          </h3>
          <p className="text-3xl font-bold text-emerald-600 mt-2 font-mono">
            {isLoading ? "..." : resolvedCount}
          </p>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Recent Grievances</h3>
          <Link to="/citizen/grievances">
            <Button variant="ghost" size="sm">
              View All →
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading recent grievances...</p>
        ) : grievances.length === 0 ? (
          <div className="p-8 text-center border border-dashed rounded-lg space-y-3">
            <p className="text-sm text-muted-foreground">You have not submitted any grievances yet.</p>
            <Link to="/citizen/submit">
              <Button size="sm">Submit Your First Grievance</Button>
            </Link>
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
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 max-w-md">
                    {g.original_text}
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <StatusBadge status={g.status} />
                  <Link to={`/citizen/grievances/${g.id}`}>
                    <Button variant="outline" size="sm">
                      Details
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
