import { useEffect, useState, useCallback } from "react"
import { getAdminAnalyticsApi } from "@/core/api/grievanceApi"
import type { AnalyticsData } from "@/shared/types/grievance"
import { Button } from "@/shared/ui/button"

export function AdminAnalyticsView() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getAdminAnalyticsApi()
      if (res.success && res.data) {
        setData(res.data)
      } else {
        throw new Error(res.message || "Failed to load system-wide analytics.")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to fetch system analytics data."
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    getAdminAnalyticsApi()
      .then((res) => {
        if (!isMounted) return
        if (res.success && res.data) {
          setData(res.data)
          setError(null)
        } else {
          setError(res.message || "Failed to load system-wide analytics.")
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return
        const msg = err instanceof Error ? err.message : "Unable to fetch system analytics data."
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
  }, [])

  if (isLoading) {
    return (
      <div className="bg-card border rounded-xl p-12 text-center space-y-3">
        <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">Computing system-wide central portal analytics...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center space-y-3">
        <p className="text-sm text-rose-700 font-medium">{error || "Analytics unavailable"}</p>
        <Button variant="outline" onClick={loadAnalytics}>
          Retry Analytics Query
        </Button>
      </div>
    )
  }

  const { summary, priority, departments = [], categories } = data
  const total = summary.total || 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System-Wide Executive Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Central Government Portal performance overview, department dispatches, and resolution metrics.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card border rounded-xl p-5 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Portal Volume
          </span>
          <div className="text-3xl font-extrabold text-foreground">{summary.total}</div>
          <p className="text-xs text-muted-foreground">All submitted complaints</p>
        </div>

        <div className="bg-card border rounded-xl p-5 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            System Resolution Rate
          </span>
          <div className="text-3xl font-extrabold text-emerald-600">{summary.resolution_rate}%</div>
          <p className="text-xs text-muted-foreground">{summary.resolved} resolved grievances</p>
        </div>

        <div className="bg-card border rounded-xl p-5 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Active Processing
          </span>
          <div className="text-3xl font-extrabold text-indigo-600">{summary.in_progress + summary.under_review}</div>
          <p className="text-xs text-muted-foreground">Under active investigation</p>
        </div>

        <div className="bg-card border rounded-xl p-5 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
            High / Critical Priority
          </span>
          <div className="text-3xl font-extrabold text-rose-700">{summary.high_critical_count}</div>
          <p className="text-xs text-rose-600 font-medium">Critical public incidents</p>
        </div>
      </div>

      {/* Grid for Department Breakdown & Priority Distribution */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Department Volume Breakdown */}
        <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-foreground">Department Dispatch Volume</h3>

          {departments.length === 0 ? (
            <p className="text-xs text-muted-foreground">No departmental dispatch data.</p>
          ) : (
            <div className="space-y-3">
              {departments.map((dept) => {
                const pct = Math.round((dept.count / total) * 100)
                return (
                  <div key={dept.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>{dept.name} <strong className="font-mono text-primary">[{dept.code}]</strong></span>
                      <span className="font-mono text-muted-foreground">
                        {dept.count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Priority Rating Breakdown */}
        <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-foreground">Priority Rating Distribution</h3>

          <div className="space-y-3">
            {[
              { label: "LOW", count: priority.LOW || 0, color: "bg-slate-400" },
              { label: "MEDIUM", count: priority.MEDIUM || 0, color: "bg-blue-600" },
              { label: "HIGH", count: priority.HIGH || 0, color: "bg-amber-600" },
              { label: "CRITICAL", count: priority.CRITICAL || 0, color: "bg-rose-600" },
            ].map((item) => {
              const pct = Math.round((item.count / total) * 100)
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="font-bold">{item.label}</span>
                    <span className="font-mono text-muted-foreground">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Top Categories */}
      <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-foreground">Top System Categories</h3>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat, idx) => (
            <div key={idx} className="p-3 bg-muted/30 border rounded-lg flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground truncate">{cat.category}</span>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-primary/10 text-primary">
                {cat.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
