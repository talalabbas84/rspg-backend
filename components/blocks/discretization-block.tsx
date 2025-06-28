"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Edit, Eye, EyeOff, Loader2 } from "lucide-react"
import type { Block } from "@/types"
import { AddVariableModal } from "@/components/modals/add-variable-modal"
import { CreateInputVariableModal } from "@/components/modals/create-input-variable-modal"

interface DiscretizationBlockProps {
  block: Block
  onEdit?: (block: Block) => void
  onDelete?: (blockId: string) => void
}

export function DiscretizationBlock({ block, onEdit, onDelete }: DiscretizationBlockProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showAddVariable, setShowAddVariable] = useState(false)
  const [showCreateVariable, setShowCreateVariable] = useState(false)

  const handleEdit = () => {
    onEdit?.(block)
  }

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this block?")) {
      onDelete?.(block.id)
    }
  }

  const handlePreview = () => {
    setShowPreview(!showPreview)
  }

  const handleRun = async () => {
    setIsRunning(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
    } finally {
      setIsRunning(false)
    }
  }

  const handleAddVariable = (variable: string) => {
    console.log("Adding variable to prompt:", variable)
  }

  return (
    <>
      <Card className="p-6 bg-white border border-gray-200">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Input
                value={block.name}
                className="font-medium border-none shadow-none p-0 h-auto text-base bg-transparent"
                readOnly
              />
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 px-2 py-1">
                Discretization
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                Delete
              </Button>
              <Button variant="ghost" size="sm" onClick={handleEdit} className="text-gray-600 hover:text-gray-900 p-2">
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePreview}
                className="text-gray-600 hover:text-gray-900 p-2"
              >
                {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Model */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Model:</label>
            <div className="text-sm text-gray-600">{block.model}</div>
          </div>

          {/* Number of Outputs */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Number of Outputs:</label>
            <div className="text-sm text-gray-600">{block.config.number_of_outputs}</div>
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Prompt</label>
            <Textarea value={block.prompt} readOnly className="min-h-[100px] resize-none bg-gray-50" />

            {/* Add Variable Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddVariable(true)}
                className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                + Add Variable To Prompt
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddVariable(true)}
                className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                + Add List (Array) To Prompt
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateVariable(true)}
                className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                + Add new input variable
              </Button>
            </div>

            <div className="text-xs text-gray-500">
              Use {"<<variable>>"} to insert variables. For arrays, you can use {"<<arrayName>>"} for the entire array,{" "}
              {"<<arrayName[0]>>"} for a specific element, or {"<<arrayName[0][1]>>"} for a 2D array element.
            </div>
          </div>

          {/* Preview Section */}
          {showPreview && (
            <div className="space-y-2 border-t pt-4">
              <label className="text-sm font-medium text-gray-700">Compiled Prompt Preview:</label>
              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded border">
                {block.prompt.replace(/<<(\w+)>>/g, (match, variable) => `[${variable}]`)}
              </div>
            </div>
          )}

          {/* Run Button */}
          <Button
            onClick={handleRun}
            disabled={isRunning}
            className="bg-gray-600 text-white hover:bg-gray-700 w-full sm:w-auto"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              "Run Block"
            )}
          </Button>
        </div>
      </Card>

      {/* Modals */}
      <AddVariableModal open={showAddVariable} onOpenChange={setShowAddVariable} onSelectVariable={handleAddVariable} />
      <CreateInputVariableModal
        open={showCreateVariable}
        onOpenChange={setShowCreateVariable}
        onCreateVariable={(variable) => {
          console.log("Created variable:", variable)
          setShowCreateVariable(false)
        }}
      />
    </>
  )
}
