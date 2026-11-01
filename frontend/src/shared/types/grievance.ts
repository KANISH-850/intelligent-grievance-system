export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

export type Status =
  | "SUBMITTED"
  | "ASSIGNED"
  | "UNDER_REVIEW"
  | "IN_PROGRESS"
  | "PARTIALLY_RESOLVED"
  | "RESOLVED"
  | "REJECTED"

export interface Department {
  id: string
  name: string
  code: string
  description?: string | null
}

export interface GrievanceStatusHistory {
  id: string
  grievance_id?: string
  status: Status
  remarks: string | null
  changed_by?: string
  created_at: string
  user?: {
    id: string
    name: string
    role: string
  }
}

export interface GrievanceAssignmentHistory {
  id: string
  assignment_id: string
  grievance_id: string
  department_id: string
  previous_status?: Status | null
  status: Status
  remarks?: string | null
  changed_by: string
  created_at: string
  department?: Department
  user?: {
    id: string
    name: string
    role: string
  }
}

export interface Grievance {
  id: string
  grievance_number: string
  user_id: string
  original_text: string
  detected_language: string | null
  detected_language_code?: string | null
  translated_text: string | null
  translation_status?: string | null
  translation_method?: string | null
  translation_error?: string | null
  translated_at?: string | null
  category: string
  routing_status?: string
  priority: Priority
  department_id: string
  status: Status
  created_at: string
  updated_at: string
  // Phase 11 Metadata
  ai_confidence?: number | null
  ai_confidence_level?: "HIGH" | "MEDIUM" | "LOW" | null
  ai_review_required?: boolean
  ai_classification_method?: string | null
  ai_explanation_terms?: string[]
  ai_original_category?: string | null
  is_human_corrected?: boolean
  human_corrected_by?: string | null
  human_corrected_at?: string | null
  department?: Department
  assignments?: DepartmentAssignment[]
  officer_assignment?: DepartmentAssignment | null
  user?: {
    id: string
    name: string
    email: string
  }
  status_history?: GrievanceStatusHistory[]
  images?: GrievanceImage[]
}

export interface DepartmentAssignment {
  id: string
  grievance_id: string
  department_id: string
  status: Status
  routing_reason?: string | null
  assigned_officer_id?: string | null
  notes?: string | null
  remarks?: string | null
  resolution_description?: string | null
  started_at?: string | null
  resolved_at?: string | null
  created_at: string
  updated_at: string
  department?: Department
  assigned_officer?: {
    id: string
    name: string
    email: string
  } | null
  history?: GrievanceAssignmentHistory[]
}

export interface GrievanceImage {
  id: string;
  grievance_id: string;
  filename: string;
  mime_type: string;
  size: number;
  path: string;
  analysis_status?: string | null;
  image_type?: "civic_issue" | "unrelated" | "uncertain" | null;
  is_grievance_related?: boolean;
  image_description?: string | null;
  detected_issue?: string | null;
  visual_observations?: string[];
  analysis_confidence?: number | null;
  human_review_required?: boolean;
}


export interface CorrectClassificationPayload {
  category: string
  remarks?: string
}

export interface AIAnalyticsData {
  total_predictions: number
  confidence_distribution: {
    high: number
    medium: number
    low: number
  }
  ai_review_required_count: number
  human_corrected_count: number
  methods: Array<{
    method: string
    count: number
  }>
}

export interface SubmitGrievancePayload {
  text: string
}

export interface UpdateStatusPayload {
  status: Status
  remarks?: string
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  department?: Department
}

export interface ChatbotMessageResponse {
  success: boolean
  message: string
  language?: string
  intent?: string
  grievance_number?: string | null
  confidence?: number
  session_context?: Record<string, unknown> | null
  explanation_terms?: string[]
  grievance?: {
    grievance_number: string
    status: Status
    department: string
    category?: string
    created_at?: string
    ai_confidence?: number
    ai_explanation_terms?: string[]
  } | null
}

export interface AnalyticsSummary {
  total: number
  submitted: number
  assigned: number
  under_review: number
  in_progress: number
  resolved: number
  rejected: number
  high_critical_count: number
  resolution_rate: number
}

export interface DepartmentAnalyticsItem {
  id: string
  code: string
  name: string
  count: number
}

export interface CategoryAnalyticsItem {
  category: string
  count: number
}

export interface AnalyticsData {
  department?: Department
  summary: AnalyticsSummary
  priority: Record<Priority, number>
  departments?: DepartmentAnalyticsItem[]
  categories: CategoryAnalyticsItem[]
}

export type NotificationType =
  | "GRIEVANCE_SUBMITTED"
  | "GRIEVANCE_ASSIGNED"
  | "STATUS_CHANGED"
  | "HIGH_PRIORITY"
  | "CRITICAL_PRIORITY"
  | "GRIEVANCE_RESOLVED"
  | "GRIEVANCE_REJECTED"

export interface NotificationItem {
  id: string
  user_id: string
  grievance_id: string | null
  type: NotificationType
  title: string
  message: string
  is_read: boolean
  created_at: string
  grievance?: {
    id: string
    grievance_number: string
    status: Status
  } | null
}

export interface NotificationListResponse {
  success: boolean
  data: NotificationItem[]
  unreadCount: number
}
