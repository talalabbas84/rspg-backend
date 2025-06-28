"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Search } from "lucide-react"

interface AddVariableModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectVariable: (variable: string) => void
}

interface AvailableVariable {
  name: string
  type: "global" | "list" | "output"
  value?: string
}

export function AddVariableModal({ open, onOpenChange, onSelectVariable }: AddVariableModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [variables, setVariables] = useState<AvailableVariable[]>([])

  useEffect(() => {
    // Mock available variables - replace with actual API call
    setVariables([
      { name: "global", type: "global", value: "Make 5 claims for a biometric water bottle..." },
      { name: "OP1", type: "output", value: "Output from Block 1" },
      { name: "OP2", type: "output", value: "Output from Block 2" },
      { name: "NewGlobalList", type: "list", value: "List of items" },
      { name: "items222", type: "list", value: "Another list" },
      { name: "paragraph_check", type: "list", value: "Paragraph checking list" },
    ])
  }, [])

  const filteredVariables = variables.filter((variable) =>
    variable.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSelectVariable = (variableName: string) => {
    onSelectVariable(variableName)
    onOpenChange(false)
    setSearchTerm("")
  }

  const getVariableTypeColor = (type: string) => {
    switch (type) {
      case "global":
        return "bg-blue-100 text-blue-800"
      case "list":
        return "bg-green-100 text-green-800"
      case "output":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Add Variable to Prompt</DialogTitle>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search variables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Variables List */}
          <div className="max-h-60 overflow-y-auto space-y-2">
            {filteredVariables.map((variable) => (
              <div
                key={variable.name}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => handleSelectVariable(variable.name)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{variable.name}</span>
                    <span className={`text-xs px-2 py-1 rounded ${getVariableTypeColor(variable.type)}`}>
                      {variable.type}
                    </span>
                  </div>
                  {variable.value && (
                    <div className="text-sm text-gray-500 truncate mt-1" title={variable.value}>
                      {variable.value}
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                  Add
                </Button>
              </div>
            ))}
          </div>

          {filteredVariables.length === 0 && (
            <div className="text-center py-8 text-gray-500">No variables found matching "{searchTerm}"</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
