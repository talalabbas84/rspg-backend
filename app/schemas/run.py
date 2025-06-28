# (Content from previous response - unchanged and correct)
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.run import RunStatusEnum
from app.models.block import BlockTypeEnum # For snapshot

# --- BlockRun Schemas ---
class BlockRunBase(BaseModel):
    status: RunStatusEnum
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    prompt_text: Optional[str] = None
    llm_output_text: Optional[str] = None
    named_outputs_json: Optional[Dict[str, Any]] = None
    list_outputs_json: Optional[Dict[str, Any]] = None # e.g. {"values": [...]}
    matrix_outputs_json: Optional[Dict[str, Any]] = None # e.g. {"values": [[...]]}
    error_message: Optional[str] = None

class BlockRunCreate(BlockRunBase):
    run_id: int
    block_id: int # Link to the original block
    # Snapshots are set by the system during run creation
    block_name_snapshot: Optional[str] = None
    block_type_snapshot: Optional[BlockTypeEnum] = None


class BlockRunRead(BlockRunBase):
    id: int
    run_id: int
    block_id: Optional[int] = None # Original block might have been deleted
    block_name_snapshot: Optional[str] = None
    block_type_snapshot: Optional[BlockTypeEnum] = None
    created_at: datetime # From Base model
    # updated_at is also available from Base

    class Config:
        from_attributes = True

# --- Run Schemas ---
class RunBase(BaseModel):
    status: RunStatusEnum = RunStatusEnum.PENDING
    input_overrides_json: Optional[Dict[str, Any]] = Field(None, example={"customer_query": "My order is late."})
    llm_model_override: Optional[str] = Field(None, example="claude-3-haiku-20240307")
class RunCreate(BaseModel):
    sequence_id: int
    input_overrides_json: Optional[Dict[str, Any]] = Field(None, example={"customer_query": "My order is late."})
    llm_model_override: Optional[str] = Field(None, example="claude-3-haiku-20240307")


class RunUpdate(BaseModel): # For internal updates by the execution engine
    status: Optional[RunStatusEnum] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    results_summary_json: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None

class RunRead(RunBase):
    id: int
    sequence_id: int
    user_id: int
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    results_summary_json: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class RunReadWithDetails(RunRead):
    block_runs: List[BlockRunRead] = []
