"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import { useSequences } from "@/hooks/use-sequences"
import { useRouter } from "next/navigation"

interface CreateSequenceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateSequenceModal({ open, onOpenChange }: CreateSequenceModalProps) {
  const { createSequence } = useSequences()
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const newSequence = await createSequence({ name, description })
      onOpenChange(false)
      setName("")
      setDescription("")
      // Navigate to the new sequence
      router.push(`/sequence/${newSequence.id}`)
    } catch (error) {
      alert("Failed to create sequence")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Create New Sequence</DialogTitle>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sequence-name">Sequence Name</Label>
            <Input
              id="sequence-name"
              placeholder="Enter sequence name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sequence-description">Description (Optional)</Label>
            <Textarea
              id="sequence-description"
              placeholder="Enter sequence description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gray-600 text-white hover:bg-gray-700" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
