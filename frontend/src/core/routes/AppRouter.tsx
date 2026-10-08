import { createBrowserRouter, Navigate } from "react-router-dom"
import { RootLayout } from "@/shared/layouts/RootLayout"
import { DashboardLayout } from "@/shared/layouts/DashboardLayout"
import { ProtectedRoute } from "./ProtectedRoute"
import { PublicRoute } from "./PublicRoute"
import { NotFound } from "@/apps/errors/NotFound"
import { Login } from "@/features/auth/Login"

// Citizen Components
import { Dashboard as CitizenDashboard } from "@/apps/citizen/Dashboard"
import { SubmitGrievance } from "@/apps/citizen/SubmitGrievance"
import { GrievanceList } from "@/apps/citizen/GrievanceList"
import { GrievanceDetail } from "@/apps/citizen/GrievanceDetail"
import { ChatbotView } from "@/apps/chatbot/ChatbotView"

// Officer Components
import { OfficerDashboard } from "@/apps/officer/Dashboard"
import { OfficerGrievanceList } from "@/apps/officer/OfficerGrievanceList"
import { OfficerGrievanceDetail } from "@/apps/officer/OfficerGrievanceDetail"
import { OfficerAnalyticsView } from "@/apps/analytics/OfficerAnalyticsView"

// Admin Components
import { AdminDashboard } from "@/apps/admin/Dashboard"
import { AdminGrievanceList } from "@/apps/admin/AdminGrievanceList"
import { AdminGrievanceDetail } from "@/apps/admin/AdminGrievanceDetail"
import { AdminDepartmentView } from "@/apps/admin/AdminDepartmentView"
import { AdminAnalyticsView } from "@/apps/analytics/AdminAnalyticsView"

export const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <NotFound />,
    children: [
      // Public Routes (Accessible only when unauthenticated)
      {
        element: <PublicRoute />,
        children: [
          {
            path: "login",
            element: <Login />,
          },
        ],
      },

      // Citizen Protected Routes
      {
        element: <ProtectedRoute allowedRoles={["CITIZEN"]} />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              {
                path: "citizen/dashboard",
                element: <CitizenDashboard />,
              },
              {
                path: "citizen/submit",
                element: <SubmitGrievance />,
              },
              {
                path: "citizen/grievances",
                element: <GrievanceList />,
              },
              {
                path: "citizen/grievances/:id",
                element: <GrievanceDetail />,
              },
              {
                path: "citizen/chatbot",
                element: <ChatbotView />,
              },
            ],
          },
        ],
      },

      // Officer Protected Routes
      {
        element: <ProtectedRoute allowedRoles={["OFFICER"]} />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              {
                path: "officer/dashboard",
                element: <OfficerDashboard />,
              },
              {
                path: "officer/grievances",
                element: <OfficerGrievanceList />,
              },
              {
                path: "officer/grievances/:id",
                element: <OfficerGrievanceDetail />,
              },
              {
                path: "officer/analytics",
                element: <OfficerAnalyticsView />,
              },
            ],
          },
        ],
      },

      // Admin Protected Routes
      {
        element: <ProtectedRoute allowedRoles={["ADMIN"]} />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              {
                path: "admin/dashboard",
                element: <AdminDashboard />,
              },
              {
                path: "admin/analytics",
                element: <AdminAnalyticsView />,
              },
              {
                path: "admin/grievances",
                element: <AdminGrievanceList />,
              },
              {
                path: "admin/grievances/:id",
                element: <AdminGrievanceDetail />,
              },
              {
                path: "admin/departments",
                element: <AdminDepartmentView />,
              },
              {
                path: "admin/departments/:code",
                element: <AdminDepartmentView />,
              },
            ],
          },
        ],
      },

      // Default Index Redirect
      {
        index: true,
        element: <Navigate to="/login" replace />,
      },
    ],
  },
])
