import { useState } from "react"
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom"
import { useAuth } from "@/features/auth/AuthContext"
import { NotificationDropdown } from "@/shared/ui/NotificationDropdown"

// ── Nav icon (inline SVG) ───────────────────────────────────────────
function Icon({ d, className = "w-4 h-4" }: { d: string; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={d} />
    </svg>
  )
}

const NAV_ICONS: Record<string, string> = {
  "Dashboard":          "M3 12L12 3l9 9M4 10v10a1 1 0 001 1h5m4 0h5a1 1 0 001-1V10",
  "Submit Grievance":   "M12 5v14m7-7H5",
  "My Grievances":      "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  "AI Assistant Chat":  "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  "Officer Dashboard":  "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  "Department Queue":   "M4 6h16M4 10h16M4 14h16M4 18h16",
  "Domain Analytics":   "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  "Admin Overview":     "M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
  "Executive Analytics":"M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z",
  "All Grievances":     "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  "Department View":    "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
}

function roleDisplayName(role: string | undefined) {
  switch (role) {
    case "CITIZEN": return "Citizen Portal"
    case "OFFICER": return "Officer Workspace"
    case "ADMIN":   return "Admin Command Centre"
    default:        return "Portal"
  }
}

function rolePillColor(role: string | undefined) {
  switch (role) {
    case "CITIZEN": return "bg-teal-600/20 text-teal-300 ring-1 ring-teal-500/30"
    case "OFFICER": return "bg-indigo-600/20 text-indigo-300 ring-1 ring-indigo-500/30"
    case "ADMIN":   return "bg-amber-600/20 text-amber-300 ring-1 ring-amber-500/30"
    default:        return "bg-white/10 text-white/70"
  }
}

// ── Nav link type ─────────────────────────────────────────────────
interface NavLink {
  label: string
  path:  string
}

// ── SidebarContent is declared at module level to satisfy the lint rule ──
interface SidebarContentProps {
  links:        NavLink[]
  role:         string | undefined
  userName:     string | undefined
  userEmail:    string | undefined
  userInitials: string
  departmentCode?: string | null
  onLinkClick:  () => void
  onLogout:     () => void
}

function SidebarContent({
  links,
  role,
  userName,
  userEmail,
  userInitials,
  departmentCode,
  onLinkClick,
  onLogout,
}: SidebarContentProps) {
  const location = useLocation()

  return (
    <>
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-500/20 flex items-center justify-center ring-1 ring-teal-400/30 flex-shrink-0">
            <svg className="w-5 h-5 text-teal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white/90 leading-tight truncate">Central Gov. Portal</p>
            <p className="text-[10px] text-white/45 truncate">Grievance Management System</p>
          </div>
        </div>

        {/* Role pill */}
        <div className="mt-3 flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rolePillColor(role)}`}>
            {role ?? "GUEST"}
          </span>
          {departmentCode && (
            <span className="text-[10px] font-mono text-white/40">[{departmentCode}]</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p className="text-[10px] font-bold uppercase text-white/30 tracking-wider px-2 mb-2">Navigation</p>
        {links.map((link) => {
          const isActive = location.pathname.startsWith(link.path)
          const iconPath = NAV_ICONS[link.label] ?? NAV_ICONS["Dashboard"]
          return (
            <Link
              key={link.path}
              to={link.path}
              onClick={onLinkClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 group ${
                isActive
                  ? "bg-teal-500/18 text-teal-300 font-semibold"
                  : "text-white/60 hover:bg-white/8 hover:text-white/90"
              }`}
            >
              <Icon
                d={iconPath}
                className={`w-[17px] h-[17px] flex-shrink-0 transition-colors ${isActive ? "text-teal-400" : "text-white/40 group-hover:text-white/70"}`}
              />
              <span className="truncate">{link.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/40 ring-1 ring-white/20 flex items-center justify-center text-white/90 text-xs font-bold flex-shrink-0">
            {userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white/80 truncate">{userName}</p>
            <p className="text-[10px] text-white/40 truncate">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="mt-3 w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white/50 hover:bg-rose-500/15 hover:text-rose-300 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </>
  )
}

// ── Main layout ─────────────────────────────────────────────────────
export function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  const role = user?.role

  const navLinks = (): NavLink[] => {
    if (role === "CITIZEN") {
      return [
        { label: "Dashboard",         path: "/citizen/dashboard" },
        { label: "Submit Grievance",  path: "/citizen/submit" },
        { label: "My Grievances",     path: "/citizen/grievances" },
        { label: "AI Assistant Chat", path: "/citizen/chatbot" },
      ]
    }
    if (role === "OFFICER") {
      return [
        { label: "Officer Dashboard", path: "/officer/dashboard" },
        { label: "Department Queue",  path: "/officer/grievances" },
        { label: "Domain Analytics",  path: "/officer/analytics" },
      ]
    }
    if (role === "ADMIN") {
      return [
        { label: "Admin Overview",      path: "/admin/dashboard" },
        { label: "Executive Analytics", path: "/admin/analytics" },
        { label: "All Grievances",      path: "/admin/grievances" },
        { label: "Department View",     path: "/admin/departments" },
      ]
    }
    return []
  }

  const links = navLinks()
  const userInitials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?"

  const sidebarBg = { background: "oklch(0.225 0.060 255)" }

  const sidebarProps: SidebarContentProps = {
    links,
    role,
    userName:      user?.name,
    userEmail:     user?.email,
    userInitials,
    departmentCode: user?.department?.code,
    onLinkClick:   () => setSidebarOpen(false),
    onLogout:      handleLogout,
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Desktop Sidebar ─────────────────────────────────── */}
      <aside className="hidden md:flex w-60 flex-col flex-shrink-0 overflow-hidden" style={sidebarBg}>
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* ── Mobile Sidebar Overlay ──────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        </div>
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 flex flex-col transform transition-transform duration-250 ease-in-out md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={sidebarBg}
      >
        <SidebarContent {...sidebarProps} onLinkClick={() => setSidebarOpen(false)} />
      </aside>

      {/* ── Main Content ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top header */}
        <header className="h-14 border-b bg-card flex items-center justify-between px-4 md:px-6 flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              className="md:hidden p-1.5 rounded-md hover:bg-muted transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle navigation"
            >
              <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Page context */}
            <div className="hidden sm:block">
              <p className="text-xs text-muted-foreground font-medium leading-tight">
                Intelligent Multilingual Grievance System
              </p>
              <p className="text-sm font-bold text-foreground leading-tight">
                {roleDisplayName(role)}
              </p>
            </div>
            <p className="sm:hidden text-sm font-bold text-foreground">{roleDisplayName(role)}</p>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <NotificationDropdown />

            {/* User chip */}
            <div className="hidden sm:flex items-center gap-2 border rounded-lg px-3 py-1.5 bg-muted/30">
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[9px] font-bold">
                {userInitials}
              </div>
              <span className="text-xs font-medium text-foreground hidden lg:inline">{user?.name}</span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border rounded-lg hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden xs:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="p-4 md:p-6 max-w-screen-2xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
