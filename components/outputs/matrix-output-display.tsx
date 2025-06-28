"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Search, Grid, Copy, CheckCircle } from "lucide-react"

interface MatrixOutputDisplayProps {
  matrixData: { [key: string]: { [key: string]: string } }
  title: string
  description?: string
  onExport?: (format: "csv" | "json" | "xlsx") => void
}

export function MatrixOutputDisplay({ matrixData, title, description, onExport }: MatrixOutputDisplayProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCell, setSelectedCell] = useState<{ row: string; col: string; value: string } | null>(null)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [copiedValue, setCopiedValue] = useState<string | null>(null)

  const rows = Object.keys(matrixData)
  const cols = rows.length > 0 ? Object.keys(matrixData[rows[0]]) : []

  const filteredData = rows.reduce(
    (acc, row) => {
      const filteredRow = cols.reduce(
        (rowAcc, col) => {
          const value = matrixData[row][col]
          if (
            value.toLowerCase().includes(searchTerm.toLowerCase()) ||
            row.toLowerCase().includes(searchTerm.toLowerCase()) ||
            col.toLowerCase().includes(searchTerm.toLowerCase())
          ) {
            rowAcc[col] = value
          }
          return rowAcc
        },
        {} as { [key: string]: string },
      )

      if (Object.keys(filteredRow).length > 0) {
        acc[row] = filteredRow
      }
      return acc
    },
    {} as { [key: string]: { [key: string]: string } },
  )

  const handleCellClick = (row: string, col: string, value: string) => {
    setSelectedCell({ row, col, value })
  }

  const handleCopyValue = (value: string) => {
    navigator.clipboard.writeText(value)
    setCopiedValue(value)
    setTimeout(() => setCopiedValue(null), 2000)
  }

  const handleCopyMatrix = () => {
    const csvContent = [
      ["", ...cols].join(","),
      ...rows.map((row) => [row, ...cols.map((col) => `"${matrixData[row][col]}"`)].join(",")),
    ].join("\n")

    navigator.clipboard.writeText(csvContent)
    setCopiedValue("matrix")
    setTimeout(() => setCopiedValue(null), 2000)
  }

  const getValueColor = (value: string) => {
    const lower = value.toLowerCase()
    if (lower.includes("yes") || lower.includes("true") || lower.includes("positive")) {
      return "bg-green-100 text-green-800"
    }
    if (lower.includes("no") || lower.includes("false") || lower.includes("negative")) {
      return "bg-red-100 text-red-800"
    }
    if (lower.includes("maybe") || lower.includes("partial") || lower.includes("unknown")) {
      return "bg-yellow-100 text-yellow-800"
    }
    return "bg-gray-100 text-gray-800"
  }

  const getMatrixStats = () => {
    const totalCells = rows.length * cols.length
    const filledCells = rows.reduce((count, row) => {
      return count + cols.filter((col) => matrixData[row][col]?.trim()).length
    }, 0)

    return { totalCells, filledCells, completeness: Math.round((filledCells / totalCells) * 100) }
  }

  const stats = getMatrixStats()

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Grid className="h-5 w-5" />
            <h3 className="text-lg font-medium">{title}</h3>
            <Badge variant="outline">
              {rows.length} × {cols.length} Matrix
            </Badge>
          </div>
          {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyMatrix} className="flex items-center gap-2">
            {copiedValue === "matrix" ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            Copy Matrix
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExportDialog(true)}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        <Badge variant="secondary">
          {stats.filledCells}/{stats.totalCells} cells filled
        </Badge>
        <Badge variant="secondary">{stats.completeness}% complete</Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search matrix values, rows, or columns..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Matrix Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto max-h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-white border-r font-medium">Row / Column</TableHead>
                {cols.map((col) => (
                  <TableHead key={col} className="text-center min-w-32">
                    <div className="font-medium truncate" title={col}>
                      {col}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.keys(filteredData).map((row) => (
                <TableRow key={row}>
                  <TableCell className="sticky left-0 bg-white border-r font-medium">
                    <div className="truncate" title={row}>
                      {row}
                    </div>
                  </TableCell>
                  {cols.map((col) => {
                    const value = matrixData[row][col] || ""
                    const isFiltered = filteredData[row] && filteredData[row][col] !== undefined

                    return (
                      <TableCell
                        key={col}
                        className={`text-center cursor-pointer hover:bg-gray-50 ${!isFiltered ? "opacity-30" : ""}`}
                        onClick={() => handleCellClick(row, col, value)}
                      >
                        <Badge
                          variant="outline"
                          className={`${getValueColor(value)} text-xs max-w-full truncate`}
                          title={value}
                        >
                          {value || "—"}
                        </Badge>
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Cell Detail Dialog */}
      <Dialog open={!!selectedCell} onOpenChange={() => setSelectedCell(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Matrix Cell Details</DialogTitle>
          </DialogHeader>
          {selectedCell && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Row</label>
                  <div className="text-sm text-gray-600">{selectedCell.row}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Column</label>
                  <div className="text-sm text-gray-600">{selectedCell.col}</div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Value</label>
                <div className="bg-gray-50 p-3 rounded-lg mt-1">
                  <code className="text-sm">{selectedCell.value}</code>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Variable Reference</label>
                <div className="bg-gray-900 text-green-400 p-3 rounded-lg mt-1 font-mono">
                  <code>{`<<${title}[${selectedCell.row}][${selectedCell.col}]>>`}</code>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleCopyValue(selectedCell.value)}
                  className="flex items-center gap-2"
                >
                  {copiedValue === selectedCell.value ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  Copy Value
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleCopyValue(`<<${title}[${selectedCell.row}][${selectedCell.col}]>>`)}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy Reference
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Matrix</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Choose a format to export the matrix data:</p>
            <div className="grid gap-2">
              <Button variant="outline" onClick={() => onExport?.("csv")} className="justify-start">
                <Download className="h-4 w-4 mr-2" />
                CSV (Comma Separated Values)
              </Button>
              <Button variant="outline" onClick={() => onExport?.("json")} className="justify-start">
                <Download className="h-4 w-4 mr-2" />
                JSON (JavaScript Object Notation)
              </Button>
              <Button variant="outline" onClick={() => onExport?.("xlsx")} className="justify-start">
                <Download className="h-4 w-4 mr-2" />
                Excel (XLSX)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
