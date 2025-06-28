"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, Plus, Search, Filter, Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { VariableChip } from "./variable-chip"
import { cn } from "@/lib/utils"

interface Variable {
  name: string
  type: "global" | "list" | "output"
  description?: string
  value?: string
}

interface VariableDisplaySectionProps {
  variables: Variable[]
  title: string
  onAddVariable?: () => void
  onRemoveVariable?: (variableName: string) => void
  onViewVariable?: (variable: Variable) => void
  className?: string
  collapsible?: boolean
  defaultOpen?: boolean
  showSearch?: boolean
  showFilter?: boolean
  emptyMessage?: string
}

export function VariableDisplaySection({
  variables,
  title,
  onAddVariable,
  onRemoveVariable,
  onViewVariable,
  className,
  collapsible = false,
  defaultOpen = true,
  showSearch = false,
  showFilter = false,
  emptyMessage = "No variables added yet",
}: VariableDisplaySectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "global" | "list" | "output">("all")
  const [showDetails, setShowDetails] = useState(false)

  const filteredVariables = variables.filter((variable) => {
    const matchesSearch =
      variable.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (variable.description && variable.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesFilter = filterType === "all" || variable.type === filterType
    return matchesSearch && matchesFilter
  })

  const getVariableCount = (type?: string) => {
    if (!type || type === "all") return variables.length
    return variables.filter((v) => v.type === type).length
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

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1"
          >
            {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showDetails ? "Hide" : "Show"} Details
          </Button>
        </div>
      )}

      {/* Variables Display */}
      {filteredVariables.length > 0 ? (
        <div className="space-y-3">
          {showDetails ? (
            // Detailed Card View
            <div className="grid gap-3">
              {filteredVariables.map((variable) => (
                <Card key={variable.name} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <VariableChip
                          name={variable.name}
                          type={variable.type}
                          description={variable.description}
                          value={variable.value}
                          showActions={false}
                          size="sm"
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
          ) : (
            // Compact Chip View
            <div className="flex flex-wrap gap-2">
              {filteredVariables.map((variable) => (
                <VariableChip
                  key={variable.name}
                  name={variable.name}
                  type={variable.type}
                  description={variable.description}
                  value={variable.value}
                  onRemove={onRemoveVariable ? () => onRemoveVariable(variable.name) : undefined}
                  onView={onViewVariable ? () => onViewVariable(variable) : undefined}
                />
              ))}
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
            </div>
            <ChevronDown
              className={cn("h-4 w-4 transition-transform duration-200", isOpen && "transform rotate-180")}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <SectionContent />
        </CollapsibleContent>
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
        </div>
      </div>
      <SectionContent />
    </div>
  )
}
