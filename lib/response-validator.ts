export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions?: string[]
}

export interface ValidationOptions {
  fieldName?: string
  isOutput?: boolean
  maxLength?: number
  minLength?: number
  requiredPatterns?: RegExp[]
  forbiddenPatterns?: RegExp[]
}

export async function validateResponse(
  content: string,
  blockType: string,
  options: ValidationOptions = {},
): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  }

  // Basic content validation
  await validateBasicContent(content, result, options)

  // Block-type specific validation
  switch (blockType) {
    case "standard":
      await validateStandardResponse(content, result, options)
      break
    case "discretization":
      await validateDiscretizationResponse(content, result, options)
      break
    case "single_list":
      await validateSingleListResponse(content, result, options)
      break
    case "multi_list":
      await validateMultiListResponse(content, result, options)
      break
  }

  // Set overall validity
  result.isValid = result.errors.length === 0

  return result
}

async function validateBasicContent(
  content: string,
  result: ValidationResult,
  options: ValidationOptions,
): Promise<void> {
  // Check if content is empty
  if (!content || content.trim().length === 0) {
    result.errors.push("Content cannot be empty")
    return
  }

  // Check minimum length
  const minLength = options.minLength || 10
  if (content.trim().length < minLength) {
    result.errors.push(`Content must be at least ${minLength} characters long`)
  }

  // Check maximum length
  const maxLength = options.maxLength || 10000
  if (content.length > maxLength) {
    result.errors.push(`Content must not exceed ${maxLength} characters`)
  }

  // Check for potentially harmful content
  const harmfulPatterns = [
    /\b(delete|drop|truncate)\s+table\b/i,
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/i,
  ]

  for (const pattern of harmfulPatterns) {
    if (pattern.test(content)) {
      result.errors.push("Content contains potentially harmful code")
      break
    }
  }

  // Check for required patterns
  if (options.requiredPatterns) {
    for (const pattern of options.requiredPatterns) {
      if (!pattern.test(content)) {
        result.warnings.push(`Content should match the expected format pattern`)
      }
    }
  }

  // Check for forbidden patterns
  if (options.forbiddenPatterns) {
    for (const pattern of options.forbiddenPatterns) {
      if (pattern.test(content)) {
        result.errors.push("Content contains forbidden patterns")
      }
    }
  }
}

async function validateStandardResponse(
  content: string,
  result: ValidationResult,
  options: ValidationOptions,
): Promise<void> {
  // Check for basic sentence structure
  if (!content.includes(".") && !content.includes("!") && !content.includes("?")) {
    result.warnings.push("Response should contain proper sentence endings")
  }

  // Check for reasonable paragraph structure
  if (content.length > 500 && !content.includes("\n")) {
    result.suggestions?.push("Consider breaking long responses into paragraphs for better readability")
  }

  // Check for claims structure if it appears to be patent-related
  if (content.toLowerCase().includes("claim")) {
    const claimPattern = /\b\d+\.\s*[A-Z]/g
    const claims = content.match(claimPattern)

    if (claims && claims.length > 0) {
      // Validate claim numbering
      const claimNumbers = claims.map((claim) => Number.parseInt(claim.match(/\d+/)?.[0] || "0"))
      const expectedNumbers = Array.from({ length: claimNumbers.length }, (_, i) => i + 1)

      if (!claimNumbers.every((num, index) => num === expectedNumbers[index])) {
        result.warnings.push("Claim numbering appears to be inconsistent")
      }

      // Check for independent vs dependent claims
      const independentClaims = content.match(/\b\d+\.\s*A\s+/gi) || []
      const dependentClaims = content.match(/\b\d+\.\s*The\s+.*of\s+claim\s+\d+/gi) || []

      if (independentClaims.length === 0) {
        result.warnings.push("No independent claims detected")
      }

      if (dependentClaims.length === 0 && claims.length > 1) {
        result.warnings.push("Multiple claims detected but no dependent claim structure found")
      }
    }
  }
}

async function validateDiscretizationResponse(
  content: string,
  result: ValidationResult,
  options: ValidationOptions,
): Promise<void> {
  if (options.isOutput && options.fieldName) {
    // Validate individual output field

    // Check if it's a proper claim format for patent-related outputs
    if (options.fieldName.toLowerCase().includes("output") || options.fieldName.toLowerCase().includes("claim")) {
      // Should start with capital letter
      if (!/^[A-Z]/.test(content.trim())) {
        result.warnings.push("Output should start with a capital letter")
      }

      // Should end with proper punctuation
      if (!/[.!?]$/.test(content.trim())) {
        result.warnings.push("Output should end with proper punctuation")
      }

      // Check for dependent claim structure
      if (content.toLowerCase().includes("of claim")) {
        const claimRefPattern = /of\s+claim\s+\d+/i
        if (!claimRefPattern.test(content)) {
          result.warnings.push("Dependent claim reference format may be incorrect")
        }
      }
    }

    // Check for JSON-like structure if expected
    if (content.includes("{") || content.includes("}")) {
      try {
        // Try to validate JSON-like structure
        const jsonMatch = content.match(/\{[^}]+\}/g)
        if (jsonMatch) {
          for (const json of jsonMatch) {
            try {
              JSON.parse(json)
            } catch {
              result.warnings.push("JSON-like structure appears malformed")
            }
          }
        }
      } catch {
        // Not JSON, that's okay
      }
    }
  }
}

async function validateSingleListResponse(
  content: string,
  result: ValidationResult,
  options: ValidationOptions,
): Promise<void> {
  // Check for list-like structure
  const listPatterns = [
    /^\s*[-*•]\s+/gm, // Bullet points
    /^\s*\d+\.\s+/gm, // Numbered lists
    /^\s*[a-zA-Z]\.\s+/gm, // Lettered lists
  ]

  const hasListStructure = listPatterns.some((pattern) => pattern.test(content))

  if (!hasListStructure && content.includes("\n")) {
    result.suggestions?.push("Consider using bullet points or numbering for list items")
  }

  // Check for consistent formatting
  if (hasListStructure) {
    const lines = content.split("\n").filter((line) => line.trim())
    const formats = lines.map((line) => {
      if (/^\s*[-*•]\s+/.test(line)) return "bullet"
      if (/^\s*\d+\.\s+/.test(line)) return "number"
      if (/^\s*[a-zA-Z]\.\s+/.test(line)) return "letter"
      return "other"
    })

    const uniqueFormats = [...new Set(formats)]
    if (uniqueFormats.length > 1 && uniqueFormats.includes("other")) {
      result.warnings.push("List formatting appears inconsistent")
    }
  }
}

async function validateMultiListResponse(
  content: string,
  result: ValidationResult,
  options: ValidationOptions,
): Promise<void> {
  // Similar to single list but expect more complex structure
  await validateSingleListResponse(content, result, options)

  // Check for multi-dimensional data structure
  if (content.includes("[") && content.includes("]")) {
    result.suggestions?.push("Array-like structure detected - ensure proper formatting")
  }

  // Check for key-value pairs
  const keyValuePattern = /\w+\s*:\s*\w+/g
  const keyValuePairs = content.match(keyValuePattern)

  if (keyValuePairs && keyValuePairs.length > 0) {
    result.suggestions?.push("Key-value structure detected - consider consistent formatting")
  }
}

// Additional utility functions for specific validation scenarios
export function validateClaimStructure(content: string): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  }

  // Check for proper claim structure
  const claimPattern = /\b(\d+)\.\s*([A-Z].*?)(?=\b\d+\.\s*[A-Z]|$)/gs
  const claims = [...content.matchAll(claimPattern)]

  if (claims.length === 0) {
    result.warnings.push("No properly formatted claims detected")
    return result
  }

  // Validate claim numbering
  const claimNumbers = claims.map((match) => Number.parseInt(match[1]))
  for (let i = 0; i < claimNumbers.length; i++) {
    if (claimNumbers[i] !== i + 1) {
      result.errors.push(`Claim numbering error: expected ${i + 1}, found ${claimNumbers[i]}`)
    }
  }

  // Check for independent claims (should start with "A" or "An")
  const independentClaims = claims.filter((match) => /^(A|An)\s+/.test(match[2].trim()))
  if (independentClaims.length === 0) {
    result.warnings.push("No independent claims found")
  }

  // Check for dependent claims
  const dependentClaims = claims.filter((match) => /The\s+.*of\s+claim\s+\d+/.test(match[2]))
  if (dependentClaims.length > 0) {
    // Validate claim references
    dependentClaims.forEach((match) => {
      const refMatch = match[2].match(/of\s+claim\s+(\d+)/)
      if (refMatch) {
        const refNumber = Number.parseInt(refMatch[1])
        if (refNumber >= Number.parseInt(match[1])) {
          result.errors.push(`Claim ${match[1]} references claim ${refNumber}, which should be a lower number`)
        }
      }
    })
  }

  result.isValid = result.errors.length === 0
  return result
}

export function validateJSONStructure(content: string): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  }

  try {
    JSON.parse(content)
    result.suggestions?.push("Valid JSON structure detected")
  } catch (error) {
    // Try to find JSON-like patterns and validate them
    const jsonPattern = /\{[^{}]*\}/g
    const jsonMatches = content.match(jsonPattern)

    if (jsonMatches) {
      jsonMatches.forEach((match, index) => {
        try {
          JSON.parse(match)
        } catch {
          result.warnings.push(`JSON-like structure ${index + 1} appears malformed`)
        }
      })
    } else {
      result.warnings.push("Content doesn't appear to contain valid JSON structure")
    }
  }

  return result
}
