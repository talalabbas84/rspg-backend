"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Edit, Eye, EyeOff, Loader2, Sparkles, Zap } from "lucide-react"
import type { Block } from "@/types"
import { AddVariableModal } from "@/components/modals/add-variable-modal"
import { CreateInputVariableModal } from "@/components/modals/create-input-variable-modal"
import { EditableResponse } from "./editable-response"
import { VariableDisplaySection } from "@/components/ui/variable-display-section"
import { EnhancedAutocompleteTextarea } from "@/components/ui/enhanced-autocomplete-textarea"
import { useAvailableVariables } from "@/hooks/use-available-variables"

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

export function EnhancedBlockResponsePair({ block, onEdit, onDelete }: BlockResponsePairProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showAddVariable, setShowAddVariable] = useState(false)
  const [showCreateVariable, setShowCreateVariable] = useState(false)
  const [selectedVariable, setSelectedVariable] = useState<string | null>(null)
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

  const { variables } = useAvailableVariables(block.sequence_id)

  // Extract variables used in the prompt
  const getUsedVariables = () => {
    const variableMatches = [...block.prompt.matchAll(/<<([^>]+)>>/g)]
    const usedVariableNames = variableMatches.map((match) => match[1])

    return variables.filter((variable) => usedVariableNames.includes(variable.value))
  }

  const usedVariables = getUsedVariables()

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

  const handleVariableClick = (variable: string) => {
    setSelectedVariable(variable)
  }

  const handleViewVariable = (variable: any) => {
    console.log("Viewing variable:", variable)
    setSelectedVariable(variable.name)
  }

  const handleRemoveVariable = (variableName: string) => {
    // Remove variable from prompt
    const updatedPrompt = block.prompt.replace(new RegExp(`<<${variableName}>>`, "g"), "")
    console.log("Removing variable:", variableName, "Updated prompt:", updatedPrompt)
  }

  const getBadgeColor = (blockType: string) => {
    switch (blockType) {
      case "standard":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "discretization":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "single_list":
        return "bg-green-100 text-green-800 border-green-200"
      case "multi_list":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getBadgeLabel = (blockType: string) => {
    switch (blockType) {
      case "standard":
        return "AI Block"
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

  const getBlockIcon = (blockType: string) => {
    switch (blockType) {
      case "standard":
        return <Sparkles className="h-4 w-4" />
      case "discretization":
        return <Zap className="h-4 w-4" />
      default:
        return <Sparkles className="h-4 w-4" />
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Block Card - Left Side */}
        <Card className="p-6 bg-white border border-gray-200 h-full hover:shadow-lg transition-all duration-200">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {getBlockIcon(block.block_type)}
                  <Input
                    value={block.name}
                    className="font-medium border-none shadow-none p-0 h-auto text-base bg-transparent"
                    readOnly
                  />
                </div>
                <Badge variant="outline" className={`px-3 py-1 border ${getBadgeColor(block.block_type)}`}>
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
                  className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-red-600"
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Model:</label>
              <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md font-mono">{block.model}</div>
            </div>

            {/* Number of Outputs for Discretization */}
            {block.block_type === "discretization" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Number of Outputs:</label>
                <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
                  {block.config.number_of_outputs}
                </div>
              </div>
            )}

            {/* Variables Used Section */}
            <VariableDisplaySection
              variables={usedVariables}
              title="Variables Used in Prompt"
              onAddVariable={() => setShowAddVariable(true)}
              onRemoveVariable={handleRemoveVariable}
              onViewVariable={handleViewVariable}
              collapsible={true}
              defaultOpen={usedVariables.length > 0}
              showSearch={usedVariables.length > 3}
              showFilter={usedVariables.length > 5}
              emptyMessage="No variables used in this prompt"
              className="border border-gray-200 rounded-lg p-4 bg-gray-50/50"
            />

            {/* Prompt */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Prompt</label>
              <div className="relative">
                <EnhancedAutocompleteTextarea
                  value={block.prompt}
                  onChange={() => {}} // Read-only in display mode
                  placeholder="Prompt content..."
                  className="min-h-[120px] bg-gray-50"
                  options={variables}
                  onVariableClick={handleVariableClick}
                  disabled={true}
                  rows={6}
                />
              </div>

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

              <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-md border border-blue-200">
                <div className="space-y-1">
                  <div>
                    <strong>💡 Pro Tips:</strong>
                  </div>
                  <div>• Click on variables above to see their details and values</div>
                  <div>• Use the variable chips to quickly copy syntax or remove variables</div>
                  <div>• Hover over variables in the prompt to see bracket matching</div>
                </div>
              </div>
            </div>

            {/* Preview Section */}
            {showPreview && (
              <div className="space-y-3 border-t pt-4">
                <label className="text-sm font-medium text-gray-700">Compiled Prompt Preview:</label>
                <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-200">
                  {block.prompt.replace(/<<(\w+)>>/g, (match, variable) => {
                    const foundVar = variables.find((v) => v.value === variable)
                    return foundVar ? `[${foundVar.value}: ${foundVar.type}]` : `[${variable}: unknown]`
                  })}
                </div>
              </div>
            )}

            {/* Output */}
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Output:</span>
              <div className="bg-gray-50 px-3 py-2 rounded-md">
                <span className="text-sm text-gray-600 font-mono">{block.output_name}</span>
              </div>
            </div>

            {/* Run Button */}
            <Button
              onClick={handleRun}
              disabled={isRunning}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 w-full shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Run Block
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Response Card - Right Side */}
        <Card className="p-6 bg-white border border-gray-200 h-full hover:shadow-lg transition-all duration-200">
          {isRunning ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <div className="absolute inset-0 h-8 w-8 animate-ping rounded-full bg-blue-400 opacity-20"></div>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-700">Processing your request...</span>
                  <div className="text-xs text-gray-500">This may take a few moments</div>
                </div>
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
