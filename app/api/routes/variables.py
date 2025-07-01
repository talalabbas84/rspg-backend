from typing import List, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.ext.asyncio import AsyncSession

from app import schemas, models
from app.crud import crud_variable, crud_sequence, crud_block, crud_global_list
from app.api import deps
from app.db.session import get_db
from .blocks import get_owned_sequence

router = APIRouter()

# --- New: Create user-global variable ---
@router.post("/user_global/", response_model=schemas.VariableRead, status_code=status.HTTP_201_CREATED)
async def create_user_global_variable(
    variable_in: schemas.VariableCreate = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Create a new GLOBAL variable for the user (not tied to a sequence).
    """
    if variable_in.sequence_id is not None:
        raise HTTPException(status_code=400, detail="For global variable, sequence_id must be null")

    # Enforce unique name per user for globals
    existing = await crud_variable.variable.get_by_name_and_user(db, name=variable_in.name, user_id=current_user.id)
    if existing:
        raise HTTPException(status_code=400, detail=f"User-global variable '{variable_in.name}' already exists.")

    variable = await crud_variable.variable.create_with_owner(db=db, obj_in=variable_in, user_id=current_user.id)
    return variable



@router.get("/user_global/", response_model=List[schemas.VariableRead])
async def read_user_global_variables(
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    """
    List all user-global variables for current user.
    """
    print("Fetching user-global variables for user:", current_user.id)
    variables = await crud_variable.variable.get_multi_by_user(db, user_id=current_user.id)
    return [v for v in variables if v.sequence_id is None]

# --- Existing: Sequence Variable routes ---

@router.post("/in_sequence/{sequence_id}", response_model=schemas.VariableRead, status_code=status.HTTP_201_CREATED)
async def create_variable_in_sequence(
    *,
    sequence_id: int,
    variable_in: schemas.VariableCreate = Body(...),
    owned_sequence: models.Sequence = Depends(get_owned_sequence),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Create a new variable (GLOBAL or INPUT type) for a specific sequence.
    """
    if variable_in.sequence_id != sequence_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Path sequence_id and body sequence_id mismatch.")

    existing_variable = await crud_variable.variable.get_by_name_and_sequence(db, name=variable_in.name, sequence_id=owned_sequence.id)
    if existing_variable:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Variable with name '{variable_in.name}' already exists in this sequence.")

    variable = await crud_variable.variable.create(db=db, obj_in=variable_in)
    return variable

@router.get("/in_sequence/{sequence_id}", response_model=List[schemas.VariableRead])
async def read_variables_in_sequence(
    *,
    sequence_id: int,
    owned_sequence: models.Sequence = Depends(get_owned_sequence),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Retrieve variables for a specific sequence.
    """
    variables = await crud_variable.variable.get_multi_by_sequence(db, sequence_id=owned_sequence.id)
    return variables

@router.get("/{variable_id}", response_model=schemas.VariableRead)
async def read_variable(
    *,
    variable_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get a specific variable by ID. Verifies ownership via parent sequence or user.
    """
    db_variable = await crud_variable.variable.get(db, id=variable_id)
    if not db_variable:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variable not found")
    # If sequence_id is not None, check sequence ownership
    if db_variable.sequence_id is not None:
        _ = await get_owned_sequence(sequence_id=db_variable.sequence_id, db=db, current_user=current_user)
    else:
        # Must be a user-global variable; check user ownership
        if db_variable.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this variable")
    return db_variable

@router.put("/{variable_id}", response_model=schemas.VariableRead)
async def update_variable(
    *,
    variable_id: int,
    variable_in: schemas.VariableUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Update a variable. Verifies ownership.
    """
    db_variable = await crud_variable.variable.get(db, id=variable_id)
    if not db_variable:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variable not found")

    # Ownership check
    if db_variable.sequence_id is not None:
        owned_sequence = await get_owned_sequence(sequence_id=db_variable.sequence_id, db=db, current_user=current_user)
        # Check for name clash in same sequence
        if variable_in.name and variable_in.name != db_variable.name:
            existing_variable = await crud_variable.variable.get_by_name_and_sequence(db, name=variable_in.name, sequence_id=owned_sequence.id)
            if existing_variable:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Variable name '{variable_in.name}' already exists in this sequence.")
    else:
        if db_variable.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to update this variable")
        # Check for name clash in global variables
        if variable_in.name and variable_in.name != db_variable.name:
            existing = await crud_variable.variable.get_by_name_and_user(db, name=variable_in.name, user_id=current_user.id)
            if existing:
                raise HTTPException(status_code=400, detail=f"User-global variable '{variable_in.name}' already exists.")

    variable = await crud_variable.variable.update(db, db_obj=db_variable, obj_in=variable_in)
    return variable

@router.delete("/{variable_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_variable(
    *,
    variable_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
) -> None:
    """
    Delete a variable. Verifies ownership.
    """
    db_variable = await crud_variable.variable.get(db, id=variable_id)
    if not db_variable:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variable not found")
    if db_variable.sequence_id is not None:
        _ = await get_owned_sequence(sequence_id=db_variable.sequence_id, db=db, current_user=current_user)
    else:
        if db_variable.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this variable")
    await crud_variable.variable.remove(db, id=variable_id)
    return None

@router.get("/available_for_sequence/{sequence_id}", response_model=List[schemas.AvailableVariable])
async def list_available_variables_for_sequence(
    *,
    sequence_id: int,
    owned_sequence: models.Sequence = Depends(get_owned_sequence),
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    """
    List all variables available for use in a sequence's prompts.
    Now only includes: sequence vars, user global vars, user global lists.
    """
    available_vars_dict: Dict[str, dict] = {}

    # 1. Sequence-defined variables (GLOBAL and INPUT)
    seq_vars = await crud_variable.variable.get_multi_by_sequence(db, sequence_id=owned_sequence.id)
    for var in seq_vars:
        val = None
        if var.type.value == "global":
            val = var.value_json.get("value") if var.value_json else None
        elif var.type.value == "input":
            val = var.value_json.get("default") if var.value_json else None
        available_vars_dict[var.name] = {
            "name": var.name,
            "type": var.type.value,
            "source": f"Sequence Defined ({var.type.value.capitalize()})",
            "description": var.description,
            "value": val
        }

    # 2. User's Global Lists
    user_global_lists = await crud_global_list.global_list.get_multi_by_owner(db, user_id=current_user.id)
    for glist in user_global_lists:
        val = [item.value for item in glist.items] if glist.items else []
        if glist.name not in available_vars_dict:
            available_vars_dict[glist.name] = {
                "name": glist.name,
                "type": "global_list",
                "source": "User Global List",
                "description": glist.description,
                "value": val
            }

    # 3. User's global variables (no sequence)
    user_global_vars = await crud_variable.variable.get_multi_by_user(db, user_id=current_user.id)
    for v in user_global_vars:
        if v.sequence_id is None and v.name not in available_vars_dict:
            val = v.value_json.get("value") if v.value_json else None
            available_vars_dict[v.name] = {
                "name": v.name,
                "type": "global",
                "source": "User Global Variable",
                "description": v.description,
                "value": val
            }

    # Removed block output code!

    return list(available_vars_dict.values())
