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
import { EditableResponse } from "./editable-response"

interface BlockResponsePairProps {
  block: Block
  onEdit?: (block: Block) => void
  onDelete?: (blockId: string) => void
}

interface BlockResponse {
  id: string
  blockId: string
  content: string
  outputs?: { [key: string]: string }
  editedAt?: string
}

export function BlockResponsePair({ block, onEdit, onDelete }: BlockResponsePairProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showAddVariable, setShowAddVariable] = useState(false)
  const [showCreateVariable, setShowCreateVariable] = useState(false)
  const [response, setResponse] = useState<BlockResponse | null>(() => {
    // Mock initial response data
    if (block.block_type === "standard") {
      return {
        id: `response-${block.id}`,
        blockId: block.id,
        content: `Independent claim: 1. A biometric water bottle that tracks hydration levels in real-time.
Dependent claims: 2. The water bottle of claim 1, wherein the hydration tracking is achieved through integrated sensors. 3. The water bottle of claim 2, further comprising a display that shows current hydration status. 4. The water bottle of claim 3, wherein the display provides personalized hydration recommendations. 5. The water bottle of claim 4, including a mobile app connectivity feature for comprehensive hydration monitoring.`,
      }
    }

    if (block.block_type === "discretization") {
      return {
        id: `response-${block.id}`,
        blockId: block.id,
        content: "",
        outputs: {
          "Output 1": "A biometric water bottle that tracks hydration levels in real-time",
          "Output 2":
            "The water bottle of claim 1, wherein the hydration tracking is achieved through integrated sensors",
          "Output 3": "The water bottle of claim 2, further comprising a display that shows current hydration status",
          "Output 4":
            "The water bottle of claim 3, wherein the display provides personalized hydration recommendations",
          "Output 5":
            "The water bottle of claim 4, including a mobile app connectivity feature for comprehensive hydration monitoring",
        },
      }
    }

    return null
  })

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

      // Simulate new response
      if (block.block_type === "standard") {
        setResponse({
          id: `response-${block.id}-${Date.now()}`,
          blockId: block.id,
          content: `Independent claim: 1. A biometric water bottle that tracks hydration levels in real-time.
Dependent claims: 2. The water bottle of claim 1, wherein the hydration tracking is achieved through integrated sensors. 3. The water bottle of claim 2, further comprising a display that shows current hydration status. 4. The water bottle of claim 3, wherein the display provides personalized hydration recommendations. 5. The water bottle of claim 4, including a mobile app connectivity feature for comprehensive hydration monitoring.`,
        })
      }
    } finally {
      setIsRunning(false)
    }
  }

  const handleAddVariable = (variable: string) => {
    console.log("Adding variable to prompt:", variable)
  }

  const handleResponseUpdate = (updatedResponse: BlockResponse) => {
    setResponse(updatedResponse)
  }

  const getBadgeColor = (blockType: string) => {
    switch (blockType) {
      case "standard":
        return "bg-blue-100 text-blue-800"
      case "discretization":
        return "bg-purple-100 text-purple-800"
      case "single_list":
        return "bg-green-100 text-green-800"
      case "multi_list":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getBadgeLabel = (blockType: string) => {
    switch (blockType) {
      case "standard":
        return "AI"
      case "discretization":
        return "Discretization"
      case "single_list":
        return "Single List"
      case "multi_list":
        return "Multi List"
      default:
        return "Unknown"
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Block Card - Left Side */}
        <Card className="p-6 bg-white border border-gray-200 h-full">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Input
                  value={block.name}
                  className="font-medium border-none shadow-none p-0 h-auto text-base bg-transparent"
                  readOnly
                />
                <Badge variant="secondary" className={`px-2 py-1 ${getBadgeColor(block.block_type)}`}>
                  {getBadgeLabel(block.block_type)}
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEdit}
                  className="text-gray-600 hover:text-gray-900 p-2"
                >
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

            {/* Number of Outputs for Discretization */}
            {block.block_type === "discretization" && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Number of Outputs:</label>
                <div className="text-sm text-gray-600">{block.config.number_of_outputs}</div>
              </div>
            )}

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
                Use {"<<variable>>"} to insert variables. For arrays, you can use {"<<arrayName>>"} for the entire
                array, {"<<arrayName[0]>>"} for a specific element, or {"<<arrayName[0][1]>>"} for a 2D array element.
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

            {/* Output */}
            <div className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Output:</span>
              <span className="ml-2 text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
                {block.output_name}
              </span>
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

        {/* Response Card - Right Side */}
        <Card className="p-6 bg-white border border-gray-200 h-full">
          {isRunning ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span className="text-sm text-gray-500">Processing...</span>
              </div>
            </div>
          ) : (
            <EditableResponse response={response} blockType={block.block_type} onUpdate={handleResponseUpdate} />
          )}
        </Card>
      </div>

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
