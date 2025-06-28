export interface Sequence {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
  // Text processing settings
  chunk_size?: number
  preserve_sentences?: boolean
  loop_enabled?: boolean
}

export interface Block {
  id: string
  sequence_id: string
  name: string
  block_type: "standard" | "discretization" | "single_list" | "multi_list"
  order: number
  model: string
  prompt: string
  output_name: string
  config: BlockConfig
  created_at: string
  updated_at: string
  // Execution state
  last_run?: string
  status?: "idle" | "running" | "completed" | "failed"
}

export interface BlockConfig {
  // Discretization block config
  number_of_outputs?: number
  output_variable_names?: string[]

  // Single list block config
  input_list_name?: string

  // Multi list block config
  lists?: MultiListConfig[]

  // Text processing config
  chunk_size?: number
  preserve_sentences?: boolean
  loop_enabled?: boolean

  // General config
  store_in_global_list?: boolean
  global_list_name?: string

  // Advanced settings
  temperature?: number
  max_tokens?: number
  stop_sequences?: string[]
}

export interface MultiListConfig {
  id: string
  list_name: string
  priority: number
}

export interface Variable {
  id: string
  sequence_id?: string
  name: string
  value: string
  type: "global" | "list" | "output" | "input"
  description?: string
  created_at?: string
  updated_at?: string
  // Enhanced properties
  source_block_id?: string
  is_array?: boolean
  array_length?: number
  indexable?: boolean
}

export interface GlobalList {
  id: string
  name: string
  values: string[]
  description?: string
  created_at: string
  updated_at: string
  // Enhanced properties
  source_block_id?: string
  is_matrix?: boolean
  matrix_dimensions?: { rows: number; cols: number }
}

export interface Run {
  id: string
  sequence_id: string
  status: "pending" | "running" | "completed" | "failed"
  created_at: string
  updated_at: string
  // Enhanced execution tracking
  current_block_index?: number
  total_blocks?: number
  progress_percentage?: number
  error_message?: string
}

export interface BlockRun {
  id: string
  run_id: string
  block_id: string
  input: any
  output: any
  edited_output?: any
  status: "pending" | "running" | "completed" | "failed"
  created_at: string
  updated_at: string
  // Enhanced tracking
  execution_time_ms?: number
  token_usage?: { input: number; output: number }
  cost_estimate?: number
}

export interface BlockResponse {
  id: string
  blockId: string
  content: string
  outputs?: { [key: string]: string }
  matrix_output?: { [key: string]: { [key: string]: string } }
  editedAt?: string
  // Enhanced response data
  original_content?: string
  edit_history?: Array<{ timestamp: string; content: string; user?: string }>
  validation_status?: "valid" | "invalid" | "warning"
  validation_messages?: string[]
}

export type BlockType = "standard" | "discretization" | "single_list" | "multi_list"

export interface CreateBlockData {
  name: string
  block_type: BlockType
  model: string
  prompt: string
  output_name: string
  config: BlockConfig
}

export interface SequenceRun {
  id: string
  sequence_id: string
  status: "pending" | "running" | "completed" | "failed"
  current_block_index: number
  results: BlockResponse[]
  created_at: string
  updated_at: string
  // Enhanced execution data
  total_execution_time_ms?: number
  total_cost_estimate?: number
  total_tokens_used?: { input: number; output: number }
}

// New interfaces for enhanced features
export interface TextChunk {
  id: string
  content: string
  order: number
  sentence_complete: boolean
  word_count: number
}

export interface VariableReference {
  name: string
  type: "variable" | "list" | "matrix"
  index?: string | number
  matrix_coords?: { row: string | number; col: string | number }
  resolved_value?: string
}

export interface ValidationRule {
  id: string
  name: string
  description: string
  rule_type: "required_variable" | "output_format" | "length_limit" | "custom_regex"
  parameters: { [key: string]: any }
  severity: "error" | "warning" | "info"
}

export interface ExportData {
  sequence: Sequence
  blocks: Block[]
  variables: Variable[]
  global_lists: GlobalList[]
  validation_rules?: ValidationRule[]
  export_timestamp: string
  version: string
}
