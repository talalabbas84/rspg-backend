"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Code, List, Grid, Copy, CheckCircle } from "lucide-react"
import type { Variable, GlobalList } from "@/types"

interface VariableIndexingHelperProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  variables: Variable[]
  globalLists: GlobalList[]
  onInsertVariable: (variableString: string) => void
}

export function VariableIndexingHelper({
  open,
  onOpenChange,
  variables,
  globalLists,
  onInsertVariable,
}: VariableIndexingHelperProps) {
  const [selectedVariable, setSelectedVariable] = useState<string>("")
  const [indexType, setIndexType] = useState<"simple" | "array" | "matrix">("simple")
  const [arrayIndex, setArrayIndex] = useState("")
  const [matrixRow, setMatrixRow] = useState("")
  const [matrixCol, setMatrixCol] = useState("")
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null)

  const generateVariableString = () => {
    if (!selectedVariable) return ""

    switch (indexType) {
      case "simple":
        return `<<${selectedVariable}>>`
      case "array":
        return `<<${selectedVariable}[${arrayIndex || "0"}]>>`
      case "matrix":
        return `<<${selectedVariable}[${matrixRow || "0"}][${matrixCol || "0"}]>>`
      default:
        return `<<${selectedVariable}>>`
    }
  }

  const handleCopyVariable = (variableString: string) => {
    navigator.clipboard.writeText(variableString)
    setCopiedVariable(variableString)
    setTimeout(() => setCopiedVariable(null), 2000)
  }

  const handleInsertVariable = (variableString: string) => {
    onInsertVariable(variableString)
    onOpenChange(false)
  }

  const getVariableExamples = () => {
    const examples = [
      {
        type: "Simple Variable",
        syntax: "<<variable_name>>",
        description: "Access the entire variable value",
        example: "<<global_context>>",
      },
      {
        type: "Array Element",
        syntax: "<<list_name[index]>>",
        description: "Access a specific element in a list",
        example: "<<claim_list[0]>> or <<claim_list[2]>>",
      },
      {
        type: "Matrix Element",
        syntax: "<<matrix[row][col]>>",
        description: "Access a specific cell in a 2D matrix",
        example: "<<relevance_matrix[claim1][paragraph2]>>",
      },
      {
        type: "Dynamic Index",
        syntax: "<<list[variable]>>",
        description: "Use another variable as the index",
        example: "<<items[current_index]>>",
      },
    ]

    return examples
  }

  const availableVariables = [
    ...variables,
    ...globalLists.map((list) => ({
      id: list.id,
      name: list.name,
      value: list.name,
      type: "list" as const,
      description: list.description,
      is_array: true,
      array_length: list.values.length,
      is_matrix: list.is_matrix,
    })),
  ]

  const selectedVarData = availableVariables.find((v) => v.name === selectedVariable)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Variable Indexing Helper
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Variable Selection */}
          <Card className="p-4">
            <div className="space-y-4">
              <Label className="text-base font-medium">Select Variable</Label>

              <Select value={selectedVariable} onValueChange={setSelectedVariable}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a variable or list..." />
                </SelectTrigger>
                <SelectContent>
                  {availableVariables.map((variable) => (
                    <SelectItem key={variable.id} value={variable.name}>
                      <div className="flex items-center gap-2">
                        <span>{variable.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {variable.type}
                        </Badge>
                        {variable.is_array && (
                          <Badge variant="outline" className="text-xs">
                            {variable.array_length} items
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedVarData && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{selectedVarData.type}</Badge>
                    {selectedVarData.is_array && (
                      <Badge variant="outline">
                        <List className="h-3 w-3 mr-1" />
                        Array ({selectedVarData.array_length} items)
                      </Badge>
                    )}
                    {selectedVarData.is_matrix && (
                      <Badge variant="outline">
                        <Grid className="h-3 w-3 mr-1" />
                        Matrix
                      </Badge>
                    )}
                  </div>
                  {selectedVarData.description && (
                    <p className="text-sm text-gray-600">{selectedVarData.description}</p>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Indexing Configuration */}
          {selectedVariable && (
            <Card className="p-4">
              <div className="space-y-4">
                <Label className="text-base font-medium">Indexing Type</Label>

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={indexType === "simple" ? "default" : "outline"}
                    onClick={() => setIndexType("simple")}
                    className="flex flex-col items-center gap-1 h-auto py-3"
                  >
                    <Code className="h-4 w-4" />
                    <span className="text-xs">Simple</span>
                  </Button>
                  <Button
                    variant={indexType === "array" ? "default" : "outline"}
                    onClick={() => setIndexType("array")}
                    className="flex flex-col items-center gap-1 h-auto py-3"
                    disabled={!selectedVarData?.is_array}
                  >
                    <List className="h-4 w-4" />
                    <span className="text-xs">Array</span>
                  </Button>
                  <Button
                    variant={indexType === "matrix" ? "default" : "outline"}
                    onClick={() => setIndexType("matrix")}
                    className="flex flex-col items-center gap-1 h-auto py-3"
                    disabled={!selectedVarData?.is_matrix}
                  >
                    <Grid className="h-4 w-4" />
                    <span className="text-xs">Matrix</span>
                  </Button>
                </div>

                {indexType === "array" && (
                  <div className="space-y-2">
                    <Label>Array Index</Label>
                    <Input
                      value={arrayIndex}
                      onChange={(e) => setArrayIndex(e.target.value)}
                      placeholder="0, 1, 2... or variable name"
                    />
                    <p className="text-xs text-gray-600">
                      Use numbers (0-{(selectedVarData?.array_length || 1) - 1}) or variable names
                    </p>
                  </div>
                )}

                {indexType === "matrix" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Row Index</Label>
                      <Input
                        value={matrixRow}
                        onChange={(e) => setMatrixRow(e.target.value)}
                        placeholder="row index or name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Column Index</Label>
                      <Input
                        value={matrixCol}
                        onChange={(e) => setMatrixCol(e.target.value)}
                        placeholder="column index or name"
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Generated Variable */}
          {selectedVariable && (
            <Card className="p-4">
              <div className="space-y-4">
                <Label className="text-base font-medium">Generated Variable</Label>

                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono">
                  <code className="text-lg">{generateVariableString()}</code>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleCopyVariable(generateVariableString())}
                    className="flex items-center gap-2"
                  >
                    {copiedVariable === generateVariableString() ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    Copy
                  </Button>
                  <Button
                    onClick={() => handleInsertVariable(generateVariableString())}
                    className="flex items-center gap-2"
                  >
                    Insert into Prompt
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Examples and Documentation */}
          <Card className="p-4">
            <div className="space-y-4">
              <Label className="text-base font-medium">Variable Syntax Examples</Label>

              <div className="grid gap-3">
                {getVariableExamples().map((example, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{example.type}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyVariable(example.example)}
                        className="text-xs"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded block mb-2">{example.syntax}</code>
                    <p className="text-sm text-gray-600 mb-1">{example.description}</p>
                    <code className="text-xs text-blue-600">{example.example}</code>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
