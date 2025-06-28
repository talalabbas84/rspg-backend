# app/schemas/engine.py
from pydantic import BaseModel
from typing import Dict, Any, Optional

class PreviewPromptRequest(BaseModel):
    sequence_id: int
    block_id: int
    input_overrides: Optional[Dict[str, Any]] = None
