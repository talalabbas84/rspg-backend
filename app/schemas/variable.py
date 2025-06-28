from pydantic import BaseModel, Field
from typing import Optional, Any, List, Dict
from datetime import datetime
from app.models.variable import VariableTypeEnum

# --- Base ---

class VariableBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, pattern=r"^[a-zA-Z_][a-zA-Z0-9_]*$", example="customer_email")
    type: VariableTypeEnum
    value_json: Optional[Dict[str, Any]] = Field(
        None, example={"value": "example@example.com"}
    )  # e.g., {"default": "Default Name", "type_hint": "string"}
    description: Optional[str] = Field(None, example="The email address of the customer.")

# --- Create ---

class VariableCreate(VariableBase):
    # user_id REMOVED
    sequence_id: Optional[int] = None

# --- Update ---

class VariableUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255, pattern=r"^[a-zA-Z_][a-zA-Z0-9_]*$")
    type: Optional[VariableTypeEnum] = None
    value_json: Optional[Dict[str, Any]] = None
    description: Optional[str] = None
    # user_id REMOVED
    sequence_id: Optional[int] = None

# --- Read ---

class VariableRead(VariableBase):
    id: int
    user_id: int
    sequence_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Available Variable for Autocompletion, etc. ---

class AvailableVariable(BaseModel):
    name: str
    type: str  # "global", "input", "block_output", "list_output", "matrix_output", "global_list"
    source: str  # e.g., "Sequence Defined (Global)", "Block: Summarize Email", "User Global List"
    description: Optional[str] = None
    value: Any = None
    # Optionally: add example_value or schema for complex types
