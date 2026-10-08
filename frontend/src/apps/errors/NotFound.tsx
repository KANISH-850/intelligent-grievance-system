import { Link } from "react-router-dom"
import { Button } from "@/shared/ui/button"

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4">
      <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
      <p className="text-muted-foreground">The page you are looking for does not exist.</p>
      <Button render={<Link to="/" />}>
        Go Home
      </Button>
    </div>
  )
}
