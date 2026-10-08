import { Outlet, useNavigate, Link, useLocation } from "react-router-dom"
import { useAuth } from "@/features/auth/AuthContext"
import { NotificationDropdown } from "@/shared/ui/NotificationDropdown"

export function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  const role = user?.role

  const navLinks = () => {
    if (role === "CITIZEN") {
      return [
        { label: "Dashboard", path: "/citizen/dashboard" },
        { label: "Submit Grievance", path: "/citizen/submit" },
        { label: "My Grievances", path: "/citizen/grievances" },
        { label: "AI Assistant Chat", path: "/citizen/chatbot" },
      ]
    }
    if (role === "OFFICER") {
      return [
        { label: "Officer Dashboard", path: "/officer/dashboard" },
        { label: "Department Queue", path: "/officer/grievances" },
        { label: "Domain Analytics", path: "/officer/analytics" },
      ]
    }
    if (role === "ADMIN") {
      return [
        { label: "Admin Overview", path: "/admin/dashboard" },
        { label: "Executive Analytics", path: "/admin/analytics" },
        { label: "All Grievances", path: "/admin/grievances" },
        { label: "Department View", path: "/admin/departments" },
      ]
    }
    return []
  }

  const links = navLinks()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-card border-r hidden md:flex flex-col">
        <div className="p-4 border-b space-y-1">
          <h2 className="text-base font-bold tracking-tight">Public Grievance Portal</h2>
          <div className="flex items-center space-x-2">
            <span className="inline-block px-2 py-0.5 text-xs font-bold rounded bg-primary/10 text-primary">
              {role || "GUEST"}
            </span>
            {user?.department?.code && (
              <span className="text-[11px] font-mono text-muted-foreground font-semibold">
                [{user.department.code}]
              </span>
            )}
          </div>
        </div>

        <nav className="p-4 flex-1 overflow-y-auto">
          <ul className="space-y-1.5 text-sm font-medium">
            {links.map((link) => {
              const isActive = location.pathname.startsWith(link.path)
              return (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className={`block px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="p-4 border-t text-xs text-muted-foreground bg-muted/20">
          Logged in as: <br />
          <strong className="text-foreground block truncate">{user?.name}</strong>
          <span className="block truncate text-[11px]">{user?.email}</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b flex items-center justify-between px-6 bg-card">
          <div className="flex items-center space-x-3">
            <h1 className="font-semibold text-base md:text-lg">
              Intelligent Multilingual Grievance System
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <NotificationDropdown />
            <span className="text-xs text-muted-foreground hidden sm:inline">
              User: <strong className="text-foreground">{user?.name}</strong> ({role})
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto bg-muted/10 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
