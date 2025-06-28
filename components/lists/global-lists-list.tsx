"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Edit, Trash2, Loader2 } from "lucide-react"
import type { GlobalList } from "@/types"
import { EditGlobalListModal } from "@/components/modals/edit-global-list-modal"
import { useGlobalLists } from "@/hooks/use-global-lists" // New hook

export function GlobalListsList() {
  const { globalLists, loading, error, refetch, updateGlobalList, deleteGlobalList } = useGlobalLists()
  const [editingList, setEditingList] = useState<GlobalList | null>(null)

  const handleEdit = (list: GlobalList) => {
    setEditingList(list)
  }

  const handleDelete = async (listId: string) => {
    if (confirm("Are you sure you want to delete this global list?")) {
      await deleteGlobalList(listId) // Hook handles toast
    }
  }

  const handleUpdateListInModal = async (updatedList: GlobalList) => {
    // The modal's onUpdate will call this
    await updateGlobalList(updatedList.id, updatedList) // Hook handles toast
    setEditingList(null)
  }

  if (loading) {
    return (
      <div className="text-center py-10 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin mr-2" /> Loading global lists...
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
    <>
      <div className="space-y-3">
        {globalLists.map((list) => (
          <Card key={list.id} className="p-4 bg-white border border-gray-200">
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-900">List Name</div>
              <div className="text-sm text-gray-600">{list.name}</div>
              <div className="text-xs text-gray-500 mt-1">{list.values?.length || 0} item(s)</div>
              {list.description && <p className="text-xs text-gray-500 mt-1 truncate">{list.description}</p>}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(list)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit/Preview
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(list.id)}
                  className="text-gray-600 hover:text-red-600"
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {globalLists.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">No global lists found. Create your first global list.</div>
        )}
      </div>

      <EditGlobalListModal
        list={editingList}
        open={!!editingList}
        onOpenChange={(open) => !open && setEditingList(null)}
        onUpdate={handleUpdateListInModal} // Updated to use the new handler
      />
    </>
  )
}
