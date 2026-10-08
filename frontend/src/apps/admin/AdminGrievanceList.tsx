import { useEffect, useState, useCallback } from "react"
import { Link } from "react-router-dom"
import { getAdminGrievancesApi } from "@/core/api/grievanceApi"
import type { Grievance } from "@/shared/types/grievance"
import { StatusBadge } from "@/shared/ui/StatusBadge"
import { PriorityBadge } from "@/shared/ui/PriorityBadge"
import { Button } from "@/shared/ui/button"

const KNOWN_DEPARTMENTS = [
  { code: "", name: "All Departments" },
  { code: "WS", name: "Water Supply" },
  { code: "ELEC", name: "Electricity" },
  { code: "RT", name: "Roads and Transport" },
  { code: "HC", name: "Healthcare" },
  { code: "EDU", name: "Education" },
  { code: "SAN", name: "Sanitation" },
  { code: "MS", name: "Municipal Services" },
  { code: "REV", name: "Revenue" },
  { code: "OTH", name: "Other" },
]

export function AdminGrievanceList() {
  const [grievances, setGrievances] = useState<Grievance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [departmentFilter, setDepartmentFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("")

  const loadGrievances = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getAdminGrievancesApi({
        department_id: departmentFilter || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      })
      if (res.success && res.data) {
        setGrievances(res.data)
      } else {
        throw new Error(res.message || "Failed to load system grievances.")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to fetch system grievances."
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [departmentFilter, statusFilter, priorityFilter])

  useEffect(() => {
    let isMounted = true

    getAdminGrievancesApi({
      department_id: departmentFilter || undefined,
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
    })
      .then((res) => {
        if (!isMounted) return
        if (res.success && res.data) {
          setGrievances(res.data)
          setError(null)
        } else {
          setError(res.message || "Failed to load system grievances.")
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return
        const msg = err instanceof Error ? err.message : "Unable to fetch system grievances."
        setError(msg)
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [departmentFilter, statusFilter, priorityFilter])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System-Wide Grievance Oversight</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Central Administrative Control & Department Monitoring Dashboard.
          </p>
        </div>
      </div>

      {/* Admin Filtering Controls */}
      <div className="bg-card border rounded-xl p-4 flex items-center justify-between flex-wrap gap-4 shadow-sm">
        <div className="flex items-center space-x-4 flex-wrap gap-3">
          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Department Filter:</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-1.5 border rounded-md text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {KNOWN_DEPARTMENTS.map((dept) => (
                <option key={dept.code} value={dept.code}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Status Filter:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border rounded-md text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="UNDER_REVIEW">UNDER_REVIEW</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Priority Filter:</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 border rounded-md text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Priorities</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>
        </div>

        {(departmentFilter || statusFilter || priorityFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDepartmentFilter("")
              setStatusFilter("")
              setPriorityFilter("")
            }}
          >
            Reset Filters
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="bg-card border rounded-xl p-12 text-center space-y-3">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Loading system grievances...</p>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center space-y-3">
          <p className="text-sm text-rose-700 font-medium">{error}</p>
          <Button variant="outline" onClick={loadGrievances}>
            Retry Loading
          </Button>
        </div>
      )}

      {!isLoading && !error && grievances.length === 0 && (
        <div className="bg-card border rounded-xl p-12 text-center space-y-3">
          <p className="text-sm text-muted-foreground font-medium">
            No grievances found matching the selected administrative filter criteria.
          </p>
        </div>
      )}

      {!isLoading && !error && grievances.length > 0 && (
        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b text-xs uppercase font-semibold text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Grievance No.</th>
                  <th className="px-4 py-3">Complainant</th>
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
                    <td className="px-4 py-3">
                      <span className="font-medium block">{g.user?.name || "Citizen"}</span>
                      <span className="text-xs text-muted-foreground">{g.user?.email}</span>
                    </td>
                    <td className="px-4 py-3 font-medium">{g.category}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">
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
                      <Link to={`/admin/grievances/${g.id}`}>
                        <Button variant="outline" size="sm">
                          Inspect & Override
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
