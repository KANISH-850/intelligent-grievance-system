import { useEffect, useState, useCallback } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { getAdminDepartmentGrievancesApi } from "@/core/api/grievanceApi"
import type { Grievance, Department } from "@/shared/types/grievance"
import { StatusBadge } from "@/shared/ui/StatusBadge"
import { PriorityBadge } from "@/shared/ui/PriorityBadge"
import { Button } from "@/shared/ui/button"

const DEPARTMENTS_LIST = [
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

export function AdminDepartmentView() {
  const { code } = useParams<{ code?: string }>()
  const navigate = useNavigate()

  const selectedCode = code || "WS"
  const [department, setDepartment] = useState<Department | null>(null)
  const [grievances, setGrievances] = useState<Grievance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDeptData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getAdminDepartmentGrievancesApi(selectedCode)
      if (res.success && res.data) {
        setGrievances(res.data)
        if (res.department) {
          setDepartment(res.department)
        }
      } else {
        throw new Error(res.message || "Failed to load department grievances.")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to fetch department grievances."
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [selectedCode])

  useEffect(() => {
    let isMounted = true
    getAdminDepartmentGrievancesApi(selectedCode)
      .then((res) => {
        if (!isMounted) return
        if (res.success && res.data) {
          setGrievances(res.data)
          if (res.department) {
            setDepartment(res.department)
          }
          setError(null)
        } else {
          setError(res.message || "Failed to load department grievances.")
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return
        const msg = err instanceof Error ? err.message : "Unable to fetch department grievances."
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
  }, [selectedCode])

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold tracking-tight">Department-Level Oversight</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor grievance volume and officer performance by government department.
        </p>
      </div>

      {/* Department Selector Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {DEPARTMENTS_LIST.map((dept) => {
          const isActive = selectedCode === dept.code
          return (
            <button
              key={dept.code}
              onClick={() => navigate(`/admin/departments/${dept.code}`)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-foreground hover:bg-muted"
              }`}
            >
              {dept.name} ({dept.code})
            </button>
          )
        })}
      </div>

      {/* Selected Department Info */}
      <div className="bg-card border rounded-xl p-5 shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div>
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            Selected Department
          </span>
          <h3 className="text-xl font-bold text-foreground mt-1">
            {department?.name || selectedCode}
          </h3>
        </div>
        <div className="text-right">
          <span className="text-xs text-muted-foreground block font-medium">Department Code</span>
          <span className="font-mono font-bold text-primary text-lg">
            {department?.code || selectedCode}
          </span>
        </div>
      </div>

      {isLoading && (
        <div className="bg-card border rounded-xl p-12 text-center space-y-3">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Loading department grievances...</p>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center space-y-3">
          <p className="text-sm text-rose-700 font-medium">{error}</p>
          <Button variant="outline" onClick={loadDeptData}>
            Retry Loading
          </Button>
        </div>
      )}

      {!isLoading && !error && grievances.length === 0 && (
        <div className="bg-card border rounded-xl p-12 text-center space-y-2">
          <p className="text-sm text-muted-foreground font-medium">
            No grievances currently registered under {department?.name || selectedCode}.
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
                          Inspect
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
