"use client"

import type React from "react"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { X, Info, Copy, Eye, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface DraggableVariableChipProps {
  id: string
  name: string
  type: "global" | "list" | "output"
  description?: string
  value?: string
  onRemove?: () => void
  onView?: () => void
  size?: "sm" | "md" | "lg"
  showActions?: boolean
  className?: string
  position?: number
}

export function DraggableVariableChip({
  id,
  name,
  type,
  description,
  value,
  onRemove,
  onView,
  size = "md",
  showActions = true,
  className,
  position,
}: DraggableVariableChipProps) {
  const [isHovered, setIsHovered] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    data: {
      type: "variable",
      name,
      variableType: type,
      position,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Add this safety check at the beginning of the component function
  if (!name || typeof name !== "string") {
    return null
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "global":
        return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
      case "list":
        return "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
      case "output":
        return "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "global":
        return "🌐"
      case "list":
        return "📋"
      case "output":
        return "📤"
      default:
        return "📄"
    }
  }

  const getSizeClasses = (size: string) => {
    switch (size) {
      case "sm":
        return "text-xs px-2 py-1 gap-1"
      case "lg":
        return "text-sm px-4 py-2 gap-2"
      default:
        return "text-sm px-3 py-1.5 gap-1.5"
    }
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (name && typeof name === "string") {
      navigator.clipboard.writeText(`<<${name}>>`)
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRemove?.()
  }

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation()
    onView?.()
  }

  const truncateValue = (value: string, maxLength = 50) => {
    if (!value || typeof value !== "string") return "No value"
    if (value.length <= maxLength) return value
    return value.substring(0, maxLength) + "..."
  }

  return (
    <TooltipProvider>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "inline-flex items-center rounded-full border transition-all duration-200",
          "hover:shadow-md group relative touch-none",
          isDragging && "opacity-50 shadow-lg scale-105 z-50 cursor-grabbing",
          !isDragging && "cursor-grab",
          getTypeColor(type),
          getSizeClasses(size),
          className,
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Drag Handle */}
        <div className="flex items-center gap-1" {...attributes} {...listeners}>
          <GripVertical
            className={cn(
              "h-3 w-3 text-gray-400 transition-opacity",
              isHovered || isDragging ? "opacity-100" : "opacity-0",
            )}
          />

          {/* Position Number */}
          {position !== undefined && (
            <span className="text-xs font-bold text-gray-500 bg-white/50 rounded-full w-5 h-5 flex items-center justify-center">
              {position + 1}
            </span>
          )}

          {/* Type Icon */}
          <span className="text-xs" role="img" aria-label={type}>
            {getTypeIcon(type)}
          </span>
        </div>

        {/* Variable Name */}
        <span className="font-medium font-mono pointer-events-none">
          {"<<"}
          {name}
          {">>"}
        </span>

        {/* Type Badge */}
        <Badge
          variant="secondary"
          className={cn(
            "text-xs px-1.5 py-0.5 ml-1 pointer-events-none",
            type === "global" && "bg-blue-100 text-blue-800",
            type === "list" && "bg-green-100 text-green-800",
            type === "output" && "bg-purple-100 text-purple-800",
          )}
        >
          {type}
        </Badge>

        {/* Actions */}
        {showActions && (
          <div
            className={cn(
              "flex items-center gap-1 ml-2 transition-opacity",
              isHovered || isDragging ? "opacity-100" : "opacity-0",
            )}
          >
            {/* Copy Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-5 w-5 p-0 hover:bg-white/50 rounded-full"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy variable syntax</p>
              </TooltipContent>
            </Tooltip>

            {/* View Details Button */}
            {onView && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleView}
                    className="h-5 w-5 p-0 hover:bg-white/50 rounded-full"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View details</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Remove Button */}
            {onRemove && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemove}
                    className="h-5 w-5 p-0 hover:bg-red-100 hover:text-red-600 rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Remove variable</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        {/* Info Tooltip */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 ml-1 opacity-50 hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <Info className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-2">
              <div className="font-medium">{name}</div>
              <div className="text-xs text-gray-500">Type: {type}</div>
              {description && (
                <div className="text-xs">
                  <span className="font-medium">Description:</span> {description}
                </div>
              )}
              {value && (
                <div className="text-xs">
                  <span className="font-medium">Value:</span> {truncateValue(value)}
                </div>
              )}
              <div className="text-xs text-gray-400 border-t pt-1">
                Drag to reorder • Click to copy: {"<<"}
                {name}
                {">>"}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Dragging Indicator */}
        {isDragging && (
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-blue-400 bg-blue-50/50 animate-pulse" />
        )}
      </div>
    </TooltipProvider>
  )
}
