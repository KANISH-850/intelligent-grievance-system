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
  const [showPassword, setShowPassword] = useState(false)

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

  const demoAccounts = [
    { label: "Citizen", email: "citizen@example.com", icon: "👤", color: "hover:border-teal-400/60 hover:bg-teal-50" },
    { label: "Officer", email: "officer@example.com", icon: "🏛", color: "hover:border-indigo-400/60 hover:bg-indigo-50" },
    { label: "Admin",   email: "admin@example.com",   icon: "⚙️", color: "hover:border-amber-400/60 hover:bg-amber-50" },
  ]

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "oklch(0.975 0.005 240)" }}
    >
      {/* ── Left decorative panel ─────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[42%] p-12 text-white relative overflow-hidden"
        style={{ background: "oklch(0.225 0.060 255)" }}
      >
        {/* Subtle geometric pattern */}
        <div className="absolute inset-0 opacity-[0.04]" aria-hidden="true">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        {/* Accent circle */}
        <div
          className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-15"
          style={{ background: "oklch(0.72 0.13 195)" }}
          aria-hidden="true"
        />

        <div className="relative z-10">
          {/* Gov logo placeholder */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-xl bg-teal-400/20 flex items-center justify-center ring-1 ring-teal-400/30">
              <svg className="w-6 h-6 text-teal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-white/50 font-medium">Government of India</p>
              <p className="text-sm text-white/80 font-semibold">Central Grievance Portal</p>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white leading-snug mb-4">
            Intelligent Multilingual<br />Grievance System
          </h1>
          <p className="text-sm text-white/55 leading-relaxed max-w-xs">
            AI-powered categorization and automated dispatch framework for Central Government portals — supporting 11 official Indian languages.
          </p>
        </div>

        {/* Feature list */}
        <div className="relative z-10 space-y-4">
          {[
            { icon: "🤖", label: "AI Classification", desc: "Automatic category detection & routing" },
            { icon: "🌐", label: "Multilingual Support", desc: "11 Indian languages supported" },
            { icon: "📊", label: "Real-time Analytics", desc: "Live departmental dashboards" },
          ].map((f) => (
            <div key={f.label} className="flex items-start gap-3">
              <span className="text-lg mt-0.5">{f.icon}</span>
              <div>
                <p className="text-xs font-semibold text-white/80">{f.label}</p>
                <p className="text-[11px] text-white/40">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="relative z-10 text-[10px] text-white/25">
          Ministry of Electronics & Information Technology · CPGRAMS Framework
        </p>
      </div>

      {/* ── Right auth panel ──────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile header */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-foreground">Intelligent Grievance System</h1>
            <p className="text-sm text-muted-foreground">Central Government Portal</p>
          </div>

          <div className="bg-card border rounded-2xl shadow-md p-8 space-y-7">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">Sign in to your portal</h2>
              <p className="text-sm text-muted-foreground">Enter your credentials to access your role-based workspace.</p>
            </div>

            {/* Error alert */}
            {error && (
              <div className="flex items-start gap-3 p-3.5 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="login-email" className="text-sm font-semibold text-foreground block">
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="form-input"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="login-password" className="text-sm font-semibold text-foreground block">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="form-input pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="spinner w-4 h-4" />
                    Signing in…
                  </span>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Demo accounts */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground font-medium">Demo Accounts</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.label}
                    type="button"
                    onClick={() => fillDemo(acc.email)}
                    className={`flex flex-col items-center gap-1 p-2.5 border rounded-lg text-xs font-medium text-foreground transition-all duration-150 ${acc.color}`}
                  >
                    <span className="text-base">{acc.icon}</span>
                    {acc.label}
                  </button>
                ))}
              </div>
              <p className="text-center text-[11px] text-muted-foreground">
                All demo accounts use password: <code className="font-mono bg-muted px-1 rounded">Password@123</code>
              </p>
            </div>
          </div>

          <p className="text-center text-[11px] text-muted-foreground mt-6">
            Government of India Digital Services · CPGRAMS Integrated Platform
          </p>
        </div>
      </div>
    </div>
  )
}
