import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "./AuthContext"
import { Button } from "@/shared/ui/button"

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const role = await login(email, password)
      if (role === "OFFICER") {
        navigate("/officer/dashboard", { replace: true })
      } else if (role === "ADMIN") {
        navigate("/admin/dashboard", { replace: true })
      } else {
        navigate("/citizen/dashboard", { replace: true })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid credentials. Please try again."
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword("Password@123")
    setError(null)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <div className="w-full max-w-md bg-card border rounded-xl shadow-lg p-6 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Intelligent Grievance System</h1>
          <p className="text-sm text-muted-foreground">Sign in to access your portal</p>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium leading-none">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium leading-none">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="border-t pt-4 space-y-2">
          <p className="text-xs text-center text-muted-foreground font-medium">Quick Demo Accounts:</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillDemo("citizen@example.com")}
              className="p-2 border rounded hover:bg-accent text-center font-medium"
            >
              Citizen
            </button>
            <button
              type="button"
              onClick={() => fillDemo("officer@example.com")}
              className="p-2 border rounded hover:bg-accent text-center font-medium"
            >
              Officer
            </button>
            <button
              type="button"
              onClick={() => fillDemo("admin@example.com")}
              className="p-2 border rounded hover:bg-accent text-center font-medium"
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
