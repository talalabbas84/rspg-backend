"use client"

import { useState, useEffect } from "react"
import type { Block } from "@/types"
import { apiClient } from "@/lib/api"

export function useBlocks(sequenceId: string) {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBlocks = async () => {
    if (!sequenceId) return

    try {
      setLoading(true)
      const data = await apiClient.getBlocks(sequenceId)
      setBlocks(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch blocks")
    } finally {
      setLoading(false)
    }
  }

  const createBlock = async (data: any) => {
    try {
      const newBlock = await apiClient.createBlock({ ...data, sequence_id: sequenceId })
      setBlocks((prev) => [...prev, newBlock])
      return newBlock
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create block")
      throw err
    }
  }

  const updateBlock = async (id: string, data: any) => {
    try {
      const updatedBlock = await apiClient.updateBlock(id, data)
      setBlocks((prev) => prev.map((block) => (block.id === id ? updatedBlock : block)))
      return updatedBlock
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update block")
      throw err
    }
  }

  const deleteBlock = async (id: string) => {
    try {
      await apiClient.deleteBlock(id)
      setBlocks((prev) => prev.filter((block) => block.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete block")
      throw err
    }
  }

  const executeBlock = async (id: string, context?: any) => {
    try {
      const result = await apiClient.executeBlock(id, context)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute block")
      throw err
    }
  }

  useEffect(() => {
    fetchBlocks()
  }, [sequenceId])

  return {
    blocks,
    loading,
    error,
    createBlock,
    updateBlock,
    deleteBlock,
    executeBlock,
    refetch: fetchBlocks,
  }
}
