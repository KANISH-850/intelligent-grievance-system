import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getCitizenGrievancesApi } from "@/core/api/grievanceApi"
import type { Grievance } from "@/shared/types/grievance"
import { StatusBadge } from "@/shared/ui/StatusBadge"
import { PriorityBadge } from "@/shared/ui/PriorityBadge"
import { Button } from "@/shared/ui/button"

export function GrievanceList() {
  const [grievances, setGrievances] = useState<Grievance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadTrigger, setReloadTrigger] = useState(0)

  useEffect(() => {
    let isMounted = true
    getCitizenGrievancesApi()
      .then((res) => {
        if (isMounted) {
          if (res.success && res.data) {
            setGrievances(res.data)
          } else {
            setError(res.message || "Failed to load grievances.")
          }
          setIsLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Unable to load grievances.")
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [reloadTrigger])

  const handleRetry = () => {
    setIsLoading(true)
    setError(null)
    setReloadTrigger((prev) => prev + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Grievances</h2>
          <p className="text-sm text-muted-foreground">
            Track and monitor the resolution status of your submitted complaints.
          </p>
        </div>
        <Link to="/citizen/submit">
          <Button>+ Submit New Grievance</Button>
        </Link>
      </div>

      {isLoading && (
        <div className="bg-card border rounded-xl p-8 text-center space-y-3">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Loading your grievances...</p>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center space-y-3">
          <p className="text-sm text-rose-700 font-medium">{error}</p>
          <Button variant="outline" onClick={handleRetry}>
            Retry Loading
          </Button>
        </div>
      )}

      {!isLoading && !error && grievances.length === 0 && (
        <div className="bg-card border rounded-xl p-12 text-center space-y-4">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto text-2xl">
            📋
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold">No Grievances Submitted</h3>
            <p className="text-sm text-muted-foreground">
              You have not submitted any public grievances yet.
            </p>
          </div>
          <Link to="/citizen/submit" className="inline-block">
            <Button>Submit Your First Grievance</Button>
          </Link>
        </div>
      )}

      {!isLoading && !error && grievances.length > 0 && (
        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b text-xs uppercase font-semibold text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Grievance No.</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Submitted On</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {grievances.map((g) => (
                  <tr key={g.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-primary">
                      {g.grievance_number}
                    </td>
                    <td className="px-4 py-3 font-medium">{g.category}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {g.department?.name || g.category}
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={g.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={g.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                      {new Date(g.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/citizen/grievances/${g.id}`}>
                        <Button variant="outline" size="sm">
                          Track Details
                        </Button>
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
