import type { AuthResponse, User } from "./authTypes"

const API_BASE = "http://localhost:5000/api/v1/auth"

export async function loginApi(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.message || "Login failed")
  }
  return data
}

export async function registerApi(name: string, email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.message || "Registration failed")
  }
  return data
}

export async function getMeApi(token: string): Promise<{ success: boolean; user: User }> {
  const res = await fetch(`${API_BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch user session")
  }
  return data
}
