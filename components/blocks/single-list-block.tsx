"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, Eye, EyeOff, Loader2 } from "lucide-react"
import type { Block } from "@/types"
import { AddVariableModal } from "@/components/modals/add-variable-modal"
import { CreateInputVariableModal } from "@/components/modals/create-input-variable-modal"

interface SingleListBlockProps {
  block: Block
  onEdit?: (block: Block) => void
  onDelete?: (blockId: string) => void
}

export function SingleListBlock({ block, onEdit, onDelete }: SingleListBlockProps) {
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
              <Badge variant="secondary" className="bg-green-100 text-green-800 px-2 py-1">
                Single List
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                Update
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
            <Select value={block.model}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="claude-3-5-sonnet-latest">claude-3-5-sonnet-latest</SelectItem>
                <SelectItem value="claude-3-5-haiku-latest">claude-3-5-haiku-latest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Prompt</label>
            <Textarea value={block.prompt} readOnly className="min-h-[100px] resize-none bg-gray-50" />
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

          {/* Store in Global List */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700">Store in Global List</div>
            <div className="flex items-center space-x-2">
              <Checkbox id="save-global" checked={block.config.store_in_global_list} />
              <label htmlFor="save-global" className="text-sm text-gray-600">
                Save as new Global List
              </label>
            </div>
          </div>

          {/* Output */}
          <div className="space-y-1">
            <span className="text-sm font-medium text-gray-700">Output:</span>
            <Input value={block.output_name} readOnly className="font-mono bg-gray-100" />
          </div>

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
