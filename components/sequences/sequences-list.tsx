"use client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Edit, Trash2, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSequences } from "@/hooks/use-sequences" // Updated
import { useToast } from "@/components/ui/use-toast"

export function SequencesList() {
  const { sequences, deleteSequence, loading, error, refetch } = useSequences() // Updated
  const router = useRouter()
  const { toast } = useToast()

  const handleEdit = (sequenceId: string) => {
    router.push(`/sequence/${sequenceId}`)
  }

  const handleDelete = async (sequenceId: string) => {
    if (confirm("Are you sure you want to delete this sequence?")) {
      try {
        await deleteSequence(sequenceId)
        // Toast is handled in the hook
      } catch (error) {
        // Error toast is handled in the hook, but you could add specific UI updates here
        console.error("Delete sequence failed in component:", error)
      }
    }
  }

  if (loading) {
    return (
      <div className="text-center py-10 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin mr-2" /> Loading sequences...
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-600">
        <p>Error: {error}</p>
        <Button onClick={refetch} variant="outline" className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sequences.map((sequence) => (
        <Card key={sequence.id} className="p-4 bg-white border border-gray-200 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-900 font-medium">{sequence.name}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(sequence.id)}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <Edit className="h-4 w-4" />
                Edit/Run
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(sequence.id)}
                className="text-gray-600 hover:text-red-600 flex items-center gap-1"
                disabled={loading} // Disable while any sequence operation is loading
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
          {sequence.description && <p className="text-xs text-gray-500 mt-1 truncate">{sequence.description}</p>}
        </Card>
      ))}
      {sequences.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No sequences found. Create your first sequence to get started.
        </div>
      )}
    </div>
  )
}
