"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface BlockTypeSelectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectType: (type: string) => void
}

export function BlockTypeSelectionModal({ open, onOpenChange, onSelectType }: BlockTypeSelectionModalProps) {
  const blockTypes = [
    { id: "standard", label: "AI Block", description: "Standard AI block with single prompt execution" },
    {
      id: "discretization",
      label: "Discretization",
      description: "Split complex outputs into multiple named variables",
    },
    { id: "single_list", label: "Single List", description: "Apply the same prompt to each item in a list" },
    { id: "multi_list", label: "Multi List", description: "Run prompts that combine multiple lists" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Block Type</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {blockTypes.map((type) => (
            <Button
              key={type.id}
              variant="ghost"
              className="w-full justify-start h-auto p-4 text-left"
              onClick={() => onSelectType(type.id)}
            >
              <div>
                <div className="font-medium text-gray-900">{type.label}</div>
                <div className="text-sm text-gray-500 mt-1">{type.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
