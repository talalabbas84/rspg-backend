"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { X, Plus, Trash2 } from "lucide-react"
import type { CreateBlockData, BlockType, MultiListConfig } from "@/types"
import { EnhancedAutocompleteTextarea } from "@/components/ui/enhanced-autocomplete-textarea"
import { useAvailableVariables } from "@/hooks/use-available-variables"

interface EnhancedCreateBlockModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  blockType: BlockType
  sequenceId: string
  onCreate: (data: CreateBlockData) => void
}

export function EnhancedCreateBlockModal({
  open,
  onOpenChange,
  blockType,
  sequenceId,
  onCreate,
}: EnhancedCreateBlockModalProps) {
  const [formData, setFormData] = useState<Partial<CreateBlockData>>({
    name: "",
    block_type: blockType,
    model: "claude-3-5-sonnet-latest",
    prompt: "",
    output_name: "",
    config: {},
  })

  const [outputVariableNames, setOutputVariableNames] = useState<string[]>([""])
  const [multiListConfigs, setMultiListConfigs] = useState<MultiListConfig[]>([{ id: "1", list_name: "", priority: 1 }])

  const { variables } = useAvailableVariables(sequenceId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const config = { ...formData.config }

    // Configure based on block type
    switch (blockType) {
      case "discretization":
        config.output_variable_names = outputVariableNames.filter((name) => name.trim())
        config.number_of_outputs = outputVariableNames.filter((name) => name.trim()).length
        break
      case "single_list":
        // Config already set via form
        break
      case "multi_list":
        config.lists = multiListConfigs.filter((list) => list.list_name.trim())
        break
    }

    const blockData: CreateBlockData = {
      name: formData.name!,
      block_type: blockType,
      model: formData.model!,
      prompt: formData.prompt!,
      output_name: formData.output_name!,
      config,
    }

    onCreate(blockData)
    onOpenChange(false)

    // Reset form
    setFormData({
      name: "",
      block_type: blockType,
      model: "claude-3-5-sonnet-latest",
      prompt: "",
      output_name: "",
      config: {},
    })
    setOutputVariableNames([""])
    setMultiListConfigs([{ id: "1", list_name: "", priority: 1 }])
  }

  const addOutputVariable = () => {
    setOutputVariableNames([...outputVariableNames, ""])
  }

  const updateOutputVariable = (index: number, value: string) => {
    const updated = [...outputVariableNames]
    updated[index] = value
    setOutputVariableNames(updated)
  }

  const removeOutputVariable = (index: number) => {
    setOutputVariableNames(outputVariableNames.filter((_, i) => i !== index))
  }

  const addMultiListConfig = () => {
    const newConfig: MultiListConfig = {
      id: Date.now().toString(),
      list_name: "",
      priority: Math.max(...multiListConfigs.map((c) => c.priority)) + 1,
    }
    setMultiListConfigs([...multiListConfigs, newConfig])
  }

  const updateMultiListConfig = (id: string, field: keyof MultiListConfig, value: string | number) => {
    setMultiListConfigs((configs) =>
      configs.map((config) => (config.id === id ? { ...config, [field]: value } : config)),
    )
  }

  const removeMultiListConfig = (id: string) => {
    setMultiListConfigs((configs) => configs.filter((config) => config.id !== id))
  }

  const getBlockTypeDescription = () => {
    switch (blockType) {
      case "standard":
        return "A standard AI block that processes a single prompt and returns a response."
      case "discretization":
        return "Splits complex outputs into multiple named variables that can be used in subsequent blocks."
      case "single_list":
        return "Applies the same prompt to each item in a list, producing a list of results."
      case "multi_list":
        return "Compares multiple lists against each other, producing a matrix of results."
      default:
        return ""
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Create {blockType.replace("_", " ")} Block</DialogTitle>
              <p className="text-sm text-gray-600 mt-1">{getBlockTypeDescription()}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="p-4">
            <h3 className="font-medium mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Block Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter block name"
                  required
                />
              </div>
              <div>
                <Label>Model</Label>
                <Select
                  value={formData.model}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, model: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claude-3-5-sonnet-latest">Claude 3.5 Sonnet</SelectItem>
                    <SelectItem value="claude-3-5-haiku-latest">Claude 3.5 Haiku</SelectItem>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Block-Specific Configuration */}
          {blockType === "discretization" && (
            <Card className="p-4">
              <h3 className="font-medium mb-4">Discretization Configuration</h3>
              <div className="space-y-4">
                <div>
                  <Label>Output Variable Names</Label>
                  <p className="text-sm text-gray-600 mb-2">
                    Define the names of variables that will be created from this block's output.
                  </p>
                  <div className="space-y-2">
                    {outputVariableNames.map((name, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={name}
                          onChange={(e) => updateOutputVariable(index, e.target.value)}
                          placeholder={`output_variable_${index + 1}`}
                        />
                        {outputVariableNames.length > 1 && (
                          <Button type="button" variant="outline" size="sm" onClick={() => removeOutputVariable(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addOutputVariable}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Output Variable
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {blockType === "single_list" && (
            <Card className="p-4">
              <h3 className="font-medium mb-4">Single List Configuration</h3>
              <div>
                <Label>Input List Name</Label>
                <Input
                  value={formData.config?.input_list_name || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      config: { ...prev.config, input_list_name: e.target.value },
                    }))
                  }
                  placeholder="e.g., claim_types"
                />
                <p className="text-sm text-gray-600 mt-1">The prompt will be applied to each item in this list.</p>
              </div>
            </Card>
          )}

          {blockType === "multi_list" && (
            <Card className="p-4">
              <h3 className="font-medium mb-4">Multi List Configuration</h3>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Configure multiple lists with priorities. Priority 1 is the primary list that will be iterated over.
                </p>
                {multiListConfigs.map((config) => (
                  <div key={config.id} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label>List Name</Label>
                      <Input
                        value={config.list_name}
                        onChange={(e) => updateMultiListConfig(config.id, "list_name", e.target.value)}
                        placeholder="e.g., claims"
                      />
                    </div>
                    <div className="w-24">
                      <Label>Priority</Label>
                      <Input
                        type="number"
                        value={config.priority}
                        onChange={(e) => updateMultiListConfig(config.id, "priority", Number.parseInt(e.target.value))}
                        min="1"
                      />
                    </div>
                    {multiListConfigs.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeMultiListConfig(config.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addMultiListConfig}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add List
                </Button>
              </div>
            </Card>
          )}

          {/* Prompt Configuration */}
          <Card className="p-4">
            <h3 className="font-medium mb-4">Prompt Configuration</h3>
            <div className="space-y-4">
              <div>
                <Label>Prompt</Label>
                <EnhancedAutocompleteTextarea
                  value={formData.prompt || ""}
                  onChange={(value) => setFormData((prev) => ({ ...prev, prompt: value }))}
                  placeholder="Enter your prompt here..."
                  options={variables}
                  rows={6}
                />
              </div>
              <div>
                <Label>Output Name</Label>
                <Input
                  value={formData.output_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, output_name: e.target.value }))}
                  placeholder="e.g., processed_claims"
                  required
                />
              </div>
            </div>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Block</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
