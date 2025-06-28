"use client"

import { useState, useEffect } from "react"
import type { Block } from "@/types"
import { DragDropBlockResponsePair } from "./drag-drop-block-response-pair"

interface DragDropBlockResponsePairsProps {
  sequenceId: string
  onEditBlock?: (block: Block) => void
}

export function DragDropBlockResponsePairs({ sequenceId, onEditBlock }: DragDropBlockResponsePairsProps) {
  const [blocks, setBlocks] = useState<Block[]>([])

  useEffect(() => {
    // Mock data - replace with actual API call
    setBlocks([
      {
        id: "1",
        sequence_id: sequenceId,
        name: "Block 1",
        block_type: "standard",
        order: 1,
        model: "claude-3-5-haiku-latest",
        prompt:
          "Make 5 claims for a biometric water bottle. 1 independent and 4 dependent. Use the global context: <<global>> and reference the user input: <<user_input>>",
        output_name: "OP1",
        config: {},
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      },
      {
        id: "2",
        sequence_id: sequenceId,
        name: "Block 2",
        block_type: "discretization",
        order: 2,
        model: "claude-3-5-sonnet-latest",
        prompt: 'Please format claims {\n<<OP1>>\n} into a JSONelement {\nClaim_1: "...",\nClaim_2: "..."}',
        output_name: "OP2",
        config: {
          number_of_outputs: 5,
        },
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      },
    ])
  }, [sequenceId])

  const handleDeleteBlock = (blockId: string) => {
    setBlocks(blocks.filter((block) => block.id !== blockId))
  }

  const handleUpdateBlock = (updatedBlock: Block) => {
    setBlocks(blocks.map((block) => (block.id === updatedBlock.id ? updatedBlock : block)))
  }

  return (
    <div className="space-y-8">
      {blocks.map((block) => (
        <DragDropBlockResponsePair
          key={block.id}
          block={block}
          onEdit={onEditBlock}
          onDelete={handleDeleteBlock}
          onUpdateBlock={handleUpdateBlock}
        />
      ))}
    </div>
  )
}
