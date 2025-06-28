"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X, Trash2, Loader2 } from "lucide-react"
import { useGlobalLists } from "@/hooks/use-global-lists"
import { useToast } from "@/components/ui/use-toast"

interface CreateListModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateListModal({ open, onOpenChange }: CreateListModalProps) {
  const { createGlobalList } = useGlobalLists()
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [values, setValues] = useState<string[]>([""]) // Start with one empty field
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast({ variant: "destructive", title: "Error", description: "List name is required." })
      return
    }
    setIsSubmitting(true)
    try {
      const filteredValues = values.filter((value) => value.trim() !== "")
      await createGlobalList({ name, description, values: filteredValues }) // Hook handles success toast
      onOpenChange(false) // Close modal on success
      // Reset form
      setName("")
      setDescription("")
      setValues([""])
    } catch (error) {
      // Error toast is handled by the hook
      console.error("Failed to create list from modal:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addValueField = () => {
    setValues([...values, ""])
  }

  const updateValue = (index: number, value: string) => {
    const newValues = [...values]
    newValues[index] = value
    setValues(newValues)
  }

  const removeValueField = (index: number) => {
    // Always keep at least one field, or allow removing if it's the only one and empty
    if (values.length > 1) {
      setValues(values.filter((_, i) => i !== index))
    } else if (values.length === 1) {
      // If it's the last one, just clear it
      setValues([""])
    }
  }

  const handleClose = () => {
    if (isSubmitting) return // Prevent closing while submitting
    setName("")
    setDescription("")
    setValues([""])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Create New Global List</DialogTitle>
            <Button variant="ghost" size="icon" onClick={handleClose} className="h-7 w-7 p-0" disabled={isSubmitting}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-grow py-2 pr-2 pl-1">
          <div className="space-y-1.5">
            <Label htmlFor="list-name">
              List Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="list-name"
              placeholder="e.g., Product Features, Competitor Names"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="list-description">Description (Optional)</Label>
            <Textarea
              id="list-description"
              placeholder="Briefly describe this list"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label>List Values</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {values.map((value, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 w-5 pt-2">{index + 1}.</span>
                  <Textarea
                    placeholder="Enter list item"
                    value={value}
                    onChange={(e) => updateValue(index, e.target.value)}
                    className="flex-1 min-h-[40px]"
                    rows={1}
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeValueField(index)}
                    className="text-red-500 hover:text-red-700 p-2 h-9 w-9 mt-1"
                    disabled={isSubmitting || (values.length === 1 && values[0].trim() === "")}
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addValueField}
              className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Add Item
            </Button>
          </div>
        </form>
        <DialogFooter className="mt-auto pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-list-form"
            className="bg-gray-700 text-white hover:bg-gray-800"
            disabled={isSubmitting || !name.trim()}
            onClick={handleSubmit}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Creating..." : "Create List"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
