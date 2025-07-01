# (Content from previous response - unchanged and correct)
from typing import Dict, List, Any
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.ext.asyncio import AsyncSession

from app import schemas, models
from app.crud import crud_block, crud_sequence
from app.api import deps
from app.db.session import get_db
from copy import deepcopy


router = APIRouter()

# Dependency to get and check ownership of the parent sequence
async def get_owned_sequence(
    sequence_id: int, # This will be a path parameter for list/create_in_sequence
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
) -> models.Sequence:
    sequence = await crud_sequence.sequence.get_by_id_and_owner(db, id=sequence_id, user_id=current_user.id)
    if not sequence:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sequence not found or not owned by user")
    return sequence

@router.post("/in_sequence/{sequence_id}", response_model=schemas.BlockRead, status_code=status.HTTP_201_CREATED)
async def create_block_in_sequence(
    *,
    sequence_id: int,
    block_in: schemas.BlockCreate = Body(...),
    owned_sequence: models.Sequence = Depends(get_owned_sequence),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Create a new block within a specific sequence.
    The sequence_id in block_in (body) must match path param.
    """

    if block_in.sequence_id != sequence_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Path sequence_id and body sequence_id mismatch.")

    # --- SINGLE_LIST special validation ---
    if block_in.type == BlockTypeEnum.SINGLE_LIST:
        config = block_in.config_json
        # Defensive: treat as missing if not set
        input_var = config.get("input_list_variable_name", "")
        if "," in input_var or "[" in input_var or "]" in input_var or isinstance(input_var, list):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="input_list_variable_name for SINGLE_LIST block must be a single variable name (e.g. 'countries'), not a list or CSV of values."
            )
    # --- MULTI_LIST validation (basic version) ---
    if block_in.type == BlockTypeEnum.MULTI_LIST:
        config = block_in.config_json
        if "input_lists_config" in config:
            for input_list_cfg in config["input_lists_config"]:
                input_var = input_list_cfg.get("name", "")
                if "," in input_var or "[" in input_var or "]" in input_var or isinstance(input_var, list):
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail="Each input_lists_config.name for MULTI_LIST must be a single variable name (not a list/CSV of values)."
                    )

    # Continue as normal
    block = await crud_block.block.create(db=db, obj_in=block_in)
    return block

@router.get("/in_sequence/{sequence_id}", response_model=List[schemas.BlockRead])
async def read_blocks_in_sequence(
    *,
    sequence_id: int,
    owned_sequence: models.Sequence = Depends(get_owned_sequence), # Verifies ownership
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 1000 # Usually fetch all blocks for a sequence
) -> Any:
    """
    Retrieve blocks for a specific sequence. Blocks are returned in their 'order'.
    """
    blocks = await crud_block.block.get_multi_by_sequence(db, sequence_id=owned_sequence.id, skip=skip, limit=limit)
    return blocks

@router.get("/{block_id}", response_model=schemas.BlockRead)
async def read_block(
    *,
    block_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get a specific block by ID. Verifies ownership via parent sequence.
    """
    db_block = await crud_block.block.get(db, id=block_id)
    if not db_block:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Block not found")
    
    # Verify ownership of the sequence this block belongs to
    _ = await get_owned_sequence(sequence_id=db_block.sequence_id, db=db, current_user=current_user)
    return db_block

@router.put("/{block_id}", response_model=schemas.BlockRead)
async def update_block(
    *,
    block_id: int,
    block_in: schemas.BlockUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Update a block. Verifies ownership.
    config_json validation is handled by crud_block.update.
    """
    db_block = await crud_block.block.get(db, id=block_id)
    if not db_block:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Block not found")
    
    _ = await get_owned_sequence(sequence_id=db_block.sequence_id, db=db, current_user=current_user)
    
    # ---- Ignore 'order' field if present ----
    block_in_data = block_in.dict(exclude_unset=True)  # Only fields that were sent
    block_in_data.pop('order', None)  # Remove order if present

    # Create a new BlockUpdate with the sanitized dict
    sanitized_block_in = schemas.BlockUpdate(**block_in_data)
    
    block = await crud_block.block.update(db, db_obj=db_block, obj_in=sanitized_block_in)
    return block

@router.delete("/{block_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_block(
    *,
    block_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
) -> None:
    """
    Delete a block. Verifies ownership.
    """
    db_block = await crud_block.block.get(db, id=block_id)
    if not db_block:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Block not found")
        
    _ = await get_owned_sequence(sequence_id=db_block.sequence_id, db=db, current_user=current_user)
        
    await crud_block.block.remove(db, id=block_id)
    return None


# api/api_v1/endpoints/block.py

from app.models.block import BlockTypeEnum
from app.services.execution_engine import execute_single_block, preview_prompt_for_block

@router.post("/{block_id}/run", response_model=schemas.BlockRunRead, status_code=status.HTTP_202_ACCEPTED)
async def run_single_block(
    *,
    block_id: int,
    input_overrides: dict = Body(default_factory=dict),
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
):
    """
    Execute a single block (for dev/test or manual override). Context must be supplied for any needed variables.
    """
    block = await crud_block.block.get(db, id=block_id)

    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    sequence = await crud_sequence.sequence.get(db, id=block.sequence_id)
    if not sequence or sequence.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    try:
        print(f"Running block {block_id} with input overrides: {input_overrides}")
        block_run = await execute_single_block(
            db=db,
            block=block,
            sequence=sequence,
            user_id=current_user.id,
            input_overrides=input_overrides
        )
        return block_run
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Block execution failed: {str(e)}")


# api/api_v1/endpoints/block.py

@router.post("/{block_id}/preview", response_model=Dict[str, Any])
async def preview_block_prompt(
    *,
    block_id: int,
    input_overrides: dict = Body(default_factory=dict),
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
):
    block = await crud_block.block.get(db, id=block_id)

    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    sequence = await crud_sequence.sequence.get(db, id=block.sequence_id)
    if not sequence or sequence.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    preview = await preview_prompt_for_block(
        db=db,
        sequence_id=sequence.id,
        block_id=block_id,
        user_id=current_user.id,
        input_overrides=input_overrides
    )
    return preview
