import { apiFetch } from "./client"
import { getStoredToken } from "@/features/auth/authStorage"
import type {
  Grievance,
  ApiResponse,
  Department,
  DepartmentAssignment,
  GrievanceAssignmentHistory,
  ChatbotMessageResponse,
  AnalyticsData,
  AIAnalyticsData,
  NotificationItem,
  NotificationListResponse,
} from "@/shared/types/grievance"

// --- CITIZEN API ENDPOINTS ---

export interface PreSubmissionImageAnalysis {
  analysis_status: string
  image_type: "civic_issue" | "unrelated" | "uncertain"
  is_grievance_related: boolean
  issue_detected: boolean
  detected_issue?: string | null
  issue_description?: string | null
  image_description?: string | null
  recommended_category?: string | null
  recommended_department?: string | null
  additional_departments?: string[]
  visual_observations?: string[]
  observations?: string[]
  confidence?: number | null
  confidence_level?: string | null
  predicted_class?: string | null
  human_review_required: boolean
  review_reason?: string | null
  citizen_message?: string | null
  model_name?: string | null
  inference_latency_ms?: number | null
}

export interface TranslationPreviewData {
  original_text: string
  detected_language: string
  detected_language_code: string
  translated_text: string
  translation_status: "translated" | "passthrough" | "unavailable" | "failed" | "unsupported"
  translation_method: string
  translation_error?: string | null
  translated_at?: string | null
  confidence?: number
  is_mixed?: boolean
}

export async function previewTranslationApi(
  text: string
): Promise<ApiResponse<TranslationPreviewData>> {
  return apiFetch<ApiResponse<TranslationPreviewData>>("/grievances/translate-preview", {
    method: "POST",
    body: JSON.stringify({ text }),
  })
}

export async function analyzePreSubmissionImageApi(
  image: File
): Promise<ApiResponse<PreSubmissionImageAnalysis>> {
  const form = new FormData()
  form.append("image", image)
  return apiFetch<ApiResponse<PreSubmissionImageAnalysis>>("/grievances/analyze-image", {
    method: "POST",
    body: form,
  })
}

export async function submitGrievanceApi(text: string, images?: File[]): Promise<ApiResponse<Grievance>> {
  if (images && images.length > 0) {
    const form = new FormData()
    form.append("text", text)
    images.forEach((file) => form.append("images", file))
    return apiFetch<ApiResponse<Grievance>>("/grievances", {
      method: "POST",
      body: form,
    })
  }
  return apiFetch<ApiResponse<Grievance>>("/grievances", {
    method: "POST",
    body: JSON.stringify({ text }),
  })
}


/**
 * Returns the authenticated URL to stream a grievance image.
 * The browser will send the Bearer token via the apiFetch wrapper,
 * but for <img> tags we need a one-time blob URL — use fetchGrievanceImageBlob.
 */
export function getGrievanceImageApiPath(grievanceId: string, imageId: string): string {
  return `/grievances/${grievanceId}/images/${imageId}`
}

/**
 * Fetches an image as a Blob URL so it can be used in <img src="..."> with auth.
 * routePrefix defaults to "/grievances" (citizen). Pass "/officer/grievances" or
 * "/admin/grievances" when calling from officer / admin views.
 */
export async function fetchGrievanceImageBlob(
  grievanceId: string,
  imageId: string,
  routePrefix = "/grievances"
): Promise<string> {
  const token = getStoredToken()
  const isVercel =
    typeof window !== "undefined" && window.location.hostname.endsWith(".vercel.app")
  const base =
    import.meta.env.VITE_API_BASE_URL ||
    (isVercel ? "https://grievance-backend-qv5e.onrender.com/api/v1" : "http://localhost:5000/api/v1")

  const res = await fetch(`${base}${routePrefix}/${grievanceId}/images/${imageId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error("Failed to load image")
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}

export async function getCitizenGrievancesApi(): Promise<ApiResponse<Grievance[]>> {
  return apiFetch<ApiResponse<Grievance[]>>("/grievances")
}

export async function getCitizenGrievanceByIdApi(id: string): Promise<ApiResponse<Grievance>> {
  return apiFetch<ApiResponse<Grievance>>(`/grievances/${id}`)
}

export async function getGrievanceAssignmentsApi(
  grievanceId: string
): Promise<ApiResponse<DepartmentAssignment[]>> {
  return apiFetch<ApiResponse<DepartmentAssignment[]>>(`/grievances/${grievanceId}/assignments`)
}

export async function getGrievanceAssignmentHistoryApi(
  grievanceId: string,
  assignmentId: string
): Promise<ApiResponse<GrievanceAssignmentHistory[]>> {
  return apiFetch<ApiResponse<GrievanceAssignmentHistory[]>>(
    `/grievances/${grievanceId}/assignments/${assignmentId}/history`
  )
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
  remarks?: string,
  resolution_description?: string
): Promise<ApiResponse<Grievance>> {
  return apiFetch<ApiResponse<Grievance>>(`/officer/grievances/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, remarks, resolution_description }),
  })
}

export async function getOfficerAssignmentsApi(filters?: {
  status?: string
  priority?: string
}): Promise<ApiResponse<DepartmentAssignment[]>> {
  const params = new URLSearchParams()
  if (filters?.status) params.append("status", filters.status)
  if (filters?.priority) params.append("priority", filters.priority)

  const queryStr = params.toString() ? `?${params.toString()}` : ""
  return apiFetch<ApiResponse<DepartmentAssignment[]>>(`/officer/assignments${queryStr}`)
}

export async function getOfficerAssignmentByIdApi(
  assignmentId: string
): Promise<ApiResponse<DepartmentAssignment>> {
  return apiFetch<ApiResponse<DepartmentAssignment>>(`/officer/assignments/${assignmentId}`)
}

export async function updateOfficerAssignmentStatusApi(
  assignmentId: string,
  status: string,
  remarks?: string,
  resolution_description?: string
): Promise<ApiResponse<{ updatedAssignment: DepartmentAssignment; grievance: Grievance }>> {
  return apiFetch<ApiResponse<{ updatedAssignment: DepartmentAssignment; grievance: Grievance }>>(
    `/officer/assignments/${assignmentId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status, remarks, resolution_description }),
    }
  )
}

export async function getOfficerAssignmentHistoryApi(
  assignmentId: string
): Promise<ApiResponse<GrievanceAssignmentHistory[]>> {
  return apiFetch<ApiResponse<GrievanceAssignmentHistory[]>>(
    `/officer/assignments/${assignmentId}/history`
  )
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

export async function sendChatbotMessageApi(
  message: string,
  session_context?: Record<string, unknown> | null
): Promise<ChatbotMessageResponse> {
  return apiFetch<ChatbotMessageResponse>("/chatbot/message", {
    method: "POST",
    body: JSON.stringify({ message, session_context }),
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
