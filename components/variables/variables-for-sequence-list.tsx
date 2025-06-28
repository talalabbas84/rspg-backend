"use client"

import { useState } from "react"
import type { Variable as SequenceVariable } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Edit, Trash2, Loader2 } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { EditVariableModal } from "@/components/modals/edit-variable-modal" // Re-use if suitable

interface VariablesForSequenceListProps {
  sequenceId: string
  variables: SequenceVariable[]
  onVariableChange: () => void // Callback to refetch variables
}

export function VariablesForSequenceList({ sequenceId, variables, onVariableChange }: VariablesForSequenceListProps) {
  const { toast } = useToast()
  const [editingVariable, setEditingVariable] = useState<SequenceVariable | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null) // Store ID of var being deleted

  const handleEdit = (variable: SequenceVariable) => {
    setEditingVariable(variable)
    setShowEditModal(true)
  }

  const handleDelete = async (variableId: string) => {
    if (confirm("Are you sure you want to delete this sequence variable?")) {
      setIsDeleting(variableId)
      try {
        await apiClient.deleteVariable(variableId)
        toast({ title: "Success", description: "Variable deleted." })
        onVariableChange() // Trigger refetch in parent
      } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: `Failed to delete variable: ${error.message}` })
      } finally {
        setIsDeleting(null)
      }
    }
  }

  const handleUpdateVariable = async (updatedVar: SequenceVariable) => {
    try {
      await apiClient.updateVariable(updatedVar.id, updatedVar)
      toast({ title: "Success", description: "Variable updated." })
      onVariableChange()
      setShowEditModal(false)
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: `Failed to update variable: ${error.message}` })
    }
  }

  if (!variables) {
    return <div className="text-center py-4">Loading variables...</div>
  }

  return (
    <>
      <div className="space-y-3">
        {variables.length === 0 && (
          <p className="text-center text-gray-500 py-4">No sequence-specific variables defined yet.</p>
        )}
        {variables.map((variable) => (
          <Card key={variable.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">{variable.name}</CardTitle>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                {variable.variable_type?.replace("_", " ").toUpperCase() || "UNKNOWN"}
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-600 mb-2 truncate" title={variable.value || variable.description}>
                Value/Description: {variable.value || variable.description || "N/A"}
              </div>
              {variable.value_json && (
                <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-28">
                  {JSON.stringify(variable.value_json, null, 2)}
                </pre>
              )}
              <div className="flex items-center gap-2 pt-3 border-t mt-3">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(variable)} className="text-xs">
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(variable.id)}
                  className="text-xs text-red-600 hover:text-red-700"
                  disabled={isDeleting === variable.id}
                >
                  {isDeleting === variable.id ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                  )}
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {editingVariable && (
        <EditVariableModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          variable={editingVariable}
          onUpdate={handleUpdateVariable}
          sequenceId={sequenceId} // Pass sequenceId for context if needed by modal
        />
      )}
    </>
  )
}
