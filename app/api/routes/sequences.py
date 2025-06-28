# (Content from previous response - unchanged and correct)
from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app import schemas, models # Use __init__.py for easier imports
from app.crud import crud_sequence
from app.api import deps
from app.db.session import get_db

router = APIRouter()

@router.post("/", response_model=schemas.SequenceRead, status_code=status.HTTP_201_CREATED)
async def create_sequence(
    *,
    db: AsyncSession = Depends(get_db),
    sequence_in: schemas.SequenceCreate,
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Create new sequence for the current user.
    """
    sequence = await crud_sequence.sequence.create_with_owner(db=db, obj_in=sequence_in, user_id=current_user.id)
    return sequence

@router.get("/", response_model=List[schemas.SequenceRead])
async def read_sequences(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Retrieve sequences for the current user.
    """
    sequences = await crud_sequence.sequence.get_multi_by_owner(
        db, user_id=current_user.id, skip=skip, limit=limit
    )
    return sequences

@router.get("/{sequence_id}", response_model=schemas.SequenceRead)
async def read_sequence(
    *,
    db: AsyncSession = Depends(get_db),
    sequence_id: int,
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get sequence by ID.
    """
    sequence = await crud_sequence.sequence.get_by_id_and_owner(db, id=sequence_id, user_id=current_user.id)
    if not sequence:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sequence not found or not owned by user")
    return sequence

@router.put("/{sequence_id}", response_model=schemas.SequenceRead)
async def update_sequence(
    *,
    db: AsyncSession = Depends(get_db),
    sequence_id: int,
    sequence_in: schemas.SequenceUpdate,
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Update a sequence.
    """
    sequence = await crud_sequence.sequence.get_by_id_and_owner(db, id=sequence_id, user_id=current_user.id)
    if not sequence:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sequence not found or not owned by user")
    sequence = await crud_sequence.sequence.update(db, db_obj=sequence, obj_in=sequence_in)
    return sequence

@router.delete("/{sequence_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sequence(
    *,
    db: AsyncSession = Depends(get_db),
    sequence_id: int,
    current_user: models.User = Depends(deps.get_current_active_user)
) -> None:
    """
    Delete a sequence.
    """
    sequence = await crud_sequence.sequence.get_by_id_and_owner(db, id=sequence_id, user_id=current_user.id)
    if not sequence:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sequence not found or not owned by user")
    await crud_sequence.sequence.remove(db, id=sequence_id)
    return None # FastAPI handles 204 No Content response
