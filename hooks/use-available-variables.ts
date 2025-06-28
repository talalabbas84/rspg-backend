"use client"

import { useState, useEffect } from "react"

interface AvailableVariable {
  value: string
  label: string
  type: "global" | "list" | "output"
  description?: string
}

export function useAvailableVariables(sequenceId?: string) {
  const [variables, setVariables] = useState<AvailableVariable[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVariables = async () => {
      try {
        setLoading(true)

        // Mock data - replace with actual API call
        await new Promise((resolve) => setTimeout(resolve, 500))

        const mockVariables: AvailableVariable[] = [
          {
            value: "global",
            label: "Global Variable",
            type: "global",
            description: "Make 5 claims for a biometric water bottle...",
          },
          {
            value: "user_input",
            label: "User Input",
            type: "global",
            description: "User provided input variable",
          },
          {
            value: "system_prompt",
            label: "System Prompt",
            type: "global",
            description: "System-level prompt configuration",
          },
          {
            value: "OP1",
            label: "Output 1",
            type: "output",
            description: "Output from Block 1",
          },
          {
            value: "OP2",
            label: "Output 2",
            type: "output",
            description: "Output from Block 2 (Discretization)",
          },
          {
            value: "claims_output",
            label: "Claims Output",
            type: "output",
            description: "Generated patent claims from previous block",
          },
          {
            value: "NewGlobalList",
            label: "New Global List",
            type: "list",
            description: "List of items for processing",
          },
          {
            value: "items222",
            label: "Items List",
            type: "list",
            description: "Another list of items",
          },
          {
            value: "paragraph_check",
            label: "Paragraph Check List",
            type: "list",
            description: "List for paragraph validation",
          },
          {
            value: "discretized_claims",
            label: "Discretized Claims",
            type: "list",
            description: "Claims broken down into individual components",
          },
          {
            value: "validation_results",
            label: "Validation Results",
            type: "output",
            description: "Results from validation processes",
          },
        ]

        setVariables(mockVariables)
      } catch (error) {
        console.error("Failed to fetch variables:", error)
        setVariables([])
      } finally {
        setLoading(false)
      }
    }

    fetchVariables()
  }, [sequenceId])

  const getVariablesByType = (type: "global" | "list" | "output") => {
    return variables.filter((variable) => variable.type === type)
  }

  const searchVariables = (query: string) => {
    const lowercaseQuery = query.toLowerCase()
    return variables.filter(
      (variable) =>
        variable.value.toLowerCase().includes(lowercaseQuery) ||
        variable.label.toLowerCase().includes(lowercaseQuery) ||
        (variable.description && variable.description.toLowerCase().includes(lowercaseQuery)),
    )
  }

  return {
    variables,
    loading,
    getVariablesByType,
    searchVariables,
  }
}
