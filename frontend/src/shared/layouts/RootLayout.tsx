import { Outlet } from "react-router-dom"

export function RootLayout() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased text-foreground">
      {/* Global context providers like Toaster would go here */}
      <Outlet />
    </div>
  )
}
