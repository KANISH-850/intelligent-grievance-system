import type { RouteObject } from "react-router-dom"
import { Dashboard } from "./Dashboard"

export const citizenRoutes: RouteObject[] = [
  {
    path: "citizen",
    children: [
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      // Future nested routes will go here (e.g., /citizen/grievances)
    ],
  },
]
