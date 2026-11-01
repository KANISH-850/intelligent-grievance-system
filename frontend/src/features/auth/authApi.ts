import { apiFetch } from "@/core/api/client"
import type { AuthResponse, User } from "./authTypes"

export async function loginApi(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export async function registerApi(name: string, email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  })
}

export async function getMeApi(token: string): Promise<{ success: boolean; user: User }> {
  return apiFetch<{ success: boolean; user: User }>("/auth/me", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}
