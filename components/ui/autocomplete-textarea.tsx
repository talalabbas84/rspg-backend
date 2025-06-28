"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface AutocompleteOption {
  value: string
  label: string
  type: "global" | "list" | "output"
  description?: string
}

interface AutocompleteTextareaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  options: AutocompleteOption[]
  triggerPattern?: RegExp
  minChars?: number
  maxSuggestions?: number
}

export function AutocompleteTextarea({
  value,
  onChange,
  placeholder,
  className,
  options,
  triggerPattern = /<<([^>]*)$/,
  minChars = 0,
  maxSuggestions = 8,
  ...props
}: AutocompleteTextareaProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<AutocompleteOption[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [triggerInfo, setTriggerInfo] = useState<{
    start: number
    end: number
    query: string
  } | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const getCaretPosition = useCallback(() => {
    if (!textareaRef.current) return 0
    return textareaRef.current.selectionStart || 0
  }, [])

  const updateSuggestions = useCallback(
    (inputValue: string, caretPos: number) => {
      // Get text up to caret position
      const textBeforeCaret = inputValue.substring(0, caretPos)
      const match = textBeforeCaret.match(triggerPattern)

      if (match) {
        const query = match[1].toLowerCase()
        const triggerStart = caretPos - match[0].length + 2 // +2 for "<<"

        if (query.length >= minChars) {
          const filteredOptions = options
            .filter(
              (option) => option.value.toLowerCase().includes(query) || option.label.toLowerCase().includes(query),
            )
            .slice(0, maxSuggestions)

          if (filteredOptions.length > 0) {
            setSuggestions(filteredOptions)
            setTriggerInfo({
              start: triggerStart,
              end: caretPos,
              query: match[1],
            })
            setSelectedIndex(0)
            setShowSuggestions(true)
            return
          }
        }
      }

      setShowSuggestions(false)
      setTriggerInfo(null)
    },
    [options, triggerPattern, minChars, maxSuggestions],
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    onChange(newValue)

    // Update suggestions based on current caret position
    setTimeout(() => {
      const caretPos = getCaretPosition()
      updateSuggestions(newValue, caretPos)
    }, 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % suggestions.length)
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length)
        break
      case "Enter":
      case "Tab":
        e.preventDefault()
        selectSuggestion(suggestions[selectedIndex])
        break
      case "Escape":
        setShowSuggestions(false)
        break
    }
  }

  const selectSuggestion = (option: AutocompleteOption) => {
    if (!triggerInfo || !textareaRef.current) return

    const beforeTrigger = value.substring(0, triggerInfo.start - 2) // -2 for "<<"
    const afterCaret = value.substring(triggerInfo.end)
    const newValue = beforeTrigger + `<<${option.value}>>` + afterCaret

    onChange(newValue)
    setShowSuggestions(false)

    // Set cursor position after the inserted variable
    setTimeout(() => {
      if (textareaRef.current) {
        const newCaretPos = beforeTrigger.length + option.value.length + 4 // +4 for "<<>>"
        textareaRef.current.setSelectionRange(newCaretPos, newCaretPos)
        textareaRef.current.focus()
      }
    }, 0)
  }

  const handleClick = () => {
    setTimeout(() => {
      const caretPos = getCaretPosition()
      updateSuggestions(value, caretPos)
    }, 0)
  }

  const handleBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false)
    }, 150)
  }

  const getSuggestionPosition = () => {
    if (!textareaRef.current || !triggerInfo) return { top: 0, left: 0 }

    const textarea = textareaRef.current
    const textBeforeTrigger = value.substring(0, triggerInfo.start - 2)

    // Create a temporary element to measure text dimensions
    const temp = document.createElement("div")
    temp.style.position = "absolute"
    temp.style.visibility = "hidden"
    temp.style.whiteSpace = "pre-wrap"
    temp.style.wordWrap = "break-word"
    temp.style.font = window.getComputedStyle(textarea).font
    temp.style.width = `${textarea.clientWidth}px`
    temp.style.padding = window.getComputedStyle(textarea).padding
    temp.textContent = textBeforeTrigger

    document.body.appendChild(temp)
    const rect = textarea.getBoundingClientRect()
    const tempRect = temp.getBoundingClientRect()

    document.body.removeChild(temp)

    return {
      top: rect.top + tempRect.height + 5,
      left: rect.left + (tempRect.width % textarea.clientWidth),
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "global":
        return "bg-blue-100 text-blue-800"
      case "list":
        return "bg-green-100 text-green-800"
      case "output":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const position = showSuggestions ? getSuggestionPosition() : { top: 0, left: 0 }

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={cn("font-mono", className)}
        {...props}
      />

      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto min-w-64"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          <div className="p-2 text-xs text-gray-500 border-b border-gray-100">
            Variables (use ↑↓ to navigate, Enter to select)
          </div>
          {suggestions.map((option, index) => (
            <div
              key={`${option.type}-${option.value}`}
              className={cn(
                "flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-50 last:border-b-0",
                index === selectedIndex && "bg-blue-50 border-blue-100",
              )}
              onClick={() => selectSuggestion(option)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 truncate">{option.value}</span>
                  <span className={`text-xs px-2 py-1 rounded ${getTypeColor(option.type)}`}>{option.type}</span>
                </div>
                {option.description && (
                  <div className="text-sm text-gray-500 truncate mt-1" title={option.description}>
                    {option.description}
                  </div>
                )}
              </div>
            </div>
          ))}
          {suggestions.length === 0 && (
            <div className="p-3 text-sm text-gray-500 text-center">No matching variables found</div>
          )}
        </div>
      )}
    </div>
  )
}
