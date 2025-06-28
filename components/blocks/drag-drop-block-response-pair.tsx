"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Edit, Eye, EyeOff, Loader2, Sparkles, Zap, Menu } from "lucide-react"
import type { Block } from "@/types"
import { AddVariableModal } from "@/components/modals/add-variable-modal"
import { CreateInputVariableModal } from "@/components/modals/create-input-variable-modal"
import { EditableResponse } from "./editable-response"
import { DroppableVariableSection } from "@/components/ui/droppable-variable-section"
import { EnhancedAutocompleteTextarea } from "@/components/ui/enhanced-autocomplete-textarea"
import { useAvailableVariables } from "@/hooks/use-available-variables"
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  closestCenter,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { DraggableVariableChip } from "@/components/ui/draggable-variable-chip"

interface BlockResponsePairProps {
  block: Block
  onEdit?: (block: Block) => void
  onDelete?: (blockId: string) => void
  onUpdateBlock?: (block: Block) => void
}

interface BlockResponse {
  id: string
  blockId: string
  content: string
  outputs?: { [key: string]: string }
  editedAt?: string
}

export function DragDropBlockResponsePair({ block, onEdit, onDelete, onUpdateBlock }: BlockResponsePairProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showAddVariable, setShowAddVariable] = useState(false)
  const [showCreateVariable, setShowCreateVariable] = useState(false)
  const [selectedVariable, setSelectedVariable] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showMobileActions, setShowMobileActions] = useState(false)
  const [currentPrompt, setCurrentPrompt] = useState(
    block.prompt || "Test prompt with <<variable1>> and <<variable2>> for debugging",
  )
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

  // Configure sensors for better touch/mouse support
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  const { variables } = useAvailableVariables(block.sequence_id)

  // Extract variables used in the prompt with their order
  const getUsedVariables = () => {
    console.log("=== getUsedVariables DEBUG ===")
    console.log("currentPrompt:", currentPrompt)

    if (!currentPrompt || typeof currentPrompt !== "string") {
      console.log("No valid prompt found")
      return []
    }

    // Simple regex to find all <<variable>> patterns
    const regex = /<<([^>]+)>>/g
    const matches = []
    let match

    while ((match = regex.exec(currentPrompt)) !== null) {
      matches.push(match[1])
    }

    console.log("Raw matches:", matches)

    // Create simple variable objects
    const usedVars = matches.map((varName, index) => {
      const variable = {
        id: varName,
        name: varName,
        value: varName,
        type: "global" as const,
        description: `Variable: ${varName}`,
      }
      console.log(`Created variable ${index}:`, variable)
      return variable
    })

    console.log("Final usedVars:", usedVars)
    return usedVars
  }

  const [usedVariables, setUsedVariables] = useState<any[]>([])

  // Update used variables when prompt or available variables change
  useEffect(() => {
    console.log("Effect triggered - currentPrompt:", currentPrompt)
    console.log("Effect triggered - variables:", variables)

    const newUsedVariables = getUsedVariables()
    console.log("New used variables:", newUsedVariables)

    setUsedVariables(newUsedVariables)
  }, [currentPrompt, variables])

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
    const newPrompt = currentPrompt + (currentPrompt ? " " : "") + `<<${variable}>>`
    setCurrentPrompt(newPrompt)

    // Update the block
    if (onUpdateBlock) {
      onUpdateBlock({ ...block, prompt: newPrompt })
    }
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
    const updatedPrompt = currentPrompt
      .replace(new RegExp(`<<${variableName}>>`, "g"), "")
      .replace(/\s+/g, " ")
      .trim()
    setCurrentPrompt(updatedPrompt)

    // Update the block
    if (onUpdateBlock) {
      onUpdateBlock({ ...block, prompt: updatedPrompt })
    }
  }

  const handleReorderVariables = (newOrder: any[]) => {
    setUsedVariables(newOrder)
    updatePromptWithNewOrder(newOrder)
  }

  const handleUpdatePrompt = (newPrompt: string) => {
    setCurrentPrompt(newPrompt)

    // Update the block
    if (onUpdateBlock) {
      onUpdateBlock({ ...block, prompt: newPrompt })
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = usedVariables.findIndex((variable) => variable.name === active.id)
    const newIndex = usedVariables.findIndex((variable) => variable.name === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(usedVariables, oldIndex, newIndex)
      handleReorderVariables(newOrder)
    }
  }

  const updatePromptWithNewOrder = (newOrder: any[]) => {
    // Remove all variables from prompt first
    let basePrompt = currentPrompt
    usedVariables.forEach((variable) => {
      basePrompt = basePrompt.replace(new RegExp(`<<${variable.name}>>`, "g"), "")
    })

    // Clean up extra spaces
    basePrompt = basePrompt.replace(/\s+/g, " ").trim()

    // Add variables back in new order
    const newPrompt = basePrompt + " " + newOrder.map((v) => `<<${v.name}>>`).join(" ")
    setCurrentPrompt(newPrompt.trim())

    // Update the block
    if (onUpdateBlock) {
      onUpdateBlock({ ...block, prompt: newPrompt.trim() })
    }
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

  // Find the active variable for the drag overlay
  const activeVariable = activeId ? usedVariables.find((v) => v.name === activeId) : null

  // Debug logging
  console.log("Current prompt:", currentPrompt)
  console.log("Used variables:", usedVariables)
  console.log("Available variables:", variables)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col xl:grid xl:grid-cols-2 gap-4 xl:gap-6 items-start">
        {/* Block Card - Full width on mobile, left side on desktop */}
        <Card className="p-4 sm:p-6 w-full bg-white border border-gray-200 hover:shadow-lg transition-all duration-200">
          <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {getBlockIcon(block.block_type)}
                  <Input
                    value={block.name}
                    className="font-medium border-none shadow-none p-0 h-auto text-sm sm:text-base bg-transparent min-w-0 flex-1"
                    readOnly
                  />
                </div>
                <Badge
                  variant="outline"
                  className={`px-2 sm:px-3 py-1 border text-xs sm:text-sm whitespace-nowrap ${getBadgeColor(block.block_type)}`}
                >
                  {getBadgeLabel(block.block_type)}
                </Badge>
              </div>

              {/* Desktop Actions */}
              <div className="hidden sm:flex items-center gap-2">
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

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileActions(!showMobileActions)}
                className="sm:hidden text-gray-600 hover:text-gray-900 p-2"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>

            {/* Mobile Actions Menu */}
            {showMobileActions && (
              <div className="sm:hidden flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 text-xs"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-red-600 text-xs"
                >
                  Delete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreview}
                  className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 text-xs"
                >
                  {showPreview ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                  {showPreview ? "Hide Preview" : "Show Preview"}
                </Button>
              </div>
            )}

            {/* Model */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Model:</label>
              <div className="text-xs sm:text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md font-mono break-all">
                {block.model}
              </div>
            </div>

            {/* Number of Outputs for Discretization */}
            {block.block_type === "discretization" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Number of Outputs:</label>
                <div className="text-xs sm:text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
                  {block.config.number_of_outputs}
                </div>
              </div>
            )}

            {/* Debug Info */}
            <div className="text-xs text-gray-500 bg-yellow-50 p-2 rounded border">
              <div>Debug: Found {usedVariables.length} variables</div>
              <div className="break-all">Variables: {usedVariables.map((v) => v?.name || "unnamed").join(", ")}</div>
              <div className="break-all">Prompt: {currentPrompt.substring(0, 100)}...</div>
              <div>Available vars: {variables?.length || 0}</div>
            </div>

            {/* Draggable Variables Used Section */}
            <DroppableVariableSection
              variables={usedVariables.filter((v) => v && v.name && typeof v.name === "string")}
              title="Variables Used in Prompt"
              onAddVariable={() => setShowAddVariable(true)}
              onRemoveVariable={handleRemoveVariable}
              onViewVariable={handleViewVariable}
              onReorderVariables={handleReorderVariables}
              onUpdatePrompt={handleUpdatePrompt}
              collapsible={true}
              defaultOpen={true}
              showSearch={usedVariables.length > 3}
              showFilter={usedVariables.length > 5}
              emptyMessage="No variables used in this prompt"
              className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-gray-50/50"
              droppableId="used-variables"
              currentPrompt={currentPrompt}
            />

            {/* Prompt */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Prompt</label>
              <div className="relative">
                <EnhancedAutocompleteTextarea
                  value={currentPrompt}
                  onChange={setCurrentPrompt}
                  placeholder="Prompt content..."
                  className="min-h-[100px] sm:min-h-[120px] bg-gray-50 text-sm"
                  options={variables}
                  onVariableClick={handleVariableClick}
                  disabled={false}
                  rows={4}
                />
              </div>

              {/* Add Variable Buttons */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddVariable(true)}
                  className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 text-xs sm:text-sm"
                >
                  + Add Variable To Prompt
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddVariable(true)}
                  className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 text-xs sm:text-sm"
                >
                  + Add List (Array) To Prompt
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateVariable(true)}
                  className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 text-xs sm:text-sm"
                >
                  + Add new input variable
                </Button>
              </div>

              <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-md border border-blue-200">
                <div className="space-y-1">
                  <div>
                    <strong>🎯 Drag & Drop Features:</strong>
                  </div>
                  <div>• Drag variable chips by their grip handle to reorder them</div>
                  <div>• The prompt automatically updates to match the new order</div>
                  <div>• Position numbers show the current order</div>
                  <div>• Use reset/shuffle buttons for quick reordering</div>
                </div>
              </div>
            </div>

            {/* Preview Section */}
            {showPreview && (
              <div className="space-y-3 border-t pt-4">
                <label className="text-sm font-medium text-gray-700">Compiled Prompt Preview:</label>
                <div className="text-xs sm:text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-200 break-all">
                  {currentPrompt.replace(/<<(\w+)>>/g, (match, variable) => {
                    const foundVar = variables?.find((v) => v.value === variable)
                    return foundVar ? `[${foundVar.value}: ${foundVar.type}]` : `[${variable}: unknown]`
                  })}
                </div>
              </div>
            )}

            {/* Output */}
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Output:</span>
              <div className="bg-gray-50 px-3 py-2 rounded-md">
                <span className="text-xs sm:text-sm text-gray-600 font-mono break-all">{block.output_name}</span>
              </div>
            </div>

            {/* Run Button */}
            <Button
              onClick={handleRun}
              disabled={isRunning}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 w-full shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
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

        {/* Response Card - Full width on mobile, right side on desktop */}
        <Card className="p-4 sm:p-6 w-full bg-white border border-gray-200 hover:shadow-lg transition-all duration-200">
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

      {/* Drag Overlay */}
      <DragOverlay>
        {activeVariable ? (
          <DraggableVariableChip
            id={activeVariable.name}
            name={activeVariable.name}
            type={activeVariable.type}
            description={activeVariable.description}
            value={activeVariable.value}
            showActions={false}
            className="rotate-3 shadow-lg"
          />
        ) : null}
      </DragOverlay>

      {/* Modals */}
      <AddVariableModal open={showAddVariable} onOpenChange={setShowAddVariable} onSelectVariable={handleAddVariable} />
      <CreateInputVariableModal
        open={showCreateVariable}
        onOpenChange={setShowCreateVariable}
        onCreateVariable={(variable) => {
          console.log("Created variable:", variable)
          handleAddVariable(variable.name)
          setShowCreateVariable(false)
        }}
      />
    </DndContext>
  )
}
