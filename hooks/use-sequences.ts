"use client"

import { useState, useEffect, useCallback } from "react"
import type { Sequence } from "@/types" // Assuming types are defined
import { apiClient } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast" // For error notifications

export function useSequences() {
  const [sequences, setSequences] = useState<Sequence[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchSequences = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiClient.getSequences()
      setSequences(data)
    } catch (err: any) {
      setError(err.message || "Failed to fetch sequences")
      toast({ variant: "destructive", title: "Error", description: err.message || "Failed to fetch sequences" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const createSequence = async (data: { name: string; description?: string }) => {
    try {
      setLoading(true)
      setError(null)
      const newSequence = await apiClient.createSequence(data)
      setSequences((prev) => [...prev, newSequence])
      toast({ title: "Success", description: "Sequence created successfully." })
      return newSequence
    } catch (err: any) {
      setError(err.message || "Failed to create sequence")
      toast({ variant: "destructive", title: "Error", description: err.message || "Failed to create sequence" })
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateSequence = async (id: string, data: { name?: string; description?: string }) => {
    try {
      setLoading(true)
      setError(null)
      const updated = await apiClient.updateSequence(id, data)
      setSequences((prev) => prev.map((seq) => (seq.id === id ? updated : seq)))
      toast({ title: "Success", description: "Sequence updated successfully." })
      return updated
    } catch (err: any) {
      setError(err.message || "Failed to update sequence")
      toast({ variant: "destructive", title: "Error", description: err.message || "Failed to update sequence" })
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteSequence = async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      await apiClient.deleteSequence(id)
      setSequences((prev) => prev.filter((seq) => seq.id !== id))
      toast({ title: "Success", description: "Sequence deleted successfully." })
    } catch (err: any) {
      setError(err.message || "Failed to delete sequence")
      toast({ variant: "destructive", title: "Error", description: err.message || "Failed to delete sequence" })
      throw err
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSequences()
  }, [fetchSequences])

  return {
    sequences,
    loading,
    error,
    createSequence,
    updateSequence,
    deleteSequence,
    refetch: fetchSequences,
  }
}
