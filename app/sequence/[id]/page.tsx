"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { apiClient } from "@/lib/api"
import type { Sequence, Block, Variable as SequenceVariable, AvailableVariable } from "@/types" // Ensure types are comprehensive

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, ArrowLeft, Save, Play, PlusCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

import { BlocksList } from "@/components/blocks/blocks-list" // Needs to use useBlocks hook
import { CreateBlockModal } from "@/components/modals/create-block-modal" // Needs to be adapted
import { EditBlockModal } from "@/components/modals/edit-block-modal"
import { SequenceRunner } from "@/components/sequence/sequence-runner" // Needs to use useRuns hook
import { ExecutionHistory } from "@/components/sequence/execution-history" // Needs to use useRuns hook
import { CreateVariableModal } from "@/components/modals/create-variable-modal"
import { VariablesForSequenceList } from "@/components/variables/variables-for-sequence-list" // New component
import { BlockTypeSelectionModal } from "@/components/modals/block-type-selection-modal"

export default function SequenceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user, loading: authLoading, isAuthenticated } = useAuth()

  const sequenceId = params.id as string

  const [sequence, setSequence] = useState<Sequence | null>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [sequenceVariables, setSequenceVariables] = useState<SequenceVariable[]>([]) // Variables specific to this sequence
  const [availableVariablesForPrompt, setAvailableVariablesForPrompt] = useState<AvailableVariable[]>([])

  const [loadingSequence, setLoadingSequence] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [showCreateBlockTypeModal, setShowCreateBlockTypeModal] = useState(false)
  const [selectedBlockTypeForCreation, setSelectedBlockTypeForCreation] = useState<string | null>(null)
  const [showCreateActualBlockModal, setShowCreateActualBlockModal] = useState(false)

  const [editingBlock, setEditingBlock] = useState<Block | null>(null)
  const [showEditBlockModal, setShowEditBlockModal] = useState(false)

  const [showCreateVariableModal, setShowCreateVariableModal] = useState(false)

  const fetchSequenceData = useCallback(async () => {
    if (!sequenceId || !isAuthenticated) return
    setLoadingSequence(true)
    try {
      const [seqData, blocksData, seqVarsData, availableVarsData] = await Promise.all([
        apiClient.getSequence(sequenceId),
        apiClient.getBlocksBySequence(sequenceId),
        apiClient.getVariablesBySequence(sequenceId),
        apiClient.getAvailableVariablesForSequence(sequenceId),
      ])
      setSequence(seqData)
      setBlocks(blocksData.sort((a, b) => a.order - b.order)) // Ensure blocks are ordered
      setSequenceVariables(seqVarsData)
      setAvailableVariablesForPrompt(availableVarsData)
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: `Failed to load sequence data: ${error.message}` })
      router.push("/") // Redirect if sequence not found or not owned
    } finally {
      setLoadingSequence(false)
    }
  }, [sequenceId, isAuthenticated, toast, router])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    } else if (isAuthenticated && sequenceId) {
      fetchSequenceData()
    }
  }, [authLoading, isAuthenticated, sequenceId, router, fetchSequenceData])

  const handleSaveSequenceDetails = async () => {
    if (!sequence) return
    setIsSaving(true)
    try {
      await apiClient.updateSequence(sequence.id, { name: sequence.name, description: sequence.description })
      toast({ title: "Success", description: "Sequence details saved." })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: `Failed to save sequence: ${error.message}` })
    } finally {
      setIsSaving(false)
    }
  }

  const handleOpenCreateBlockModal = (blockType: string) => {
    setSelectedBlockTypeForCreation(blockType)
    setShowCreateBlockTypeModal(false) // Close type selection
    setShowCreateActualBlockModal(true) // Open actual creation modal
  }

  const handleBlockCreated = (newBlock: Block) => {
    // setBlocks(prev => [...prev, newBlock].sort((a,b) => a.order - b.order));
    fetchSequenceData() // Refetch all data to ensure consistency, especially available variables
    setShowCreateActualBlockModal(false)
  }

  const handleEditBlock = (block: Block) => {
    setEditingBlock(block)
    setShowEditBlockModal(true)
  }

  const handleBlockUpdated = (updatedBlock: Block) => {
    // setBlocks(prev => prev.map(b => b.id === updatedBlock.id ? updatedBlock : b).sort((a,b) => a.order - b.order));
    fetchSequenceData() // Refetch
    setShowEditBlockModal(false)
  }

  const handleBlockDeleted = async (blockId: string) => {
    if (!sequenceId) return
    if (confirm("Are you sure you want to delete this block?")) {
      try {
        await apiClient.deleteBlock(blockId)
        toast({ title: "Success", description: "Block deleted." })
        fetchSequenceData() // Refetch
      } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: `Failed to delete block: ${error.message}` })
      }
    }
  }

  const handleVariableCreatedOrUpdated = () => {
    fetchSequenceData() // Refetch sequence variables and available variables
  }

  if (authLoading || loadingSequence) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-gray-700" />
        <p className="ml-4 text-lg">Loading sequence...</p>
      </div>
    )
  }

  if (!sequence) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-xl text-red-600 mb-4">Sequence not found or you don't have access.</p>
        <Button onClick={() => router.push("/")} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" /> Go to Dashboard
        </Button>
      </div>
    )
  }

  // Simplified run handler
  const handleRunSequence = async () => {
    if (!sequenceId) return
    toast({ title: "Initiating Run", description: "Sequence execution started..." })
    try {
      // This will be a long-running call if backend is synchronous
      const runResult = await apiClient.createRunForSequence({ sequence_id: sequenceId, input_overrides_json: {} })
      toast({ title: "Run Complete", description: `Sequence executed. Run ID: ${runResult.id}` })
      // TODO: Update execution history tab or trigger a refetch for it
    } catch (error: any) {
      toast({ variant: "destructive", title: "Run Failed", description: error.message })
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b">
        <Button onClick={() => router.push("/")} variant="outline" size="sm" className="mb-2 sm:mb-0">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Button>
        <div className="flex-grow">
          <Input
            value={sequence.name}
            onChange={(e) => setSequence({ ...sequence, name: e.target.value })}
            className="text-2xl font-bold border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
            placeholder="Sequence Name"
          />
          <Textarea
            value={sequence.description || ""}
            onChange={(e) => setSequence({ ...sequence, description: e.target.value })}
            className="text-sm text-gray-600 mt-1 border-0 shadow-none focus-visible:ring-0 p-0 h-auto resize-none"
            placeholder="Sequence description..."
            rows={1}
          />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button onClick={handleSaveSequenceDetails} size="sm" disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Details
          </Button>
          <Button
            onClick={handleRunSequence}
            size="sm"
            variant="default"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Play className="h-4 w-4 mr-2" />
            Run Sequence
          </Button>
        </div>
      </header>

      <Tabs defaultValue="blocks" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2">
          <TabsTrigger value="blocks">Blocks Editor</TabsTrigger>
          <TabsTrigger value="variables">Sequence Variables</TabsTrigger>
          <TabsTrigger value="runner">Run & Results</TabsTrigger>
          <TabsTrigger value="history">Execution History</TabsTrigger>
        </TabsList>

        <TabsContent value="blocks" className="mt-6">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setShowCreateBlockTypeModal(true)} size="sm">
              <PlusCircle className="h-4 w-4 mr-2" /> Add New Block
            </Button>
          </div>
          <BlocksList
            sequenceId={sequenceId}
            blocks={blocks}
            onEditBlock={handleEditBlock}
            onDeleteBlock={handleBlockDeleted}
            availableVariables={availableVariablesForPrompt} // Pass this down
            onBlockOrderChange={async (reorderedBlocks) => {
              // TODO: API to update block order
              // For now, just update local state and re-fetch for consistency
              // This is a complex operation that needs careful backend support
              console.log("Block order change requested", reorderedBlocks)
              toast({
                title: "Order Change",
                description: "Block reordering UI implemented. Backend for persistence needed.",
              })
              setBlocks(reorderedBlocks) // Optimistic update
              // await apiClient.updateBlockOrder(sequenceId, reorderedBlocks.map(b => ({id: b.id, order: b.order})));
              // fetchSequenceData();
            }}
          />
        </TabsContent>

        <TabsContent value="variables" className="mt-6">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setShowCreateVariableModal(true)} size="sm">
              <PlusCircle className="h-4 w-4 mr-2" /> Add Sequence Variable
            </Button>
          </div>
          <VariablesForSequenceList
            sequenceId={sequenceId}
            variables={sequenceVariables}
            onVariableChange={handleVariableCreatedOrUpdated} // For create/update/delete
          />
        </TabsContent>

        <TabsContent value="runner" className="mt-6">
          <SequenceRunner
            sequenceId={sequenceId}
            blocks={blocks} // Pass current blocks
            // onRunComplete will be handled by the main run button for now
            // This component might be more for individual block testing or detailed run view
          />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <ExecutionHistory sequenceId={sequenceId} />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <BlockTypeSelectionModal
        open={showCreateBlockTypeModal}
        onOpenChange={setShowCreateBlockTypeModal}
        onSelectBlockType={handleOpenCreateBlockModal}
      />
      {selectedBlockTypeForCreation && (
        <CreateBlockModal
          open={showCreateActualBlockModal}
          onOpenChange={setShowCreateActualBlockModal}
          blockType={selectedBlockTypeForCreation}
          sequenceId={sequenceId}
          onBlockCreated={handleBlockCreated}
          availableVariables={availableVariablesForPrompt}
        />
      )}
      {editingBlock && (
        <EditBlockModal
          open={showEditBlockModal}
          onOpenChange={setShowEditBlockModal}
          block={editingBlock}
          onUpdate={handleBlockUpdated}
          availableVariables={availableVariablesForPrompt}
          sequenceId={sequenceId}
        />
      )}
      <CreateVariableModal
        open={showCreateVariableModal}
        onOpenChange={setShowCreateVariableModal}
        sequenceId={sequenceId} // For sequence-specific variables
        onVariableCreated={handleVariableCreatedOrUpdated}
        // variableType can be 'input' or 'global' (if sequence-scoped global)
      />
    </div>
  )
}
