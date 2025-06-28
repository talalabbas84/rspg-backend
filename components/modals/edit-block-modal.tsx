"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import type { Block } from "@/types"
import { EnhancedAutocompleteTextarea } from "@/components/ui/enhanced-autocomplete-textarea"
import { useAvailableVariables } from "@/hooks/use-available-variables"

interface EditBlockModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  block: Block | null
  onUpdate: (block: Block) => void
}

export function EditBlockModal({ open, onOpenChange, block, onUpdate }: EditBlockModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    model: "",
    prompt: "",
    output_name: "",
  })
  const [loading, setLoading] = useState(false)

  const { variables } = useAvailableVariables(block?.sequence_id)

  useEffect(() => {
    if (block) {
      setFormData({
        name: block.name,
        model: block.model,
        prompt: block.prompt,
        output_name: block.output_name,
      })
    }
  }, [block])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!block) return

    setLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 500))

      const updatedBlock: Block = {
        ...block,
        ...formData,
        updated_at: new Date().toISOString(),
      }

      onUpdate(updatedBlock)
    } catch (error) {
      alert("Failed to update block")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleVariableClick = (variable: string) => {
    console.log("Variable clicked:", variable)
  }

  if (!block) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Edit Block</DialogTitle>
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
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
            />
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="block-model">Model</Label>
            <Select value={formData.model} onValueChange={(value) => handleInputChange("model", value)}>
              <SelectTrigger>
                <SelectValue />
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
              value={formData.prompt}
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
            <div className="text-xs text-gray-500">
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
              </div>
            </div>
          </div>

          {/* Output Name */}
          <div className="space-y-2">
            <Label htmlFor="output-name">Output Name</Label>
            <Input
              id="output-name"
              value={formData.output_name}
              onChange={(e) => handleInputChange("output_name", e.target.value)}
              required
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gray-600 text-white hover:bg-gray-700" disabled={loading}>
              {loading ? "Updating..." : "Update Block"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
