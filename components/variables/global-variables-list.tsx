"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Edit, Trash2 } from "lucide-react"
import type { Variable } from "@/types"
import { EditVariableModal } from "@/components/modals/edit-variable-modal"

export function GlobalVariablesList() {
  const [variables, setVariables] = useState<Variable[]>([])
  const [editingVariable, setEditingVariable] = useState<Variable | null>(null)

  useEffect(() => {
    // Mock data - replace with actual API call
    setVariables([
      {
        id: "1",
        sequence_id: "1",
        name: "global",
        value: "Make 5 claims for a biometric water bottle....",
        variable_type: "global",
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      },
    ])
  }, [])

  const handleEdit = (variable: Variable) => {
    setEditingVariable(variable)
  }

  const handleDelete = async (variableId: string) => {
    if (confirm("Are you sure you want to delete this variable?")) {
      setVariables(variables.filter((variable) => variable.id !== variableId))
    }
  }

  const handleUpdateVariable = (updatedVariable: Variable) => {
    setVariables(variables.map((variable) => (variable.id === updatedVariable.id ? updatedVariable : variable)))
    setEditingVariable(null)
  }

  return (
    <>
      <div className="space-y-3">
        {variables.map((variable) => (
          <Card key={variable.id} className="p-4 bg-white border border-gray-200 hover:shadow-sm transition-shadow">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Variable Name</div>
                  <div className="text-sm text-gray-900">{variable.name}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Variable Text</div>
                  <div className="text-sm text-gray-600 truncate" title={variable.value}>
                    {variable.value}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(variable)}
                  className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(variable.id)}
                  className="text-gray-600 hover:text-red-600 flex items-center gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {variables.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No global variables found. Create your first variable to get started.
          </div>
        )}
      </div>

      <EditVariableModal
        variable={editingVariable}
        open={!!editingVariable}
        onOpenChange={(open) => !open && setEditingVariable(null)}
        onUpdate={handleUpdateVariable}
      />
    </>
  )
}
