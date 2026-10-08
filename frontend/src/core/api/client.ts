import { getStoredToken, clearAuthData } from "@/features/auth/authStorage"

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1"

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken()

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`

  let response: Response
  try {
    response = await fetch(url, {
      ...options,
      headers,
    })
  } catch (err: unknown) {
    console.error("Network connection error:", err)
    throw new Error(
      "Unable to connect to backend server. Please check your network connection.",
      { cause: err }
    )
  }

  let data: Record<string, unknown> | null = null
  const contentType = response.headers.get("content-type")
  if (contentType && contentType.includes("application/json")) {
    try {
      data = (await response.json()) as Record<string, unknown>
    } catch {
      data = null
    }
  }

  if (!response.ok) {
    const messageStr = typeof data?.message === "string" ? data.message : undefined
    const defaultMsg = messageStr || `Request failed with status ${response.status}`

    if (response.status === 401) {
      clearAuthData()
      window.dispatchEvent(new Event("unauthorized"))
      throw new Error(messageStr || "Session expired. Please log in again.")
    }

    if (response.status === 403) {
      throw new Error(
        messageStr || "Access denied. You do not have permission for this resource."
      )
    }

    if (response.status === 404) {
      throw new Error(messageStr || "The requested grievance or resource was not found.")
    }

    if (response.status === 503) {
      throw new Error(
        messageStr ||
          "Grievance analysis service is temporarily unavailable. Please try again later."
      )
    }

    throw new Error(defaultMsg)
  }

  return data as T
}
