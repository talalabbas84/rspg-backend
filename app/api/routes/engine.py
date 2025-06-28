# (Content from previous response - unchanged and correct)
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any

from app.api import deps
from app import models
from app.crud import crud_sequence # For ownership check
from app.db.session import get_db
from app.services import execution_engine
from app.schemas.engine import PreviewPromptRequest # Define this schema

router = APIRouter()

# Define PreviewPromptRequest in app/schemas/engine.py or here if simple
# For now, assuming it's defined in schemas.engine
# from pydantic import BaseModel
# class PreviewPromptRequest(BaseModel):
#     sequence_id: int
#     block_id: int
#     input_overrides: Dict[str, Any] | None = None


@router.post("/preview_prompt", response_model=Dict[str, Any])
async def preview_block_prompt(
    *,
    request_data: PreviewPromptRequest = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
):
    """
    Generate a preview of the prompt for a specific block within a sequence.
    This simulates the context up to that block.
    """
    # Verify user owns the sequence
    sequence = await crud_sequence.sequence.get_by_id_and_owner(db, id=request_data.sequence_id, user_id=current_user.id)
    if not sequence:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sequence not found or not owned by user")

    try:
        preview_data = await execution_engine.preview_prompt_for_block(
            db=db,
            sequence_id=request_data.sequence_id,
            block_id=request_data.block_id,
            user_id=current_user.id,
            input_overrides=request_data.input_overrides
        )
        return preview_data
    except ValueError as ve: # Catch specific errors from the service like "Block not found"
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        # Log the error for server-side debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error generating prompt preview for block {request_data.block_id} in sequence {request_data.sequence_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to generate prompt preview.")

# Schema definition for PreviewPromptRequest (if not in a separate schemas/engine.py)
# This should ideally be in app/schemas/engine.py and imported.
# For completeness if it's missing:
# from pydantic import BaseModel
# class PreviewPromptRequest(BaseModel):
#     sequence_id: int
#     block_id: int
#     input_overrides: Dict[str, Any] | None = None
# Make sure to create app/schemas/engine.py with this content if it doesn't exist.
# For this response, I'll assume it's correctly placed and imported.
