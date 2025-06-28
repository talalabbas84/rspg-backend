"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { X, Info } from "lucide-react"
import type { CreateBlockData, BlockType } from "@/types"
import { AddVariableModal } from "@/components/modals/add-variable-modal"
import { CreateInputVariableModal } from "@/components/modals/create-input-variable-modal"
import { EnhancedAutocompleteTextarea } from "@/components/ui/enhanced-autocomplete-textarea"
import { useAvailableVariables } from "@/hooks/use-available-variables"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CreateBlockModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  blockType: string
  sequenceId: string
}

export function CreateBlockModal({ open, onOpenChange, blockType, sequenceId }: CreateBlockModalProps) {
  const [formData, setFormData] = useState<Partial<CreateBlockData>>({
    name: "",
    block_type: blockType as BlockType,
    model: "",
    prompt: "",
    output_name: "",
    config: {},
  })
  const [loading, setLoading] = useState(false)
  const [showAddVariable, setShowAddVariable] = useState(false)
  const [showCreateVariable, setShowCreateVariable] = useState(false)
  const [selectedVariable, setSelectedVariable] = useState<string | null>(null)

  const { variables } = useAvailableVariables(sequenceId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log("Creating block:", formData)

      onOpenChange(false)
      // Reset form
      setFormData({
        name: "",
        block_type: blockType as BlockType,
        model: "",
        prompt: "",
        output_name: "",
        config: {},
      })
      alert("Block created successfully!")
    } catch (error) {
      alert("Failed to create block")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleConfigChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        [field]: value,
      },
    }))
  }

  const handleAddVariable = (variable: string) => {
    const currentPrompt = formData.prompt || ""
    const newPrompt = currentPrompt + (currentPrompt ? " " : "") + `<<${variable}>>`
    handleInputChange("prompt", newPrompt)
    setShowAddVariable(false)
  }

  const handleCreateVariable = (variable: { name: string; type: string; value: string }) => {
    console.log("Created variable:", variable)
    const currentPrompt = formData.prompt || ""
    const newPrompt = currentPrompt + (currentPrompt ? " " : "") + `<<${variable.name}>>`
    handleInputChange("prompt", newPrompt)
    setShowCreateVariable(false)
  }

  const handleVariableClick = (variable: string) => {
    setSelectedVariable(variable)
    // Show variable info or allow editing
    console.log("Variable clicked:", variable)
  }

  // Get invalid variables in the prompt
  const getInvalidVariables = () => {
    const prompt = formData.prompt || ""
    const variableMatches = [...prompt.matchAll(/<<([^>]+)>>/g)]
    const availableVariableNames = variables.map((v) => v.value)

    return variableMatches
      .map((match) => match[1])
      .filter((varName) => !availableVariableNames.includes(varName))
      .filter((varName, index, arr) => arr.indexOf(varName) === index) // Remove duplicates
  }

  const invalidVariables = getInvalidVariables()

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Create New AI Block</DialogTitle>
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="h-6 w-6 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Block Name */}
            <div className="space-y-2">
              <Label htmlFor="block-name">Block Name</Label>
              <Input
                id="block-name"
                placeholder="Enter block name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>

            {/* Choose Block Model */}
            <div className="space-y-2">
              <Label htmlFor="block-model">Choose Block Model</Label>
              <Select value={formData.model} onValueChange={(value) => handleInputChange("model", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Block Model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude-3-5-haiku-latest">claude-3-5-haiku-latest</SelectItem>
                  <SelectItem value="claude-3-5-sonnet-latest">claude-3-5-sonnet-latest</SelectItem>
                  <SelectItem value="gpt-4">gpt-4</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">gpt-3.5-turbo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Prompt with Syntax Highlighting and Autocomplete */}
            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt</Label>
              <EnhancedAutocompleteTextarea
                value={formData.prompt || ""}
                onChange={(value) => handleInputChange("prompt", value)}
                placeholder="Enter prompt (type << to see variable suggestions)"
                className="min-h-[120px]"
                options={variables}
                triggerPattern={/<<([^>]*)$/}
                minChars={0}
                maxSuggestions={8}
                onVariableClick={handleVariableClick}
                rows={6}
              />

              {/* Invalid Variables Warning */}
              {invalidVariables.length > 0 && (
                <Alert variant="destructive">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <div className="font-medium">Unknown variables detected:</div>
                      <div className="flex flex-wrap gap-1">
                        {invalidVariables.map((varName) => (
                          <code key={varName} className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                            {"<<"}
                            {varName}
                            {">>"}
                          </code>
                        ))}
                      </div>
                      <div className="text-sm">These variables are not available in the current sequence.</div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Variable Info */}
              {selectedVariable && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <div className="font-medium">Variable: {selectedVariable}</div>
                      {(() => {
                        const variable = variables.find((v) => v.value === selectedVariable)
                        return variable ? (
                          <div className="text-sm">
                            <div>Type: {variable.type}</div>
                            {variable.description && <div>Description: {variable.description}</div>}
                          </div>
                        ) : (
                          <div className="text-sm text-red-600">
                            This variable is not available in the current sequence.
                          </div>
                        )
                      })()}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddVariable(true)}
                  className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                >
                  + Add Variable To Prompt
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateVariable(true)}
                  className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                >
                  + Add New Input Variable
                </Button>
              </div>

              <div className="text-xs text-gray-500 space-y-2">
                <div className="space-y-1">
                  <div>
                    <strong>Syntax Highlighting:</strong> Variables are highlighted in{" "}
                    <span className="bg-blue-100 text-blue-800 px-1 rounded">blue</span> when valid,{" "}
                    <span className="bg-red-100 text-red-800 px-1 rounded">red</span> when invalid
                  </div>
                  <div>
                    <strong>Bracket Matching:</strong> Position cursor near{" "}
                    <span className="bg-green-100 text-green-800 px-1 rounded font-mono">{"<<"}</span> or{" "}
                    <span className="bg-green-100 text-green-800 px-1 rounded font-mono">{">>"}</span> to highlight
                    matching brackets
                  </div>
                  <div>
                    <strong>Autocomplete:</strong> Type <code className="bg-gray-100 px-1 rounded">{"<<"}</code> to see
                    variable suggestions
                  </div>
                  <div>
                    <strong>Navigation:</strong> Use ↑↓ arrow keys to navigate, Enter/Tab to select, Esc to close
                  </div>
                  <div>
                    <strong>Click Variables:</strong> Click on highlighted variables to see their details
                  </div>
                </div>
              </div>
            </div>

            {/* Output Name */}
            <div className="space-y-2">
              <Label htmlFor="output-name">Output Name</Label>
              <Input
                id="output-name"
                placeholder="Enter output name"
                value={formData.output_name}
                onChange={(e) => handleInputChange("output_name", e.target.value)}
                required
              />
            </div>

            {/* Block Type Specific Fields */}
            {blockType === "discretization" && (
              <div className="space-y-2">
                <Label htmlFor="num-outputs">Number of Outputs</Label>
                <Input
                  id="num-outputs"
                  type="number"
                  placeholder="Enter number of outputs"
                  value={formData.config?.number_of_outputs || ""}
                  onChange={(e) => handleConfigChange("number_of_outputs", Number.parseInt(e.target.value))}
                />
              </div>
            )}

            {(blockType === "single_list" || blockType === "multi_list") && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="run-n-times"
                  checked={formData.config?.run_n_times || false}
                  onCheckedChange={(checked) => handleConfigChange("run_n_times", checked)}
                />
                <Label htmlFor="run-n-times">Run N Times</Label>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gray-600 text-white hover:bg-gray-700" disabled={loading}>
                {loading ? "Creating..." : "Done"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modals */}
      <AddVariableModal open={showAddVariable} onOpenChange={setShowAddVariable} onSelectVariable={handleAddVariable} />
      <CreateInputVariableModal
        open={showCreateVariable}
        onOpenChange={setShowCreateVariable}
        onCreateVariable={handleCreateVariable}
      />
    </>
  )
}
