"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { cn } from "@/lib/utils"

interface HighlightRule {
  pattern: RegExp
  className: string
  validator?: (match: string) => boolean
}

interface BracketMatch {
  openStart: number
  openEnd: number
  closeStart: number
  closeEnd: number
}

interface SyntaxHighlightedTextareaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  highlightRules?: HighlightRule[]
  availableVariables?: string[]
  onVariableClick?: (variable: string) => void
  disabled?: boolean
  rows?: number
  onCursorPositionChange?: (position: number) => void // Add this prop
}

export function SyntaxHighlightedTextarea({
  value,
  onChange,
  placeholder,
  className,
  highlightRules = [],
  availableVariables = [],
  onVariableClick,
  disabled = false,
  rows = 4,
  onCursorPositionChange,
  ...props
}: SyntaxHighlightedTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  // Add bracket matching state after existing state declarations
  const [cursorPosition, setCursorPosition] = useState(0)
  const [bracketMatch, setBracketMatch] = useState<BracketMatch | null>(null)

  // Default highlight rules for variables
  const defaultRules: HighlightRule[] = [
    {
      pattern: /<<([^>]+)>>/g,
      className: "variable-highlight",
      validator: (match) => {
        const variableName = match.slice(2, -2) // Remove << and >>
        return availableVariables.includes(variableName)
      },
    },
  ]

  const allRules = [...defaultRules, ...highlightRules]

  // Add bracket matching logic function
  const findBracketMatch = useCallback((text: string, position: number): BracketMatch | null => {
    // Find all variable brackets in the text
    const variableMatches = [...text.matchAll(/<<([^>]+)>>/g)]

    for (const match of variableMatches) {
      if (match.index === undefined) continue

      const openStart = match.index
      const openEnd = openStart + 2 // Length of "<<"
      const closeStart = openStart + match[0].length - 2 // Position of ">>"
      const closeEnd = closeStart + 2 // End of ">>"

      // Check if cursor is near opening brackets
      if (position >= openStart && position <= openEnd) {
        return { openStart, openEnd, closeStart, closeEnd }
      }

      // Check if cursor is near closing brackets
      if (position >= closeStart && position <= closeEnd) {
        return { openStart, openEnd, closeStart, closeEnd }
      }

      // Check if cursor is inside the variable name
      if (position > openEnd && position < closeStart) {
        return { openStart, openEnd, closeStart, closeEnd }
      }
    }

    return null
  }, [])

  // Update cursor position tracking
  const handleCursorPositionChange = useCallback(() => {
    if (textareaRef.current) {
      const position = textareaRef.current.selectionStart || 0
      setCursorPosition(position)

      // Find bracket match for current position
      const match = findBracketMatch(value, position)
      setBracketMatch(match)

      // Call external callback if provided
      onCursorPositionChange?.(position)
    }
  }, [value, findBracketMatch, onCursorPositionChange])

  // Add event listeners for cursor position changes
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      const handleSelectionChange = () => {
        setTimeout(handleCursorPositionChange, 0)
      }

      textarea.addEventListener("selectionchange", handleSelectionChange)
      textarea.addEventListener("click", handleSelectionChange)
      textarea.addEventListener("keyup", handleSelectionChange)

      return () => {
        textarea.removeEventListener("selectionchange", handleSelectionChange)
        textarea.removeEventListener("click", handleSelectionChange)
        textarea.removeEventListener("keyup", handleSelectionChange)
      }
    }
  }, [handleCursorPositionChange])

  // Update the highlightText function to include bracket matching
  const highlightText = useCallback(
    (text: string) => {
      if (!text) return ""

      let highlightedText = text
      const processedRanges: Array<{ start: number; end: number }> = []

      // First, add bracket matching highlights
      if (bracketMatch) {
        const { openStart, openEnd, closeStart, closeEnd } = bracketMatch

        // Highlight opening brackets
        const openBrackets = text.substring(openStart, openEnd)
        highlightedText = highlightedText.replace(openBrackets, `<span class="bracket-match">${openBrackets}</span>`)

        // Highlight closing brackets
        const closeBrackets = text.substring(closeStart, closeEnd)
        // Use a different replacement to avoid conflicts
        highlightedText = highlightedText.replace(
          new RegExp(`${closeBrackets.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?!.*<span class="bracket-match">)`),
          `<span class="bracket-match">${closeBrackets}</span>`,
        )

        processedRanges.push({ start: openStart, end: openEnd }, { start: closeStart, end: closeEnd })
      }

      // Then process variable highlighting rules
      allRules.forEach((rule) => {
        const matches = [...text.matchAll(rule.pattern)]

        matches.forEach((match) => {
          if (match.index === undefined) return

          const start = match.index
          const end = start + match[0].length

          // Check if this range overlaps with already processed ranges
          const overlaps = processedRanges.some(
            (range) => (start >= range.start && start < range.end) || (end > range.start && end <= range.end),
          )

          if (!overlaps) {
            const isValid = rule.validator ? rule.validator(match[0]) : true
            const className = isValid ? rule.className : `${rule.className} invalid`

            // Extract variable name for click handling
            const variableName = match[0].slice(2, -2) // Remove << and >>

            // Add bracket matching class if this variable is currently matched
            const isBracketMatched = bracketMatch && start >= bracketMatch.openStart && end <= bracketMatch.closeEnd

            const finalClassName = isBracketMatched ? `${className} bracket-matched-variable` : className

            highlightedText = highlightedText.replace(
              match[0],
              `<span class="${finalClassName}" data-variable="${variableName}" data-valid="${isValid}">${match[0]}</span>`,
            )

            processedRanges.push({ start, end })
          }
        })
      })

      return highlightedText
    },
    [availableVariables, highlightRules, bracketMatch],
  )

  const syncScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }, [])

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  const handleVariableClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.dataset.variable && onVariableClick) {
      onVariableClick(target.dataset.variable)
    }
  }

  // Sync scroll positions
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.addEventListener("scroll", syncScroll)
      return () => textarea.removeEventListener("scroll", syncScroll)
    }
  }, [syncScroll])

  // Update highlight when value changes
  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.innerHTML = highlightText(value)
    }
  }, [value, highlightText])

  return (
    <div className="relative">
      {/* Highlighted background */}
      <div
        ref={highlightRef}
        className={cn(
          "absolute inset-0 pointer-events-none overflow-hidden whitespace-pre-wrap break-words",
          "font-mono text-transparent border border-transparent",
          "p-3 leading-6",
          className,
        )}
        style={{
          fontSize: "inherit",
          lineHeight: "inherit",
          fontFamily: "inherit",
          wordWrap: "break-word",
          whiteSpace: "pre-wrap",
        }}
        onClick={handleVariableClick}
        dangerouslySetInnerHTML={{ __html: highlightText(value) }}
      />

      {/* Actual textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextareaChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={cn(
          "relative z-10 w-full resize-none bg-transparent",
          "font-mono border border-input rounded-md",
          "p-3 text-sm leading-6",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "caret-gray-900",
          className,
        )}
        style={{
          color: isFocused ? "rgba(0, 0, 0, 0.8)" : "rgba(0, 0, 0, 0.6)",
        }}
        {...props}
      />

      {/* Syntax highlighting styles */}
      <style jsx>{`
        .variable-highlight {
          background-color: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 4px;
          padding: 1px 2px;
          color: #1d4ed8;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .variable-highlight:hover {
          background-color: rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.5);
        }

        .variable-highlight.invalid {
          background-color: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
          color: #dc2626;
        }

        .variable-highlight.invalid:hover {
          background-color: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.5);
        }

        .bracket-match {
          background-color: rgba(34, 197, 94, 0.2);
          border: 1px solid rgba(34, 197, 94, 0.4);
          border-radius: 2px;
          color: #059669;
          font-weight: 600;
          animation: bracket-pulse 0.3s ease-in-out;
        }

        .bracket-matched-variable {
          box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.3);
          border-color: rgba(34, 197, 94, 0.5) !important;
        }

        @keyframes bracket-pulse {
          0% {
            background-color: rgba(34, 197, 94, 0.1);
          }
          50% {
            background-color: rgba(34, 197, 94, 0.3);
          }
          100% {
            background-color: rgba(34, 197, 94, 0.2);
          }
        }
      `}</style>
    </div>
  )
}
