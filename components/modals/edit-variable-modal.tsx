"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import type { Variable } from "@/types"

interface EditVariableModalProps {
  variable: Variable | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (variable: Variable) => void
}

export function EditVariableModal({ variable, open, onOpenChange, onUpdate }: EditVariableModalProps) {
  const [name, setName] = useState("")
  const [value, setValue] = useState("")

  useEffect(() => {
    if (variable) {
      setName(variable.name)
      setValue(variable.value)
    }
  }, [variable])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!variable) return

    const updatedVariable: Variable = {
      ...variable,
      name,
      value,
      updated_at: new Date().toISOString(),
    }

    onUpdate(updatedVariable)
  }

  if (!variable) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Edit Global Variable</DialogTitle>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="variable-name">Variable Name</Label>
            <Input id="variable-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="variable-value">Variable Value</Label>
            <Textarea
              id="variable-value"
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
            <Button type="submit" className="bg-gray-600 text-white hover:bg-gray-700">
              Update
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
