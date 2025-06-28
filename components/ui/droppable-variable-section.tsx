"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, Plus, Search, Filter, Eye, EyeOff, RotateCcw, Shuffle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { DraggableVariableChip } from "./draggable-variable-chip"
import { cn } from "@/lib/utils"
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable"

interface Variable {
  name: string
  type: "global" | "list" | "output"
  description?: string
  value?: string
}

interface DroppableVariableSectionProps {
  variables: Variable[]
  title: string
  onAddVariable?: () => void
  onRemoveVariable?: (variableName: string) => void
  onViewVariable?: (variable: Variable) => void
  onReorderVariables?: (newOrder: Variable[]) => void
  onUpdatePrompt?: (newPrompt: string) => void
  className?: string
  collapsible?: boolean
  defaultOpen?: boolean
  showSearch?: boolean
  showFilter?: boolean
  emptyMessage?: string
  droppableId: string
  currentPrompt?: string
}

export function DroppableVariableSection({
  variables,
  title,
  onAddVariable,
  onRemoveVariable,
  onViewVariable,
  onReorderVariables,
  onUpdatePrompt,
  className,
  collapsible = false,
  defaultOpen = true,
  showSearch = false,
  showFilter = false,
  emptyMessage = "No variables added yet",
  droppableId,
  currentPrompt = "",
}: DroppableVariableSectionProps) {
  console.log("=== DroppableVariableSection DEBUG ===")
  console.log("Received variables:", variables)
  console.log("Variables length:", variables?.length)
  console.log("Variables type:", typeof variables)
  console.log("Is array:", Array.isArray(variables))

  if (variables && variables.length > 0) {
    variables.forEach((v, i) => {
      console.log(`Variable ${i}:`, v)
      console.log(`  - name: "${v?.name}" (type: ${typeof v?.name})`)
      console.log(`  - type: "${v?.type}" (type: ${typeof v?.type})`)
    })
  }
  const [isOpen, setIsOpen] = useState(defaultOpen || variables.length > 0)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "global" | "list" | "output">("all")
  const [showDetails, setShowDetails] = useState(false)
  // const [draggedOver, setDraggedOver] = useState(false)

  // const { isOver, setNodeRef } = useDroppable({
  //   id: droppableId,
  // })

  if (!variables || !Array.isArray(variables)) {
    console.warn("DroppableVariableSection: Invalid variables prop", variables)
    return (
      <div className={className}>
        <div className="text-center py-8 text-gray-500">
          <p>No variables available</p>
        </div>
      </div>
    )
  }

  // Simplified validation - just check for basic structure
  const validVariables = variables.filter((variable) => {
    const isValid = variable && variable.name && typeof variable.name === "string" && variable.name.length > 0

    if (!isValid) {
      console.log("Invalid variable filtered out:", variable)
    }

    return isValid
  })

  console.log("Valid variables after filtering:", validVariables)

  if (validVariables.length === 0 && variables.length > 0) {
    console.warn("DroppableVariableSection: All variables filtered out as invalid", variables)
  }

  const filteredVariables = validVariables.filter((variable) => {
    const matchesSearch =
      (variable.name && variable.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (variable.description && variable.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesFilter = filterType === "all" || variable.type === filterType
    return matchesSearch && matchesFilter
  })

  const getVariableCount = (type?: string) => {
    if (!validVariables || !Array.isArray(validVariables)) return 0
    if (!type || type === "all") return validVariables.length
    return validVariables.filter((v) => v && v.type === type).length
  }

  const handleResetOrder = () => {
    if (onReorderVariables) {
      const sortedVariables = [...variables].sort((a, b) => a.name.localeCompare(b.name))
      onReorderVariables(sortedVariables)
      updatePromptOrder(sortedVariables)
    }
  }

  const handleShuffleOrder = () => {
    if (onReorderVariables) {
      const shuffledVariables = [...variables].sort(() => Math.random() - 0.5)
      onReorderVariables(shuffledVariables)
      updatePromptOrder(shuffledVariables)
    }
  }

  const updatePromptOrder = (newVariableOrder: Variable[]) => {
    if (!onUpdatePrompt || !currentPrompt) return

    const variableMatches = [...currentPrompt.matchAll(/<<([^>]+)>>/g)]
    if (variableMatches.length === 0) return

    const orderMap = new Map(newVariableOrder.map((variable, index) => [variable.name, index]))
    const sortedMatches = variableMatches.sort((a, b) => {
      const orderA = orderMap.get(a[1]) ?? 999
      const orderB = orderMap.get(b[1]) ?? 999
      return orderA - orderB
    })

    let newPrompt = currentPrompt
    const usedVariables = new Set<string>()

    variableMatches.forEach((match) => {
      newPrompt = newPrompt.replace(match[0], "")
    })

    newPrompt = newPrompt.replace(/\s+/g, " ").trim()

    sortedMatches.forEach((match) => {
      if (!usedVariables.has(match[1])) {
        newPrompt += ` <<${match[1]}>>`
        usedVariables.add(match[1])
      }
    })

    onUpdatePrompt(newPrompt.trim())
  }

  const SectionContent = () => (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      {(showSearch || showFilter) && (
        <div className="flex items-center gap-2">
          {showSearch && (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search variables..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          )}

          {showFilter && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <div className="flex gap-1">
                {["all", "global", "list", "output"].map((type) => (
                  <Button
                    key={type}
                    variant={filterType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterType(type as any)}
                    className="capitalize"
                  >
                    {type} {type !== "all" && `(${getVariableCount(type)})`}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1"
            >
              {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showDetails ? "Hide" : "Show"} Details
            </Button>

            {variables.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetOrder}
                  className="flex items-center gap-1"
                  title="Reset to alphabetical order"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShuffleOrder}
                  className="flex items-center gap-1"
                  title="Shuffle order randomly"
                >
                  <Shuffle className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Variables Display */}
      {filteredVariables.length > 0 ? (
        <div className="space-y-3">
          {showDetails ? (
            // Detailed Card View
            <SortableContext items={filteredVariables.map((v) => v.name)} strategy={rectSortingStrategy}>
              <div className="grid gap-3">
                {filteredVariables.map((variable, index) => (
                  <Card key={variable.name} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <DraggableVariableChip
                            id={variable.name}
                            name={variable.name}
                            type={variable.type}
                            description={variable.description}
                            value={variable.value}
                            showActions={false}
                            size="sm"
                            position={index}
                          />
                        </div>
                        {variable.description && <p className="text-sm text-gray-600">{variable.description}</p>}
                        {variable.value && (
                          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded font-mono">
                            {variable.value.length > 100 ? `${variable.value.substring(0, 100)}...` : variable.value}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-4">
                        {onViewVariable && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewVariable(variable)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {onRemoveVariable && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveVariable(variable.name)}
                            className="text-gray-600 hover:text-red-600"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </SortableContext>
          ) : (
            // Compact Chip View with Drag & Drop
            <SortableContext items={filteredVariables.map((v) => v.name)} strategy={rectSortingStrategy}>
              <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/30">
                {filteredVariables.map((variable, index) => (
                  <DraggableVariableChip
                    key={variable.name}
                    id={variable.name}
                    name={variable.name}
                    type={variable.type}
                    description={variable.description}
                    value={variable.value}
                    onRemove={onRemoveVariable ? () => onRemoveVariable(variable.name) : undefined}
                    onView={onViewVariable ? () => onViewVariable(variable) : undefined}
                    position={index}
                  />
                ))}
              </div>
            </SortableContext>
          )}

          {/* Reorder Instructions */}
          {variables.length > 1 && (
            <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-md border border-blue-200">
              <div className="space-y-1">
                <div>
                  <strong>🎯 Drag & Drop Tips:</strong>
                </div>
                <div>• Drag variable chips by their grip handle to reorder them</div>
                <div>• The prompt will automatically update to match the new order</div>
                <div>• Use the reset button to sort alphabetically</div>
                <div>• Use the shuffle button to randomize the order</div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
          <div className="space-y-2">
            <p>{emptyMessage}</p>
            {onAddVariable && (
              <Button variant="outline" size="sm" onClick={onAddVariable} className="mt-2">
                <Plus className="h-4 w-4 mr-1" />
                Add Variable
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Add Variable Button */}
      {onAddVariable && filteredVariables.length > 0 && (
        <Button variant="outline" size="sm" onClick={onAddVariable} className="w-full border-dashed hover:border-solid">
          <Plus className="h-4 w-4 mr-1" />
          Add Another Variable
        </Button>
      )}
    </div>
  )

  if (collapsible) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-gray-700">{title}</h3>
              <Badge variant="secondary" className="text-xs">
                {variables.length}
              </Badge>
              {variables.length > 1 && (
                <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                  {isOpen ? "Drag to reorder" : "Click to expand"}
                </Badge>
              )}
            </div>
            <ChevronDown
              className={cn("h-4 w-4 transition-transform duration-200", isOpen && "transform rotate-180")}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <SectionContent />
        </CollapsibleContent>
        {variables.length > 0 && !isOpen && (
          <div className="text-xs text-gray-500 mt-2 p-2 bg-blue-50 rounded border border-blue-200">
            Click to expand and drag variable chips to reorder them
          </div>
        )}
      </Collapsible>
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-700">{title}</h3>
          <Badge variant="secondary" className="text-xs">
            {variables.length}
          </Badge>
          {variables.length > 1 && (
            <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
              Drag to reorder
            </Badge>
          )}
        </div>
      </div>
      <SectionContent />
    </div>
  )
}
