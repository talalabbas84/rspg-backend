"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"

interface CreateInputVariableModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateVariable: (variable: { name: string; type: string; value: string }) => void
}

export function CreateInputVariableModal({ open, onOpenChange, onCreateVariable }: CreateInputVariableModalProps) {
  const [name, setName] = useState("")
  const [type, setType] = useState("global")
  const [value, setValue] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 500))

      onCreateVariable({ name, type, value })

      // Reset form
      setName("")
      setType("global")
      setValue("")

      alert("Variable created successfully!")
    } catch (error) {
      alert("Failed to create variable")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Create New Input Variable</DialogTitle>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="variable-name">Variable Name</Label>
            <Input
              id="variable-name"
              placeholder="Enter variable name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="variable-type">Variable Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Global Variable</SelectItem>
                <SelectItem value="list">Global List</SelectItem>
                <SelectItem value="input">Input Variable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="variable-value">Variable Value</Label>
            <Textarea
              id="variable-value"
              placeholder="Enter variable value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
              className="min-h-[100px]"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gray-600 text-white hover:bg-gray-700" disabled={loading}>
              {loading ? "Creating..." : "Create Variable"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
