import { useEffect, useState, useCallback } from "react"
import { getAdminAnalyticsApi } from "@/core/api/grievanceApi"
import type { AnalyticsData, AnalyticsSummary } from "@/shared/types/grievance"
import { Button } from "@/shared/ui/button"

type PriorityKey = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

const PRIORITY_CONFIG: Record<PriorityKey, { label: string; color: string; trackColor: string }> = {
  LOW:      { label: "Low",      color: "bg-slate-400",  trackColor: "bg-slate-100" },
  MEDIUM:   { label: "Medium",   color: "bg-sky-500",    trackColor: "bg-sky-100" },
  HIGH:     { label: "High",     color: "bg-amber-500",  trackColor: "bg-amber-100" },
  CRITICAL: { label: "Critical", color: "bg-rose-600",   trackColor: "bg-rose-100" },
}

const STATUS_CONFIG: { key: keyof AnalyticsSummary; label: string; color: string }[] = [
  { key: "submitted",    label: "Submitted",   color: "bg-blue-400" },
  { key: "assigned",     label: "Assigned",    color: "bg-purple-400" },
  { key: "under_review", label: "Under Review",color: "bg-amber-400" },
  { key: "in_progress",  label: "In Progress", color: "bg-indigo-400" },
  { key: "resolved",     label: "Resolved",    color: "bg-emerald-500" },
  { key: "rejected",     label: "Rejected",    color: "bg-rose-400" },
]

export function AdminAnalyticsView() {
  const [data, setData]       = useState<AnalyticsData | null>(null)
  const [isLoading, setLoad]  = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const loadAnalytics = useCallback(async () => {
    setLoad(true)
    setError(null)
    try {
      const res = await getAdminAnalyticsApi()
      if (res.success && res.data) { setData(res.data) }
      else throw new Error(res.message || "Failed to load analytics.")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to fetch analytics.")
    } finally {
      setLoad(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    getAdminAnalyticsApi()
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
          <p className="text-sm text-muted-foreground mt-3">Computing system-wide analytics…</p>
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

  const { summary, priority, departments = [], categories } = data
  const total = summary.total || 1

  const kpis = [
    { label: "Total Portal Volume",    value: summary.total, sub: "All submitted complaints", accent: "text-foreground" },
    { label: "Resolution Rate",        value: `${summary.resolution_rate}%`, sub: `${summary.resolved} resolved`, accent: "text-emerald-600" },
    { label: "Active Processing",      value: summary.in_progress + summary.under_review, sub: "Under active investigation", accent: "text-indigo-600" },
    { label: "High / Critical",        value: summary.high_critical_count, sub: "Critical incidents", accent: "text-rose-600" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header border-b pb-5">
        <div>
          <h1 className="page-title">Executive Analytics</h1>
          <p className="page-subtitle">
            Central portal performance overview — department dispatches, category distribution, resolution metrics.
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
        {kpis.map((k) => (
          <div key={k.label} className="metric-card">
            <p className="metric-label">{k.label}</p>
            <p className={`metric-value ${k.accent}`}>{k.value}</p>
            <p className="text-xs text-muted-foreground">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Status breakdown */}
      <div className="section-card">
        <h2 className="section-title">Status Distribution</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {STATUS_CONFIG.map((s) => {
            const count = summary[s.key] as number
            const pct   = Math.round((count / total) * 100)
            return (
              <div key={s.key} className="p-3 rounded-xl border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                    {s.label}
                  </span>
                  <span className="font-mono text-muted-foreground">{count} ({pct}%)</span>
                </div>
                <div className="progress-bar-track !h-1.5">
                  <div className={`progress-bar-fill ${s.color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Department dispatch */}
        <div className="section-card">
          <h2 className="section-title">Department Dispatch Volume</h2>
          {departments.length === 0 ? (
            <p className="text-xs text-muted-foreground">No departmental dispatch data available.</p>
          ) : (
            <div className="space-y-3">
              {departments
                .sort((a, b) => b.count - a.count)
                .map((dept) => {
                  const pct = Math.round((dept.count / total) * 100)
                  return (
                    <div key={dept.id} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="truncate max-w-[60%]">
                          {dept.name}
                          <span className="ml-1.5 font-mono text-muted-foreground text-[10px]">[{dept.code}]</span>
                        </span>
                        <span className="font-mono text-muted-foreground flex-shrink-0 ml-2">{dept.count} ({pct}%)</span>
                      </div>
                      <div className="progress-bar-track">
                        <div
                          className="progress-bar-fill bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>

        {/* Priority distribution */}
        <div className="section-card">
          <h2 className="section-title">Priority Distribution</h2>
          <div className="space-y-3">
            {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as PriorityKey[]).map((p) => {
              const cfg   = PRIORITY_CONFIG[p]
              const count = priority[p] || 0
              const pct   = Math.round((count / total) * 100)
              return (
                <div key={p} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${cfg.color}`} />
                      {cfg.label}
                    </span>
                    <span className="font-mono text-muted-foreground">{count} ({pct}%)</span>
                  </div>
                  <div className={`progress-bar-track ${cfg.trackColor}`}>
                    <div className={`progress-bar-fill ${cfg.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Category grid */}
      <div className="section-card">
        <h2 className="section-title">Top Categories</h2>
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
