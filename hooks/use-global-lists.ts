"use client"

import { useState, useEffect, useCallback } from "react"
import type { GlobalList } from "@/types" // Assuming types are defined
import { apiClient } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

export function useGlobalLists() {
  const [globalLists, setGlobalLists] = useState<GlobalList[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchGlobalLists = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiClient.getGlobalLists()
      setGlobalLists(data)
    } catch (err: any) {
      setError(err.message || "Failed to fetch global lists")
      toast({ variant: "destructive", title: "Error", description: err.message || "Failed to fetch global lists" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const createGlobalList = async (data: { name: string; description?: string; values: string[] }) => {
    try {
      setLoading(true)
      setError(null)
      const newList = await apiClient.createGlobalList(data) // API needs to handle 'values'
      setGlobalLists((prev) => [...prev, newList])
      toast({ title: "Success", description: "Global list created successfully." })
      return newList
    } catch (err: any) {
      setError(err.message || "Failed to create global list")
      toast({ variant: "destructive", title: "Error", description: err.message || "Failed to create global list" })
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateGlobalList = async (id: string, data: Partial<GlobalList>) => {
    try {
      setLoading(true)
      setError(null)
      const updatedList = await apiClient.updateGlobalList(id, data)
      setGlobalLists((prev) => prev.map((list) => (list.id === id ? updatedList : list)))
      toast({ title: "Success", description: "Global list updated successfully." })
      return updatedList
    } catch (err: any) {
      setError(err.message || "Failed to update global list")
      toast({ variant: "destructive", title: "Error", description: err.message || "Failed to update global list" })
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteGlobalList = async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      await apiClient.deleteGlobalList(id)
      setGlobalLists((prev) => prev.filter((list) => list.id !== id))
      toast({ title: "Success", description: "Global list deleted successfully." })
    } catch (err: any) {
      setError(err.message || "Failed to delete global list")
      toast({ variant: "destructive", title: "Error", description: err.message || "Failed to delete global list" })
      throw err
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGlobalLists()
  }, [fetchGlobalLists])

  return {
    globalLists,
    loading,
    error,
    createGlobalList,
    updateGlobalList,
    deleteGlobalList,
    refetch: fetchGlobalLists,
  }
}
