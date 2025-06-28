# (Content from previous response - unchanged and correct)
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
# Forward references for nested schemas if needed, or import directly
# from .block import BlockRead
# from .variable import VariableRead

class SequenceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, example="Customer Support Email Categorizer")
    description: Optional[str] = Field(None, example="A sequence to categorize incoming support emails.")
    default_llm_model: Optional[str] = Field("claude-3-opus-20240229", example="claude-3-haiku-20240307")

class SequenceCreate(SequenceBase):
    pass # user_id will be injected from current_user

class SequenceUpdate(SequenceBase):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    default_llm_model: Optional[str] = None

class SequenceRead(SequenceBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    # To include related blocks and variables when reading a sequence:
    # blocks: List['BlockRead'] = [] # Requires BlockRead to be defined or forward referenced
    # variables: List['VariableRead'] = [] # Requires VariableRead to be defined or forward referenced

    class Config:
        from_attributes = True
