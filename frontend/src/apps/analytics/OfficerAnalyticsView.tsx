import { useEffect, useState, useCallback } from "react"
import { getOfficerAnalyticsApi } from "@/core/api/grievanceApi"
import type { AnalyticsData } from "@/shared/types/grievance"
import { Button } from "@/shared/ui/button"

type PriorityKey = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

export function OfficerAnalyticsView() {
  const [data, setData]      = useState<AnalyticsData | null>(null)
  const [isLoading, setLoad] = useState(true)
  const [error, setError]    = useState<string | null>(null)

  const loadAnalytics = useCallback(async () => {
    setLoad(true)
    setError(null)
    try {
      const res = await getOfficerAnalyticsApi()
      if (res.success && res.data) { setData(res.data) }
      else throw new Error(res.message || "Failed to load officer analytics.")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to fetch analytics.")
    } finally {
      setLoad(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    getOfficerAnalyticsApi()
      .then((res) => {
        if (!isMounted) return
        if (res.success && res.data) { setData(res.data); setError(null) }
        else setError(res.message || "Failed.")
      })
      .catch((err: unknown) => {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : "Unable to fetch analytics.")
      })
      .finally(() => { if (isMounted) setLoad(false) })
    return () => { isMounted = false }
  }, [])

  if (isLoading) {
    return (
      <div className="section-card">
        <div className="empty-state">
          <div className="spinner w-8 h-8 mx-auto" />
          <p className="text-sm text-muted-foreground mt-3">Computing departmental analytics…</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="error-banner flex items-center justify-between">
        <span>{error || "Analytics unavailable."}</span>
        <Button variant="outline" size="sm" onClick={loadAnalytics}>Retry</Button>
      </div>
    )
  }

  const { summary, priority, categories, department } = data
  const total = summary.total || 1

  const statusItems = [
    { label: "Submitted",    count: summary.submitted,    color: "bg-blue-400" },
    { label: "Assigned",     count: summary.assigned,     color: "bg-purple-400" },
    { label: "Under Review", count: summary.under_review, color: "bg-amber-400" },
    { label: "In Progress",  count: summary.in_progress,  color: "bg-indigo-400" },
    { label: "Resolved",     count: summary.resolved,     color: "bg-emerald-500" },
    { label: "Rejected",     count: summary.rejected,     color: "bg-rose-400" },
  ]

  const priorityItems: { label: string; key: PriorityKey; color: string; trackColor: string }[] = [
    { label: "Critical", key: "CRITICAL", color: "bg-rose-600",  trackColor: "bg-rose-100" },
    { label: "High",     key: "HIGH",     color: "bg-amber-500", trackColor: "bg-amber-100" },
    { label: "Medium",   key: "MEDIUM",   color: "bg-sky-500",   trackColor: "bg-sky-100" },
    { label: "Low",      key: "LOW",      color: "bg-slate-400", trackColor: "bg-slate-100" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header border-b pb-5">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="page-title">Departmental Analytics</h1>
            {department?.code && (
              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-primary/10 text-primary border border-primary/20 font-mono">
                {department.name} [{department.code}]
              </span>
            )}
          </div>
          <p className="page-subtitle">
            Real-time metrics for your assigned government domain.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAnalytics} className="gap-2">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Domain Volume",   value: summary.total,            sub: "Assigned grievances",       accent: "text-foreground" },
          { label: "Resolution Rate",       value: `${summary.resolution_rate}%`, sub: `${summary.resolved} resolved`, accent: "text-emerald-600" },
          { label: "In-Progress Workload",  value: summary.in_progress,      sub: "Active investigation",      accent: "text-amber-600" },
          { label: "High / Critical",       value: summary.high_critical_count, sub: "Immediate response needed", accent: "text-rose-600" },
        ].map((k) => (
          <div key={k.label} className="metric-card">
            <p className="metric-label">{k.label}</p>
            <p className={`metric-value ${k.accent}`}>{k.value}</p>
            <p className="text-xs text-muted-foreground">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Status breakdown */}
        <div className="section-card">
          <h2 className="section-title">Status Breakdown</h2>
          <div className="space-y-3">
            {statusItems.map((item) => {
              const pct = Math.round((item.count / total) * 100)
              return (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                      {item.label}
                    </span>
                    <span className="font-mono text-muted-foreground">{item.count} ({pct}%)</span>
                  </div>
                  <div className="progress-bar-track">
                    <div className={`progress-bar-fill ${item.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Priority distribution */}
        <div className="section-card">
          <h2 className="section-title">Priority Distribution</h2>
          <div className="space-y-3">
            {priorityItems.map((item) => {
              const count = priority[item.key] || 0
              const pct   = Math.round((count / total) * 100)
              return (
                <div key={item.key} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                      {item.label}
                    </span>
                    <span className="font-mono text-muted-foreground">{count} ({pct}%)</span>
                  </div>
                  <div className={`progress-bar-track ${item.trackColor}`}>
                    <div className={`progress-bar-fill ${item.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="section-card">
        <h2 className="section-title">Top Complaint Categories</h2>
        {categories.length === 0 ? (
          <p className="text-xs text-muted-foreground">No category data available.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories
              .sort((a, b) => b.count - a.count)
              .map((cat, idx) => {
                const pct = Math.round((cat.count / total) * 100)
                return (
                  <div key={idx} className="p-3 rounded-xl border bg-card flex items-center justify-between gap-2 hover:bg-muted/20 transition-colors">
                    <span className="text-xs font-medium text-foreground truncate">{cat.category}</span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-xs font-mono font-bold text-primary">{cat.count}</span>
                      <span className="text-[10px] text-muted-foreground">({pct}%)</span>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}
