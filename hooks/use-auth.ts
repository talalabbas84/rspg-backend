"use client"

import type React from "react"
import { useState, useEffect, createContext, useContext, useCallback } from "react"
import { apiClient } from "@/lib/api"
import { useRouter } from "next/navigation"
import type { User } from "@/types"
import { toast } from "sonner"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("access_token")
    if (token) {
      try {
        const userData = await apiClient.getMe()
        setUser(userData)
      } catch (err) {
        console.error("Token validation failed:", err)
        localStorage.removeItem("access_token")
        setUser(null)
      } finally {
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const response = await apiClient.login({ email, password })
      localStorage.setItem("access_token", response.access_token)
      await fetchUser()
      router.push("/")
      toast.success("Login successful!")
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Invalid credentials. Please try again."
      toast.error(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const register = async (name: string, email: string, password: string) => {
    setLoading(true)
    try {
      await apiClient.register({ name, email, password })
      toast.success("Registration successful! Please log in.")
      router.push("/login")
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Registration failed. Please try again."
      toast.error(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem("access_token")
    router.push("/login")
    toast.info("You have been logged out.")
  }, [router])

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !loading && !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
