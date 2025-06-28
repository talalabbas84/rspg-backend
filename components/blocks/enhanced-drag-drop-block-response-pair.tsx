"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Edit, Eye, EyeOff, Loader2, Sparkles, Zap, FileText, Code, Grid } from "lucide-react"
import type { Block } from "@/types"
import { AddVariableModal } from "@/components/modals/add-variable-modal"
import { CreateInputVariableModal } from "@/components/modals/create-input-variable-modal"
import { EditableResponse } from "./editable-response"
import { DroppableVariableSection } from "@/components/ui/droppable-variable-section"
import { EnhancedAutocompleteTextarea } from "@/components/ui/enhanced-autocomplete-textarea"
import { useAvailableVariables } from "@/hooks/use-available-variables"
import { TextChunker } from "@/components/text-processing/text-chunker"
import { VariableIndexingHelper } from "@/components/variables/variable-indexing-helper"
import { MatrixOutputDisplay } from "@/components/outputs/matrix-output-display"
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
  matrix_output?: { [key: string]: { [key: string]: string } }
  editedAt?: string
  validation_status?: "valid" | "invalid" | "warning"
  validation_messages?: string[]
}

export function EnhancedDragDropBlockResponsePair({ block, onEdit, onDelete, onUpdateBlock }: BlockResponsePairProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showAddVariable, setShowAddVariable] = useState(false)
  const [showCreateVariable, setShowCreateVariable] = useState(false)
  const [showTextChunker, setShowTextChunker] = useState(false)
  const [showVariableHelper, setShowVariableHelper] = useState(false)
  const [selectedVariable, setSelectedVariable] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [currentPrompt, setCurrentPrompt] = useState(
    block.prompt ||
      "Extract all patent claims from the following text: <<global_context>> and categorize them by type <<claim_types>>",
  )
  const [response, setResponse] = useState<BlockResponse | null>(() => {
    // Enhanced mock response data
    if (block.block_type === "standard") {
      return {
        id: `response-${block.id}`,
        blockId: block.id,
        content: `Independent claim: 1. A biometric water bottle that tracks hydration levels in real-time.
Dependent claims: 2. The water bottle of claim 1, wherein the hydration tracking is achieved through integrated sensors. 3. The water bottle of claim 2, further comprising a display that shows current hydration status. 4. The water bottle of claim 3, wherein the display provides personalized hydration recommendations. 5. The water bottle of claim 4, including a mobile app connectivity feature for comprehensive hydration monitoring.`,
        validation_status: "valid",
      }
    }

    if (block.block_type === "discretization") {
      return {
        id: `response-${block.id}`,
        blockId: block.id,
        content: "",
        outputs: {
          independent_claims: "A biometric water bottle that tracks hydration levels in real-time",
          dependent_claims:
            "The water bottle of claim 1, wherein the hydration tracking is achieved through integrated sensors",
          method_claims: "A method for tracking hydration using biometric sensors",
          system_claims: "A system comprising a water bottle and mobile application",
        },
        validation_status: "valid",
      }
    }

    if (block.block_type === "multi_list") {
      return {
        id: `response-${block.id}`,
        blockId: block.id,
        content: "",
        matrix_output: {
          claim1: { paragraph1: "Highly Relevant", paragraph2: "Partially Relevant", paragraph3: "Not Relevant" },
          claim2: { paragraph1: "Not Relevant", paragraph2: "Highly Relevant", paragraph3: "Partially Relevant" },
          claim3: { paragraph1: "Partially Relevant", paragraph2: "Not Relevant", paragraph3: "Highly Relevant" },
        },
        validation_status: "valid",
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
    if (!currentPrompt || typeof currentPrompt !== "string") {
      return []
    }

    // Enhanced regex to find all <<variable>> patterns including indexed ones
    const regex = /<<([^>]+)>>/g
    const matches = []
    let match

    while ((match = regex.exec(currentPrompt)) !== null) {
      matches.push(match[1])
    }

    // Create variable objects with enhanced metadata
    const usedVars = matches.map((varName, index) => {
      // Check if it's an indexed variable
      const isIndexed = varName.includes("[")
      const baseName = isIndexed ? varName.split("[")[0] : varName

      const variable = {
        id: varName,
        name: varName,
        value: varName,
        type: "global" as const,
        description: `Variable: ${varName}`,
        is_indexed: isIndexed,
        base_name: baseName,
      }
      return variable
    })

    return usedVars
  }

  const [usedVariables, setUsedVariables] = useState<any[]>([])

  // Update used variables when prompt or available variables change
  useEffect(() => {
    const newUsedVariables = getUsedVariables()
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
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Enhanced response simulation
      if (block.block_type === "standard") {
        setResponse({
          id: `response-${block.id}-${Date.now()}`,
          blockId: block.id,
          content: `Enhanced response with better formatting and validation.

Independent Claims:
1. A biometric water bottle that tracks hydration levels in real-time using integrated sensors
2. A smart hydration monitoring system with mobile connectivity

Dependent Claims:
3. The water bottle of claim 1, wherein the sensors measure fluid intake automatically
4. The system of claim 2, further comprising personalized hydration recommendations`,
          validation_status: "valid",
        })
      }
    } finally {
      setIsRunning(false)
    }
  }

  const handleAddVariable = (variable: string) => {
    const newPrompt = currentPrompt + (currentPrompt ? " " : "") + `<<${variable}>>`
    setCurrentPrompt(newPrompt)

    if (onUpdateBlock) {
      onUpdateBlock({ ...block, prompt: newPrompt })
    }
  }

  const handleInsertVariableFromHelper = (variableString: string) => {
    const newPrompt = currentPrompt + (currentPrompt ? " " : "") + variableString
    setCurrentPrompt(newPrompt)

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
    setSelectedVariable(variable.name)
  }

  const handleRemoveVariable = (variableName: string) => {
    const updatedPrompt = currentPrompt
      .replace(new RegExp(`<<${variableName}>>`, "g"), "")
      .replace(/\s+/g, " ")
      .trim()
    setCurrentPrompt(updatedPrompt)

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
    let basePrompt = currentPrompt
    usedVariables.forEach((variable) => {
      basePrompt = basePrompt.replace(new RegExp(`<<${variable.name}>>`, "g"), "")
    })

    basePrompt = basePrompt.replace(/\s+/g, " ").trim()
    const newPrompt = basePrompt + " " + newOrder.map((v) => `<<${v.name}>>`).join(" ")
    setCurrentPrompt(newPrompt.trim())

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
      case "single_list":
        return <FileText className="h-4 w-4" />
      case "multi_list":
        return <Grid className="h-4 w-4" />
      default:
        return <Sparkles className="h-4 w-4" />
    }
  }

  const activeVariable = activeId ? usedVariables.find((v) => v.name === activeId) : null

  const getValidationColor = (status?: string) => {
    switch (status) {
      case "valid":
        return "border-green-200 bg-green-50"
      case "warning":
        return "border-yellow-200 bg-yellow-50"
      case "invalid":
        return "border-red-200 bg-red-50"
      default:
        return "border-gray-200 bg-white"
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Block Card - Left Side */}
        <Card
          className={`p-6 h-full hover:shadow-lg transition-all duration-200 ${getValidationColor(response?.validation_status)}`}
        >
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
                {response?.validation_status && (
                  <Badge
                    variant={response.validation_status === "valid" ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {response.validation_status}
                  </Badge>
                )}
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

            {/* Enhanced Configuration Tabs */}
            <Tabs defaultValue="prompt" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="prompt">Prompt</TabsTrigger>
                <TabsTrigger value="variables">Variables</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="prompt" className="space-y-4">
                {/* Model */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Model:</label>
                  <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md font-mono">{block.model}</div>
                </div>

                {/* Prompt */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Prompt</label>
                  <div className="relative">
                    <EnhancedAutocompleteTextarea
                      value={currentPrompt}
                      onChange={setCurrentPrompt}
                      placeholder="Prompt content..."
                      className="min-h-[120px] bg-gray-50"
                      options={variables}
                      onVariableClick={handleVariableClick}
                      disabled={false}
                      rows={6}
                    />
                  </div>

                  {/* Enhanced Variable Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddVariable(true)}
                      className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    >
                      + Add Variable
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowVariableHelper(true)}
                      className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    >
                      <Code className="h-4 w-4 mr-1" />
                      Variable Helper
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTextChunker(true)}
                      className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Text Chunker
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCreateVariable(true)}
                      className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    >
                      + New Variable
                    </Button>
                  </div>
                </div>

                {/* Preview Section */}
                {showPreview && (
                  <div className="space-y-3 border-t pt-4">
                    <label className="text-sm font-medium text-gray-700">Compiled Prompt Preview:</label>
                    <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-200">
                      {currentPrompt.replace(/<<([^>]+)>>/g, (match, variable) => {
                        const foundVar = variables?.find((v) => v.value === variable)
                        return foundVar ? `[${foundVar.value}: ${foundVar.type}]` : `[${variable}: unknown]`
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="variables" className="space-y-4">
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
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50/50"
                  droppableId="used-variables"
                  currentPrompt={currentPrompt}
                />
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                {/* Block-specific settings */}
                {block.block_type === "discretization" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Number of Outputs:</label>
                    <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
                      {block.config.number_of_outputs}
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

                {/* Advanced Settings */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Advanced Settings</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600">Temperature</label>
                      <div className="text-sm bg-gray-50 px-2 py-1 rounded">{block.config.temperature || 0.7}</div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Max Tokens</label>
                      <div className="text-sm bg-gray-50 px-2 py-1 rounded">{block.config.max_tokens || 4000}</div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

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
        <Card
          className={`p-6 h-full hover:shadow-lg transition-all duration-200 ${getValidationColor(response?.validation_status)}`}
        >
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
            <div className="space-y-4">
              {/* Response Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Block Response</h3>
                {response?.validation_status && (
                  <Badge
                    variant={response.validation_status === "valid" ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {response.validation_status}
                  </Badge>
                )}
              </div>

              {/* Response Content */}
              {response && (
                <Tabs defaultValue="content" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="content">Content</TabsTrigger>
                    {response.outputs && <TabsTrigger value="outputs">Outputs</TabsTrigger>}
                    {response.matrix_output && <TabsTrigger value="matrix">Matrix</TabsTrigger>}
                  </TabsList>

                  <TabsContent value="content">
                    <EditableResponse
                      response={response}
                      blockType={block.block_type}
                      onUpdate={handleResponseUpdate}
                    />
                  </TabsContent>

                  {response.outputs && (
                    <TabsContent value="outputs" className="space-y-3">
                      <div className="space-y-3">
                        {Object.entries(response.outputs).map(([key, value]) => (
                          <div key={key} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline">{key}</Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigator.clipboard.writeText(`<<${key}>>`)}
                                className="text-xs"
                              >
                                Copy Ref
                              </Button>
                            </div>
                            <div className="text-sm bg-gray-50 p-2 rounded font-mono">{value}</div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  )}

                  {response.matrix_output && (
                    <TabsContent value="matrix">
                      <MatrixOutputDisplay
                        matrixData={response.matrix_output}
                        title={block.output_name}
                        description="Matrix output from multi-list processing"
                        onExport={(format) => {
                          console.log(`Exporting matrix as ${format}`)
                        }}
                      />
                    </TabsContent>
                  )}
                </Tabs>
              )}
            </div>
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
          handleAddVariable(variable.name)
          setShowCreateVariable(false)
        }}
      />
      <TextChunker
        open={showTextChunker}
        onOpenChange={setShowTextChunker}
        onChunksGenerated={(chunks) => {
          console.log("Generated chunks:", chunks)
          // Handle text chunks for loop processing
        }}
      />
      <VariableIndexingHelper
        open={showVariableHelper}
        onOpenChange={setShowVariableHelper}
        variables={variables || []}
        globalLists={[]} // This would come from a global lists hook
        onInsertVariable={handleInsertVariableFromHelper}
      />
    </DndContext>
  )
}
