"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Play, Square, CheckCircle, AlertCircle, Clock } from "lucide-react"
import type { Block, BlockResponse } from "@/types"

interface SequenceRunnerProps {
  sequenceId: string
  blocks: Block[]
  onRunComplete?: (results: BlockResponse[]) => void
}

export function SequenceRunner({ sequenceId, blocks, onRunComplete }: SequenceRunnerProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0)
  const [results, setResults] = useState<BlockResponse[]>([])
  const [showRunDialog, setShowRunDialog] = useState(false)
  const [runStatus, setRunStatus] = useState<"idle" | "running" | "paused" | "completed" | "failed">("idle")

  const handleStartSequence = async () => {
    setIsRunning(true)
    setRunStatus("running")
    setShowRunDialog(true)
    setCurrentBlockIndex(0)
    setResults([])

    try {
      for (let i = 0; i < blocks.length; i++) {
        setCurrentBlockIndex(i)
        const block = blocks[i]

        // Simulate block execution
        await new Promise((resolve) => setTimeout(resolve, 2000))

        // Mock response based on block type
        const response: BlockResponse = {
          id: `response-${block.id}-${Date.now()}`,
          blockId: block.id,
          content: generateMockResponse(block),
          outputs: block.block_type === "discretization" ? generateDiscretizationOutputs(block) : undefined,
          matrix_output: block.block_type === "multi_list" ? generateMatrixOutput(block) : undefined,
        }

        setResults((prev) => [...prev, response])
      }

      setRunStatus("completed")
      onRunComplete?.(results)
    } catch (error) {
      setRunStatus("failed")
    } finally {
      setIsRunning(false)
    }
  }

  const generateMockResponse = (block: Block): string => {
    switch (block.block_type) {
      case "standard":
        return `Response from ${block.name}: This is a simulated AI response for the standard block.`
      case "single_list":
        return `Processed ${block.config.input_list_name} with results for each item.`
      case "multi_list":
        return `Comparison matrix generated between multiple lists.`
      case "discretization":
        return `Discretized output into ${block.config.number_of_outputs} named variables.`
      default:
        return "Simulated response"
    }
  }

  const generateDiscretizationOutputs = (block: Block) => {
    const outputs: { [key: string]: string } = {}
    const names = block.config.output_variable_names || []
    names.forEach((name, index) => {
      outputs[name] = `Output ${index + 1}: ${name} content`
    })
    return outputs
  }

  const generateMatrixOutput = (block: Block) => {
    return {
      item1: { criteria1: "Yes", criteria2: "No" },
      item2: { criteria1: "No", criteria2: "Yes" },
    }
  }

  const getBlockStatusIcon = (index: number) => {
    if (index < currentBlockIndex) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (index === currentBlockIndex && isRunning) return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
    if (runStatus === "failed" && index === currentBlockIndex) return <AlertCircle className="h-4 w-4 text-red-500" />
    return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
  }

  const progress = blocks.length > 0 ? (currentBlockIndex / blocks.length) * 100 : 0

  return (
    <>
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Sequence Execution</h3>
            <p className="text-sm text-gray-600">Run all {blocks.length} blocks in sequence</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleStartSequence}
              disabled={isRunning || blocks.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="h-4 w-4 mr-2" />
              Run Sequence
            </Button>
            {isRunning && (
              <Button variant="outline" onClick={() => setIsRunning(false)}>
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            )}
          </div>
        </div>

        {runStatus !== "idle" && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>
                Progress: {currentBlockIndex} / {blocks.length}
              </span>
              <Badge
                variant={runStatus === "completed" ? "default" : runStatus === "failed" ? "destructive" : "secondary"}
              >
                {runStatus}
              </Badge>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}
      </Card>

      <Dialog open={showRunDialog} onOpenChange={setShowRunDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sequence Execution Progress</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <Badge
                variant={runStatus === "completed" ? "default" : runStatus === "failed" ? "destructive" : "secondary"}
              >
                {runStatus}
              </Badge>
            </div>
            <Progress value={progress} className="w-full" />

            <div className="space-y-3">
              {blocks.map((block, index) => (
                <div key={block.id} className="flex items-center gap-3 p-3 border rounded">
                  {getBlockStatusIcon(index)}
                  <div className="flex-1">
                    <div className="font-medium">{block.name}</div>
                    <div className="text-sm text-gray-600">{block.block_type} block</div>
                  </div>
                  {results[index] && (
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      Complete
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            {results.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-3">Results Summary</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {results.map((result, index) => (
                    <div key={result.id} className="text-sm p-2 bg-gray-50 rounded">
                      <strong>Block {index + 1}:</strong> {result.content.substring(0, 100)}...
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
