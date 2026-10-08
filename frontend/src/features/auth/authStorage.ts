import type { User } from "./authTypes"

const TOKEN_KEY = "igs_auth_token"
const USER_KEY = "igs_auth_user"

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY)
}

export const getStoredUser = (): User | null => {
  const data = localStorage.getItem(USER_KEY)
  if (!data) return null
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

export const setAuthData = (token: string, user: User) => {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const clearAuthData = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
