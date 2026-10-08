import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/features/auth/AuthContext"
import type { UserRole } from "@/features/auth/authTypes"

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Verifying session...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect user to their own role's home route
    const roleRoutes: Record<UserRole, string> = {
      CITIZEN: "/citizen/dashboard",
      OFFICER: "/officer/dashboard",
      ADMIN: "/admin/dashboard",
    }
    return <Navigate to={roleRoutes[user.role] || "/login"} replace />
  }

  return <Outlet />
}
