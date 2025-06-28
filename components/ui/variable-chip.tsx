"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { X, Info, Copy, Eye } from "lucide-react"
import { cn } from "@/lib/utils"

interface VariableChipProps {
  name: string
  type: "global" | "list" | "output"
  description?: string
  value?: string
  onRemove?: () => void
  onView?: () => void
  size?: "sm" | "md" | "lg"
  showActions?: boolean
  className?: string
}

export function VariableChip({
  name,
  type,
  description,
  value,
  onRemove,
  onView,
  size = "md",
  showActions = true,
  className,
}: VariableChipProps) {
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

  const handleCopy = () => {
    navigator.clipboard.writeText(`<<${name}>>`)
  }

  const truncateValue = (value: string, maxLength = 50) => {
    if (value.length <= maxLength) return value
    return value.substring(0, maxLength) + "..."
  }

  return (
    <TooltipProvider>
      <div
        className={cn(
          "inline-flex items-center rounded-full border transition-all duration-200",
          "hover:shadow-sm hover:scale-105 group",
          getTypeColor(type),
          getSizeClasses(size),
          className,
        )}
      >
        {/* Type Icon */}
        <span className="text-xs" role="img" aria-label={type}>
          {getTypeIcon(type)}
        </span>

        {/* Variable Name */}
        <span className="font-medium font-mono">
          {"<<"}
          {name}
          {">>"}
        </span>

        {/* Type Badge */}
        <Badge
          variant="secondary"
          className={cn(
            "text-xs px-1.5 py-0.5 ml-1",
            type === "global" && "bg-blue-100 text-blue-800",
            type === "list" && "bg-green-100 text-green-800",
            type === "output" && "bg-purple-100 text-purple-800",
          )}
        >
          {type}
        </Badge>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                    onClick={onView}
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
                    onClick={onRemove}
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

        {/* Tooltip with Details */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-4 w-4 p-0 ml-1 opacity-50 hover:opacity-100">
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
                Click to copy: {"<<"}
                {name}
                {">>"}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
