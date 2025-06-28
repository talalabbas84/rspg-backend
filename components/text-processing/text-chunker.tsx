"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { FileText, Scissors, CheckCircle, AlertTriangle } from "lucide-react"
import type { TextChunk } from "@/types"

interface TextChunkerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onChunksGenerated: (chunks: TextChunk[]) => void
}

export function TextChunker({ open, onOpenChange, onChunksGenerated }: TextChunkerProps) {
  const [inputText, setInputText] = useState("")
  const [chunkSize, setChunkSize] = useState(50)
  const [preserveSentences, setPreserveSentences] = useState(true)
  const [chunks, setChunks] = useState<TextChunk[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const generateChunks = () => {
    setIsProcessing(true)

    try {
      const words = inputText.trim().split(/\s+/)
      const newChunks: TextChunk[] = []
      let currentChunk = ""
      let currentWordCount = 0
      let chunkIndex = 0

      for (let i = 0; i < words.length; i++) {
        const word = words[i]
        const nextWord = words[i + 1]

        currentChunk += (currentChunk ? " " : "") + word
        currentWordCount++

        // Check if we should end the chunk
        const shouldEndChunk = currentWordCount >= chunkSize
        const isEndOfSentence = /[.!?]$/.test(word)
        const isLastWord = i === words.length - 1

        if (shouldEndChunk || isLastWord) {
          let finalChunk = currentChunk
          let sentenceComplete = isEndOfSentence || isLastWord

          // If preserving sentences and we're not at sentence end, try to extend
          if (preserveSentences && !isEndOfSentence && !isLastWord) {
            // Look ahead for sentence end within reasonable limit
            let lookAhead = 0
            let tempChunk = currentChunk

            for (let j = i + 1; j < words.length && lookAhead < 20; j++) {
              tempChunk += " " + words[j]
              lookAhead++

              if (/[.!?]$/.test(words[j])) {
                finalChunk = tempChunk
                sentenceComplete = true
                i = j // Skip ahead
                break
              }
            }
          }

          newChunks.push({
            id: `chunk-${chunkIndex}`,
            content: finalChunk.trim(),
            order: chunkIndex,
            sentence_complete: sentenceComplete,
            word_count: finalChunk.trim().split(/\s+/).length,
          })

          currentChunk = ""
          currentWordCount = 0
          chunkIndex++
        }
      }

      setChunks(newChunks)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleGenerate = () => {
    generateChunks()
  }

  const handleUseChunks = () => {
    onChunksGenerated(chunks)
    onOpenChange(false)
  }

  const getTotalWords = () => inputText.trim().split(/\s+/).length
  const getAverageChunkSize = () => {
    if (chunks.length === 0) return 0
    return Math.round(chunks.reduce((sum, chunk) => sum + chunk.word_count, 0) / chunks.length)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5" />
            Text Chunking & Loop Processing
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Input Section */}
          <Card className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Input Text</Label>
                <Badge variant="outline">{getTotalWords()} words</Badge>
              </div>
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your text here to split into chunks for processing..."
                rows={8}
                className="font-mono text-sm"
              />
            </div>
          </Card>

          {/* Configuration Section */}
          <Card className="p-4">
            <div className="space-y-4">
              <Label className="text-base font-medium">Chunking Configuration</Label>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Chunk Size (words)</Label>
                  <Input
                    type="number"
                    value={chunkSize}
                    onChange={(e) => setChunkSize(Number(e.target.value))}
                    min="10"
                    max="500"
                  />
                  <p className="text-xs text-gray-600">Target number of words per chunk</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Preserve Sentence Integrity</Label>
                    <Switch checked={preserveSentences} onCheckedChange={setPreserveSentences} />
                  </div>
                  <p className="text-xs text-gray-600">Extend chunks to complete sentences when possible</p>
                </div>
              </div>

              <Button onClick={handleGenerate} disabled={!inputText.trim() || isProcessing} className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                {isProcessing ? "Processing..." : "Generate Chunks"}
              </Button>
            </div>
          </Card>

          {/* Results Section */}
          {chunks.length > 0 && (
            <Card className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Generated Chunks</Label>
                  <div className="flex gap-2">
                    <Badge variant="outline">{chunks.length} chunks</Badge>
                    <Badge variant="outline">Avg: {getAverageChunkSize()} words</Badge>
                  </div>
                </div>

                <div className="grid gap-3 max-h-60 overflow-y-auto">
                  {chunks.map((chunk, index) => (
                    <div key={chunk.id} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Chunk {index + 1}</Badge>
                          <Badge variant="outline" className="text-xs">
                            {chunk.word_count} words
                          </Badge>
                          {chunk.sentence_complete ? (
                            <CheckCircle className="h-4 w-4 text-green-500" title="Sentence complete" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" title="Sentence incomplete" />
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 font-mono leading-relaxed">{chunk.content}</p>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setChunks([])}>
                    Clear Chunks
                  </Button>
                  <Button onClick={handleUseChunks}>Use These Chunks for Processing</Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
