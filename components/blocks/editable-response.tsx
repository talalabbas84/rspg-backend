"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Edit3, Save, X, Check, AlertTriangle, CheckCircle } from "lucide-react"
import { validateResponse, type ValidationResult } from "@/lib/response-validator"

interface BlockResponse {
  id: string
  blockId: string
  content: string
  outputs?: { [key: string]: string }
  editedAt?: string
}

interface EditableResponseProps {
  response: BlockResponse | null
  blockType: string
  onUpdate: (response: BlockResponse) => void
}

export function EditableResponse({ response, blockType, onUpdate }: EditableResponseProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editedContent, setEditedContent] = useState("")
  const [editedOutputs, setEditedOutputs] = useState<{ [key: string]: string }>({})
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  if (!response) {
    return (
      <div className="space-y-4">
        <div>
          <h4 className="text-base font-medium text-gray-900 mb-2">Response:</h4>
          <div className="text-sm text-gray-500">No response yet. Run the block to see results.</div>
        </div>
      </div>
    )
  }

  const handleStartEdit = (field?: string) => {
    setValidation(null) // Clear previous validation
    if (field) {
      setEditingField(field)
      setEditedOutputs({ ...response.outputs })
    } else {
      setIsEditing(true)
      setEditedContent(response.content)
    }
  }

  const handleValidateAndSave = async (field?: string) => {
    setIsValidating(true)

    try {
      let validationResult: ValidationResult

      if (field && response.outputs) {
        // Validate specific output field
        validationResult = await validateResponse(editedOutputs[field] || "", blockType, {
          fieldName: field,
          isOutput: true,
        })
      } else {
        // Validate main content
        validationResult = await validateResponse(editedContent, blockType)
      }

      setValidation(validationResult)

      if (validationResult.isValid) {
        // Proceed with save if validation passes
        if (field && response.outputs) {
          const updatedResponse = {
            ...response,
            outputs: editedOutputs,
            editedAt: new Date().toISOString(),
          }
          onUpdate(updatedResponse)
          setEditingField(null)
        } else {
          const updatedResponse = {
            ...response,
            content: editedContent,
            editedAt: new Date().toISOString(),
          }
          onUpdate(updatedResponse)
          setIsEditing(false)
        }
        setValidation(null)
      }
    } catch (error) {
      setValidation({
        isValid: false,
        errors: ["Validation failed. Please try again."],
        warnings: [],
      })
    } finally {
      setIsValidating(false)
    }
  }

  const handleCancel = (field?: string) => {
    setValidation(null)
    if (field) {
      setEditingField(null)
      setEditedOutputs({})
    } else {
      setIsEditing(false)
      setEditedContent("")
    }
  }

  const handleOutputChange = (outputKey: string, value: string) => {
    setEditedOutputs((prev) => ({
      ...prev,
      [outputKey]: value,
    }))
    // Clear validation when user starts typing
    if (validation) {
      setValidation(null)
    }
  }

  const handleContentChange = (value: string) => {
    setEditedContent(value)
    // Clear validation when user starts typing
    if (validation) {
      setValidation(null)
    }
  }

  const renderValidationFeedback = () => {
    if (!validation) return null

    return (
      <div className="space-y-2">
        {validation.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium">Validation Errors:</div>
                <ul className="list-disc list-inside space-y-1">
                  {validation.errors.map((error, index) => (
                    <li key={index} className="text-sm">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {validation.warnings.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium">Warnings:</div>
                <ul className="list-disc list-inside space-y-1">
                  {validation.warnings.map((warning, index) => (
                    <li key={index} className="text-sm">
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {validation.isValid && validation.errors.length === 0 && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">Content validation passed successfully!</AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  const renderStandardResponse = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-medium text-gray-900">Response:</h4>
          <div className="flex items-center gap-2">
            {response.editedAt && <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">Edited</span>}
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleStartEdit()}
                className="text-gray-600 hover:text-gray-900"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={editedContent}
              onChange={(e) => handleContentChange(e.target.value)}
              className="min-h-[120px] resize-none"
              placeholder="Edit the response..."
            />

            {renderValidationFeedback()}

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => handleValidateAndSave()}
                className="bg-green-600 text-white hover:bg-green-700"
                disabled={isValidating}
              >
                {isValidating ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                    Validating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCancel()}
                className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                disabled={isValidating}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="text-sm text-gray-700 leading-relaxed cursor-pointer hover:bg-gray-50 p-2 rounded border border-transparent hover:border-gray-200 transition-colors"
            onClick={() => handleStartEdit()}
            title="Click to edit response"
          >
            {response.content}
          </div>
        )}
      </div>
    )
  }

  const renderDiscretizationResponse = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-medium text-gray-900">Response:</h4>
          {response.editedAt && <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">Edited</span>}
        </div>

        <div className="text-sm font-medium text-gray-700 mb-3">Outputs:</div>

        <div className="space-y-4">
          {response.outputs &&
            Object.entries(response.outputs).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">{key}:</span>
                  {editingField !== key && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartEdit(key)}
                      className="text-gray-600 hover:text-gray-900 p-1"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {editingField === key ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editedOutputs[key] || value}
                      onChange={(e) => handleOutputChange(key, e.target.value)}
                      className="min-h-[80px] resize-none text-sm"
                      placeholder={`Edit ${key}...`}
                    />

                    {renderValidationFeedback()}

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleValidateAndSave(key)}
                        className="bg-green-600 text-white hover:bg-green-700"
                        disabled={isValidating}
                      >
                        {isValidating ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            Validating...
                          </>
                        ) : (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Save
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancel(key)}
                        className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        disabled={isValidating}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="text-gray-600 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded border border-transparent hover:border-gray-200 transition-colors"
                    onClick={() => handleStartEdit(key)}
                    title="Click to edit this output"
                  >
                    "{value}"
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    )
  }

  if (blockType === "standard") {
    return renderStandardResponse()
  }

  if (blockType === "discretization") {
    return renderDiscretizationResponse()
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-base font-medium text-gray-900 mb-2">Response:</h4>
        <div className="text-sm text-gray-500">Response format not yet implemented for this block type.</div>
      </div>
    </div>
  )
}
