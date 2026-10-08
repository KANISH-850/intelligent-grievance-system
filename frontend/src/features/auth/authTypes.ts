export type UserRole = "CITIZEN" | "OFFICER" | "ADMIN"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  department_id?: string | null
  department?: {
    id: string
    name: string
    code: string
  } | null
  created_at?: string
}

export interface AuthResponse {
  success: boolean
  message?: string
  token?: string
  user?: User
}
