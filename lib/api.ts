const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1"

interface RequestOptions extends RequestInit {
  isFormData?: boolean
}

class ApiClient {
  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

    const headers: HeadersInit = options.isFormData
      ? {}
      : {
          "Content-Type": "application/json",
          ...options.headers,
        }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const config: RequestInit = {
      ...options,
      headers,
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch (e) {
          errorData = { detail: response.statusText }
        }
        console.error("API Error:", response.status, errorData)
        throw new Error(errorData.detail || `API Error: ${response.status}`)
      }

      if (response.status === 204) {
        // No Content
        return null as T
      }
      return response.json()
    } catch (error) {
      console.error("Network or parsing error:", error)
      throw error // Re-throw to be caught by calling function
    }
  }

  // --- Auth ---
  async register(data: any) {
    // Replace any with UserCreate schema
    return this.request<any>("/auth/register", { method: "POST", body: JSON.stringify(data) })
  }

  async login(data: any) {
    // Replace any with OAuth2PasswordRequestForm equivalent
    const formData = new URLSearchParams()
    formData.append("username", data.email)
    formData.append("password", data.password)
    return this.request<any>("/auth/login", {
      method: "POST",
      body: formData,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })
  }

  async getMe() {
    return this.request<any>("/auth/me") // Replace any with UserRead
  }

  // --- Sequences ---
  async getSequences(skip = 0, limit = 100) {
    return this.request<any[]>(`/sequences/?skip=${skip}&limit=${limit}`) // Replace any with SequenceRead
  }

  async getSequence(id: string | number) {
    return this.request<any>(`/sequences/${id}`) // SequenceRead
  }

  async createSequence(data: any) {
    // SequenceCreate
    return this.request<any>("/sequences/", { method: "POST", body: JSON.stringify(data) })
  }

  async updateSequence(id: string | number, data: any) {
    // SequenceUpdate
    return this.request<any>(`/sequences/${id}`, { method: "PUT", body: JSON.stringify(data) })
  }

  async deleteSequence(id: string | number) {
    return this.request<null>(`/sequences/${id}`, { method: "DELETE" })
  }

  // --- Blocks ---
  async getBlocksBySequence(sequenceId: string | number, skip = 0, limit = 1000) {
    return this.request<any[]>(`/blocks/by_sequence/${sequenceId}?skip=${skip}&limit=${limit}`) // BlockRead
  }

  async getBlock(id: string | number) {
    return this.request<any>(`/blocks/${id}`) // BlockRead
  }

  async createBlock(data: any) {
    // BlockCreate
    return this.request<any>("/blocks/", { method: "POST", body: JSON.stringify(data) })
  }

  async updateBlock(id: string | number, data: any) {
    // BlockUpdate
    return this.request<any>(`/blocks/${id}`, { method: "PUT", body: JSON.stringify(data) })
  }

  async deleteBlock(id: string | number) {
    return this.request<null>(`/blocks/${id}`, { method: "DELETE" })
  }

  // --- Variables ---
  async getVariablesBySequence(sequenceId: string | number) {
    return this.request<any[]>(`/variables/by_sequence/${sequenceId}`) // VariableRead
  }

  async createVariable(data: any) {
    // VariableCreate
    return this.request<any>("/variables/", { method: "POST", body: JSON.stringify(data) })
  }

  async updateVariable(id: string | number, data: any) {
    // VariableUpdate
    return this.request<any>(`/variables/${id}`, { method: "PUT", body: JSON.stringify(data) })
  }

  async deleteVariable(id: string | number) {
    return this.request<null>(`/variables/${id}`, { method: "DELETE" })
  }

  async getAvailableVariablesForSequence(sequenceId: string | number) {
    return this.request<any[]>(`/variables/available_for_sequence/${sequenceId}`) // AvailableVariable
  }

  // --- Global Lists ---
  async getGlobalLists(skip = 0, limit = 100) {
    return this.request<any[]>(`/global-lists/?skip=${skip}&limit=${limit}`) // GlobalListRead
  }

  async createGlobalList(data: any) {
    // GlobalListCreate
    return this.request<any>("/global-lists/", { method: "POST", body: JSON.stringify(data) })
  }

  async getGlobalList(id: string | number) {
    return this.request<any>(`/global-lists/${id}`)
  }

  async updateGlobalList(id: string | number, data: any) {
    // GlobalListUpdate
    return this.request<any>(`/global-lists/${id}`, { method: "PUT", body: JSON.stringify(data) })
  }

  async deleteGlobalList(id: string | number) {
    return this.request<null>(`/global-lists/${id}`, { method: "DELETE" })
  }

  // --- Runs ---
  async createRunForSequence(data: any) {
    // RunCreate (sequence_id, input_overrides_json)
    return this.request<any>("/runs/", { method: "POST", body: JSON.stringify(data) }) // RunRead
  }

  async getRunsBySequence(sequenceId: string | number, skip = 0, limit = 20) {
    return this.request<any[]>(`/runs/by_sequence/${sequenceId}?skip=${skip}&limit=${limit}`) // RunRead
  }

  async getRunDetails(runId: string | number) {
    return this.request<any>(`/runs/${runId}`) // RunRead
  }

  async getBlockRunDetails(blockRunId: string | number) {
    return this.request<any>(`/runs/block_run/${blockRunId}`) // BlockRunReadWithDetails
  }

  // --- Engine ---
  // The /engine/run_sequence is now effectively handled by POST /runs/ if execution is synchronous.
  // If you make it async, you'd poll GET /runs/{run_id} or use WebSockets.

  async previewPrompt(blockId: string | number, sequenceId: string | number, inputOverrides?: any) {
    return this.request<any>("/engine/preview_prompt/", {
      method: "POST",
      body: JSON.stringify({
        block_id: blockId,
        sequence_id: sequenceId, // Backend needs sequence_id for context
        input_overrides: inputOverrides || {},
      }),
    })
  }
}

export const apiClient = new ApiClient()
