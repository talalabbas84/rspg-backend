"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Clock, Search, Play, CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface ExecutionRun {
  id: string
  timestamp: string
  status: "completed" | "failed" | "running" | "cancelled"
  duration?: string
  blocksExecuted: number
  totalBlocks: number
  errorMessage?: string
}

export function ExecutionHistory() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Mock execution history data
  const [executionRuns] = useState<ExecutionRun[]>([
    {
      id: "run-001",
      timestamp: "2024-01-15 14:30:25",
      status: "completed",
      duration: "2.3s",
      blocksExecuted: 5,
      totalBlocks: 5,
    },
    {
      id: "run-002",
      timestamp: "2024-01-15 14:25:10",
      status: "failed",
      duration: "1.8s",
      blocksExecuted: 3,
      totalBlocks: 5,
      errorMessage: "API rate limit exceeded",
    },
    {
      id: "run-003",
      timestamp: "2024-01-15 14:20:45",
      status: "completed",
      duration: "3.1s",
      blocksExecuted: 5,
      totalBlocks: 5,
    },
  ])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "running":
        return <Play className="h-4 w-4 text-blue-500" />
      case "cancelled":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      completed: "bg-green-100 text-green-800 border-green-200",
      failed: "bg-red-100 text-red-800 border-red-200",
      running: "bg-blue-100 text-blue-800 border-blue-200",
      cancelled: "bg-yellow-100 text-yellow-800 border-yellow-200",
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const filteredRuns = executionRuns.filter((run) => {
    const matchesSearch = run.id.toLowerCase().includes(searchTerm.toLowerCase()) || run.timestamp.includes(searchTerm)
    const matchesStatus = statusFilter === "all" || run.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <Card className="p-4 sm:p-6 w-full bg-white border border-gray-200">
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Execution History</h3>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search runs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-48 text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="running">Running</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Execution Runs List */}
        {filteredRuns.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No Execution History</p>
            <p className="text-sm">Execution history will be displayed here once runs are completed.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRuns.map((run) => (
              <div
                key={run.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {getStatusIcon(run.status)}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 text-sm">{run.id}</span>
                        <Badge variant="outline" className={`px-2 py-1 text-xs ${getStatusBadge(run.status)}`}>
                          {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>Executed: {run.timestamp}</div>
                        <div className="flex flex-wrap gap-3">
                          {run.duration && <span>Duration: {run.duration}</span>}
                          <span>
                            Blocks: {run.blocksExecuted}/{run.totalBlocks}
                          </span>
                        </div>
                        {run.errorMessage && <div className="text-red-600 font-medium">Error: {run.errorMessage}</div>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    >
                      View Details
                    </Button>
                    {run.status === "completed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      >
                        Rerun
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {filteredRuns.length > 0 && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-600">
                  {filteredRuns.filter((r) => r.status === "completed").length}
                </div>
                <div className="text-xs text-gray-500">Completed</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-red-600">
                  {filteredRuns.filter((r) => r.status === "failed").length}
                </div>
                <div className="text-xs text-gray-500">Failed</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-blue-600">
                  {filteredRuns.filter((r) => r.status === "running").length}
                </div>
                <div className="text-xs text-gray-500">Running</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-gray-600">{filteredRuns.length}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
