"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Upload, FileText, CheckCircle, AlertTriangle, Copy } from "lucide-react"
import type { ExportData, Sequence, Block, Variable, GlobalList } from "@/types"

interface SequenceExportImportProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sequence: Sequence
  blocks: Block[]
  variables: Variable[]
  globalLists: GlobalList[]
  onImport?: (data: ExportData) => void
}

export function SequenceExportImport({
  open,
  onOpenChange,
  sequence,
  blocks,
  variables,
  globalLists,
  onImport,
}: SequenceExportImportProps) {
  const [exportFormat, setExportFormat] = useState<"json" | "yaml" | "csv">("json")
  const [importData, setImportData] = useState("")
  const [importError, setImportError] = useState<string | null>(null)
  const [exportData, setExportData] = useState<string>("")
  const [copied, setCopied] = useState(false)

  const generateExportData = (): ExportData => {
    return {
      sequence,
      blocks,
      variables,
      global_lists: globalLists,
      export_timestamp: new Date().toISOString(),
      version: "1.0.0",
    }
  }

  const handleExport = (format: "json" | "yaml" | "csv") => {
    const data = generateExportData()

    let exportString = ""

    switch (format) {
      case "json":
        exportString = JSON.stringify(data, null, 2)
        break
      case "yaml":
        // Simple YAML conversion (in real app, use a proper YAML library)
        exportString = `# MPSG Sequence Export
sequence:
  id: "${data.sequence.id}"
  name: "${data.sequence.name}"
  description: "${data.sequence.description || ""}"

blocks:
${data.blocks
  .map(
    (block) => `  - id: "${block.id}"
    name: "${block.name}"
    type: "${block.block_type}"
    model: "${block.model}"
    prompt: |
      ${block.prompt
        .split("\n")
        .map((line) => `      ${line}`)
        .join("\n")}
    output: "${block.output_name}"`,
  )
  .join("\n")}

variables:
${data.variables
  .map(
    (variable) => `  - name: "${variable.name}"
    type: "${variable.type}"
    value: "${variable.value}"`,
  )
  .join("\n")}

export_info:
  timestamp: "${data.export_timestamp}"
  version: "${data.version}"`
        break
      case "csv":
        // CSV format for blocks
        const csvHeaders = ["Block ID", "Name", "Type", "Model", "Prompt", "Output"]
        const csvRows = data.blocks.map((block) => [
          block.id,
          block.name,
          block.block_type,
          block.model,
          `"${block.prompt.replace(/"/g, '""')}"`,
          block.output_name,
        ])
        exportString = [csvHeaders.join(","), ...csvRows.map((row) => row.join(","))].join("\n")
        break
    }

    setExportData(exportString)
  }

  const handleDownload = () => {
    const blob = new Blob([exportData], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${sequence.name.replace(/\s+/g, "_")}_export.${exportFormat}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(exportData)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleImport = () => {
    try {
      setImportError(null)
      const data: ExportData = JSON.parse(importData)

      // Validate the imported data
      if (!data.sequence || !data.blocks || !Array.isArray(data.blocks)) {
        throw new Error("Invalid export format: missing required fields")
      }

      if (!data.version) {
        throw new Error("Invalid export format: missing version information")
      }

      onImport?.(data)
      onOpenChange(false)
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Invalid JSON format")
    }
  }

  const getExportStats = () => {
    return {
      blocks: blocks.length,
      variables: variables.length,
      globalLists: globalLists.length,
      totalSize: new Blob([JSON.stringify(generateExportData())]).size,
    }
  }

  const stats = getExportStats()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export / Import Sequence
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-6">
            {/* Export Statistics */}
            <Card className="p-4">
              <div className="space-y-4">
                <h3 className="font-medium">Export Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.blocks}</div>
                    <div className="text-sm text-gray-600">Blocks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.variables}</div>
                    <div className="text-sm text-gray-600">Variables</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.globalLists}</div>
                    <div className="text-sm text-gray-600">Global Lists</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{Math.round(stats.totalSize / 1024)}KB</div>
                    <div className="text-sm text-gray-600">Size</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Export Format Selection */}
            <Card className="p-4">
              <div className="space-y-4">
                <Label className="text-base font-medium">Export Format</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={exportFormat === "json" ? "default" : "outline"}
                    onClick={() => setExportFormat("json")}
                    className="flex flex-col items-center gap-1 h-auto py-3"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="text-xs">JSON</span>
                  </Button>
                  <Button
                    variant={exportFormat === "yaml" ? "default" : "outline"}
                    onClick={() => setExportFormat("yaml")}
                    className="flex flex-col items-center gap-1 h-auto py-3"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="text-xs">YAML</span>
                  </Button>
                  <Button
                    variant={exportFormat === "csv" ? "default" : "outline"}
                    onClick={() => setExportFormat("csv")}
                    className="flex flex-col items-center gap-1 h-auto py-3"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="text-xs">CSV</span>
                  </Button>
                </div>
                <Button onClick={() => handleExport(exportFormat)} className="w-full">
                  Generate Export
                </Button>
              </div>
            </Card>

            {/* Export Preview */}
            {exportData && (
              <Card className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Export Preview</Label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleCopy} className="flex items-center gap-2">
                        {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        Copy
                      </Button>
                      <Button size="sm" onClick={handleDownload} className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <Textarea value={exportData} readOnly className="font-mono text-xs h-64" />
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="import" className="space-y-6">
            {/* Import Instructions */}
            <Card className="p-4">
              <div className="space-y-4">
                <h3 className="font-medium">Import Instructions</h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>• Paste your exported sequence data in JSON format below</p>
                  <p>• The import will validate the data structure before processing</p>
                  <p>• Existing sequence data will be replaced with the imported data</p>
                  <p>• Make sure to backup your current sequence before importing</p>
                </div>
              </div>
            </Card>

            {/* Import Data Input */}
            <Card className="p-4">
              <div className="space-y-4">
                <Label className="text-base font-medium">Import Data</Label>
                <Textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Paste your exported sequence JSON data here..."
                  className="font-mono text-xs h-64"
                />

                {importError && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    {importError}
                  </div>
                )}

                <Button onClick={handleImport} disabled={!importData.trim()} className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Sequence
                </Button>
              </div>
            </Card>

            {/* Import Validation */}
            {importData && !importError && (
              <Card className="p-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Data format appears valid</span>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
