import { apiFetch } from "./client"
import type {
  Grievance,
  ApiResponse,
  Department,
  ChatbotMessageResponse,
  AnalyticsData,
  AIAnalyticsData,
  NotificationItem,
  NotificationListResponse,
} from "@/shared/types/grievance"

// --- CITIZEN API ENDPOINTS ---

export async function submitGrievanceApi(text: string): Promise<ApiResponse<Grievance>> {
  return apiFetch<ApiResponse<Grievance>>("/grievances", {
    method: "POST",
    body: JSON.stringify({ text }),
  })
}

export async function getCitizenGrievancesApi(): Promise<ApiResponse<Grievance[]>> {
  return apiFetch<ApiResponse<Grievance[]>>("/grievances")
}

export async function getCitizenGrievanceByIdApi(id: string): Promise<ApiResponse<Grievance>> {
  return apiFetch<ApiResponse<Grievance>>(`/grievances/${id}`)
}


// --- OFFICER API ENDPOINTS ---

export async function getOfficerGrievancesApi(filters?: {
  status?: string
  priority?: string
}): Promise<ApiResponse<Grievance[]>> {
  const params = new URLSearchParams()
  if (filters?.status) params.append("status", filters.status)
  if (filters?.priority) params.append("priority", filters.priority)

  const queryStr = params.toString() ? `?${params.toString()}` : ""
  return apiFetch<ApiResponse<Grievance[]>>(`/officer/grievances${queryStr}`)
}

export async function getOfficerGrievanceByIdApi(id: string): Promise<ApiResponse<Grievance>> {
  return apiFetch<ApiResponse<Grievance>>(`/officer/grievances/${id}`)
}

export async function updateOfficerGrievanceStatusApi(
  id: string,
  status: string,
  remarks?: string
): Promise<ApiResponse<Grievance>> {
  return apiFetch<ApiResponse<Grievance>>(`/officer/grievances/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, remarks }),
  })
}


// --- ADMIN API ENDPOINTS ---

export async function getAdminGrievancesApi(filters?: {
  department_id?: string
  status?: string
  priority?: string
}): Promise<ApiResponse<Grievance[]>> {
  const params = new URLSearchParams()
  if (filters?.department_id) params.append("department_id", filters.department_id)
  if (filters?.status) params.append("status", filters.status)
  if (filters?.priority) params.append("priority", filters.priority)

  const queryStr = params.toString() ? `?${params.toString()}` : ""
  return apiFetch<ApiResponse<Grievance[]>>(`/admin/grievances${queryStr}`)
}

export async function getAdminGrievanceByIdApi(id: string): Promise<ApiResponse<Grievance>> {
  return apiFetch<ApiResponse<Grievance>>(`/admin/grievances/${id}`)
}

export async function updateAdminGrievanceStatusApi(
  id: string,
  status: string,
  remarks?: string
): Promise<ApiResponse<Grievance>> {
  return apiFetch<ApiResponse<Grievance>>(`/admin/grievances/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, remarks }),
  })
}

export async function getAdminDepartmentGrievancesApi(
  departmentId: string,
  filters?: { status?: string; priority?: string }
): Promise<ApiResponse<Grievance[]> & { department?: Department }> {
  const params = new URLSearchParams()
  if (filters?.status) params.append("status", filters.status)
  if (filters?.priority) params.append("priority", filters.priority)

  const queryStr = params.toString() ? `?${params.toString()}` : ""
  return apiFetch<ApiResponse<Grievance[]> & { department?: Department }>(
    `/admin/departments/${departmentId}/grievances${queryStr}`
  )
}


// --- CHATBOT & ANALYTICS API ENDPOINTS ---

export async function sendChatbotMessageApi(message: string): Promise<ChatbotMessageResponse> {
  return apiFetch<ChatbotMessageResponse>("/chatbot/message", {
    method: "POST",
    body: JSON.stringify({ message }),
  })
}

export async function getOfficerAnalyticsApi(): Promise<ApiResponse<AnalyticsData>> {
  return apiFetch<ApiResponse<AnalyticsData>>("/officer/analytics")
}

export async function getAdminAnalyticsApi(): Promise<ApiResponse<AnalyticsData>> {
  return apiFetch<ApiResponse<AnalyticsData>>("/admin/analytics")
}

export async function correctAdminClassificationApi(
  id: string,
  category: string,
  remarks?: string
): Promise<ApiResponse<Grievance>> {
  return apiFetch<ApiResponse<Grievance>>(`/admin/grievances/${id}/classification`, {
    method: "PATCH",
    body: JSON.stringify({ category, remarks }),
  })
}

export async function getAdminAIAnalyticsApi(): Promise<ApiResponse<AIAnalyticsData>> {
  return apiFetch<ApiResponse<AIAnalyticsData>>("/admin/analytics/ai")
}


// --- NOTIFICATION API ENDPOINTS ---

export async function getNotificationsApi(): Promise<NotificationListResponse> {
  return apiFetch<NotificationListResponse>("/notifications")
}

export async function markNotificationReadApi(id: string): Promise<ApiResponse<NotificationItem>> {
  return apiFetch<ApiResponse<NotificationItem>>(`/notifications/${id}/read`, {
    method: "PATCH",
  })
}

export async function markAllNotificationsReadApi(): Promise<ApiResponse<null>> {
  return apiFetch<ApiResponse<null>>("/notifications/read-all", {
    method: "PATCH",
  })
}
