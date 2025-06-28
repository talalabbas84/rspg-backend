"use client"

import { useState, useEffect } from "react"
import type { Block } from "@/types"
import { StandardBlock } from "./standard-block"
import { DiscretizationBlock } from "./discretization-block"
import { SingleListBlock } from "./single-list-block"
import { MultiListBlock } from "./multi-list-block"

interface BlocksListProps {
  sequenceId: string
  onEditBlock?: (block: Block) => void
}

export function BlocksList({ sequenceId, onEditBlock }: BlocksListProps) {
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
        prompt: "Make 5 claims for a biometric water bottle. 1 independent and 4 dependent.",
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

  const renderBlock = (block: Block) => {
    const commonProps = {
      block,
      onEdit: onEditBlock,
      onDelete: handleDeleteBlock,
    }

    switch (block.block_type) {
      case "standard":
        return <StandardBlock key={block.id} {...commonProps} />
      case "discretization":
        return <DiscretizationBlock key={block.id} {...commonProps} />
      case "single_list":
        return <SingleListBlock key={block.id} {...commonProps} />
      case "multi_list":
        return <MultiListBlock key={block.id} {...commonProps} />
      default:
        return null
    }
  }

  return <div className="space-y-6">{blocks.map(renderBlock)}</div>
}
