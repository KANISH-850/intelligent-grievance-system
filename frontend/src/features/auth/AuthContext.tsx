import React, { createContext, useContext, useEffect, useState } from "react"
import type { User, UserRole } from "./authTypes"
import { getStoredToken, getStoredUser, setAuthData, clearAuthData } from "./authStorage"
import { loginApi, registerApi, getMeApi } from "./authApi"

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<UserRole>
  register: (name: string, email: string, password: string) => Promise<UserRole>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getStoredUser())
  const [token, setToken] = useState<string | null>(getStoredToken())
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    async function verifySession() {
      const storedToken = getStoredToken()
      if (storedToken) {
        try {
          const res = await getMeApi(storedToken)
          setUser(res.user)
          setToken(storedToken)
          setAuthData(storedToken, res.user)
        } catch (err) {
          console.warn("Session expired or invalid, logging out:", err)
          clearAuthData()
          setUser(null)
          setToken(null)
        }
      } else {
        setUser(null)
        setToken(null)
      }
      setIsLoading(false)
    }
    verifySession()
  }, [])

  const login = async (email: string, password: string): Promise<UserRole> => {
    const res = await loginApi(email, password)
    if (res.token && res.user) {
      setToken(res.token)
      setUser(res.user)
      setAuthData(res.token, res.user)
      return res.user.role
    }
    throw new Error("Invalid response from server")
  }

  const register = async (name: string, email: string, password: string): Promise<UserRole> => {
    const res = await registerApi(name, email, password)
    if (res.token && res.user) {
      setToken(res.token)
      setUser(res.user)
      setAuthData(res.token, res.user)
      return res.user.role
    }
    throw new Error("Invalid response from server")
  }

  const logout = () => {
    clearAuthData()
    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
