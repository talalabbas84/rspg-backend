# (Content from previous response - unchanged and correct)
from typing import List, Any, Dict
from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app import schemas, models
from app.crud import crud_block, crud_run, crud_sequence
from app.api import deps
from app.db.session import get_db
from app.schemas.run import BlockRunCreate
from app.services import execution_engine # For triggering execution
from sqlalchemy import select
from datetime import datetime, timezone

import json

# Defensive helper for auto-coercing a JSON string to dict (if needed)
def ensure_dict(val):
    if isinstance(val, str):
        try:
            return json.loads(val)
        except Exception:
            return {}
    return val if val is not None else {}


def make_naive(dt):
    return dt.replace(tzinfo=None) if dt.tzinfo else dt

router = APIRouter()

# api/api_v1/endpoints/runs.py

@router.post("/", response_model=schemas.RunReadWithDetails, status_code=status.HTTP_202_ACCEPTED)
async def create_run_for_sequence(
    *,
    db: AsyncSession = Depends(get_db),
    run_in: schemas.RunCreate,
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Create and start a new run for a sequence.
    """
    sequence = await crud_sequence.sequence.get_by_id_and_owner(db, id=run_in.sequence_id, user_id=current_user.id)
    if not sequence:
        raise HTTPException(status_code=404, detail="Sequence not found or not owned by user")

    # Save the context in DB field input_overrides_json, but expect input_overrides from API
    db_run = await crud_run.run.create_with_user_and_sequence(
        db=db,
        obj_in={
            **run_in.model_dump(),
            "input_overrides_json": run_in.input_overrides_json  # 👈 store in DB
        },
        user_id=current_user.id
    )
    print(run_in, 'run_in.input_overrides_json', run_in.input_overrides_json)  # Debugging line
    try:
        updated_run = await execution_engine.execute_sequence(
            db=db,
            run_id=db_run.id,
            sequence_id=sequence.id,
            user_id=current_user.id,
            input_overrides_json=run_in.input_overrides_json   # 👈 use the key FE sends
        )
        return updated_run

    except Exception as e:
        db_run.status = models.RunStatusEnum.FAILED
        db_run.error_message = f"Execution failed to start or complete: {str(e)}"
        db_run.completed_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(db_run)
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Catastrophic failure during sequence execution for run {db_run.id}: {e}", exc_info=True)
        failed_run_with_details = await crud_run.run.get_by_id_and_user(db, id=db_run.id, user_id=current_user.id)
        if failed_run_with_details:
            return failed_run_with_details
        raise HTTPException(status_code=500, detail=f"Sequence execution failed: {str(e)}")


@router.get("/for_sequence/{sequence_id}", response_model=List[schemas.RunRead]) # Use RunRead for list view
async def read_runs_for_sequence(
    *,
    sequence_id: int,
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Retrieve runs for a specific sequence owned by the current user.
    """
    # First, verify ownership of the sequence
    sequence = await crud_sequence.sequence.get_by_id_and_owner(db, id=sequence_id, user_id=current_user.id)
    if not sequence:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sequence not found or not owned by user")

    runs = await crud_run.run.get_multi_by_sequence_and_user(
        db, sequence_id=sequence_id, user_id=current_user.id, skip=skip, limit=limit
    )
    return runs

@router.get("/{run_id}", response_model=schemas.RunReadWithDetails)
async def read_run_details(
    *,
    run_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get details of a specific run, including its block runs.
    """
    run = await crud_run.run.get_by_id_and_user(db, id=run_id, user_id=current_user.id)
    if not run:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Run not found or not owned by user")
    return run

from datetime import datetime, timezone # Ensure this is imported



# api/api_v1/endpoints/runs.py

from sqlalchemy import select

@router.post("/{run_id}/rerun_from_block/{block_id}", response_model=schemas.RunReadWithDetails)
async def rerun_from_block(
    *,
    run_id: int,
    block_id: int,
    input_overrides: dict = Body(default_factory=dict),
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Rerun all blocks from block_id onward in the context of an existing run.
    Includes any manual edits made to previous block outputs.
    The returned run's .block_runs includes previous (edited) blocks as well.
    """
    run = await crud_run.run.get_by_id_and_user(db, id=run_id, user_id=current_user.id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found or not owned by user")
    sequence = await crud_sequence.sequence.get_by_id_and_owner(db, id=run.sequence_id, user_id=current_user.id)
    if not sequence:
        raise HTTPException(status_code=404, detail="Sequence not found or not owned by user")

    # Get blocks in sequence, ordered
    blocks = await crud_block.block.get_multi_by_sequence(db, sequence_id=sequence.id)
    block_index = next((i for i, b in enumerate(blocks) if b.id == block_id), None)
    if block_index is None:
        raise HTTPException(status_code=404, detail="Block not found in sequence")

    # --- KEY: Get latest block_runs from DB (ordered) for this run ---
    previous_block_runs = (
        await db.execute(
            select(models.BlockRun)
            .where(models.BlockRun.run_id == run.id)
            .order_by(models.BlockRun.started_at)
        )
    ).scalars().all()
    prev_block_runs = previous_block_runs[:block_index] if block_index > 0 else []

    # Build context up to block X-1 using latest edits
    context = run.input_overrides_json or {}
    for block_run in prev_block_runs:
        if block_run.named_outputs_json:
            context.update(block_run.named_outputs_json)
        if block_run.list_outputs_json:
            context[block_run.list_outputs_json["name"]] = block_run.list_outputs_json["values"]
        if block_run.matrix_outputs_json:
            context[block_run.matrix_outputs_json["name"]] = block_run.matrix_outputs_json["values"]
    context.update(input_overrides)

    # Create a new run object for rerun
    from app.schemas.run import RunCreate
    new_run_in = RunCreate(sequence_id=sequence.id, input_overrides_json=context)
    new_run = await crud_run.run.create_with_user_and_sequence(db=db, obj_in=new_run_in, user_id=current_user.id)

    # Execute only blocks from block_index onward
    for block in blocks[block_index:]:
        block_run_schema = BlockRunCreate(
            run_id=new_run.id, block_id=block.id, status=models.RunStatusEnum.RUNNING,
            block_name_snapshot=block.name, block_type_snapshot=block.type
        )
        db_block_run = models.BlockRun(**block_run_schema.model_dump())
        db_block_run.started_at = datetime.now(timezone.utc)
        db.add(db_block_run)
        await db.flush()
        (block_output_data, rendered_prompt, llm_raw_output,
         named_outputs_db, list_outputs_db, matrix_outputs_db, error_message) = await execution_engine._execute_single_block_logic(
            db, block, context, sequence.default_llm_model
        )
        db_block_run.prompt_text = rendered_prompt
        db_block_run.llm_output_text = llm_raw_output
        db_block_run.named_outputs_json = named_outputs_db
        db_block_run.list_outputs_json = list_outputs_db
        db_block_run.matrix_outputs_json = matrix_outputs_db
        db_block_run.completed_at = datetime.now(timezone.utc)
        db_block_run.status = models.RunStatusEnum.FAILED if error_message else models.RunStatusEnum.COMPLETED
        if error_message:
            db_block_run.error_message = error_message
            break
        context.update(block_output_data)
        await db.flush()
    new_run.status = models.RunStatusEnum.COMPLETED
    new_run.completed_at = datetime.now(timezone.utc)
    db.add(new_run)
    await db.commit()
    await db.refresh(new_run)

    # --- Fetch the detailed run (with block_runs of new run) ---
    run_with_details = await crud_run.run.get_by_id_and_user(db, id=new_run.id, user_id=current_user.id)

    # --- PATCH: Prepend the previous (edited) block_runs up to X-1 for full chain in UI ---
    # Use the latest versions as fetched above!
    if hasattr(run_with_details, "block_runs") and isinstance(run_with_details.block_runs, list):
        run_with_details.block_runs = list(prev_block_runs) + list(run_with_details.block_runs)

    return run_with_details


# api/api_v1/endpoints/runs.py

@router.post("/{run_id}/block/{block_run_id}/edit_output", response_model=schemas.BlockRunRead)
async def edit_block_run_output(
    *,
    run_id: int,
    block_run_id: int,
    new_output: dict = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
):
    # Get parent run and block run
    run = await crud_run.run.get_by_id_and_user(db, id=run_id, user_id=current_user.id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found or not owned by user")
    block_run = next((br for br in run.block_runs if br.id == block_run_id), None)
    if not block_run:
        raise HTTPException(status_code=404, detail="Block run not found")

    block = await crud_block.block.get(db, id=block_run.block_id)

    # --- Determine what was edited ---
    # If user provides named_outputs_json, update all keys there
    if "named_outputs_json" in new_output and isinstance(new_output["named_outputs_json"], dict):
        block_run.named_outputs_json = new_output["named_outputs_json"]
        # For llm_output_text, you can join all the values or pick the first one (choose your convention)
        block_run.llm_output_text = "\n".join(str(v) for v in new_output["named_outputs_json"].values())
    elif "llm_output_text" in new_output and new_output["llm_output_text"] is not None:
        # Try to pick variable name(s) from config
        output_var_names = []
        if "output_variable_names" in block.config_json:  # e.g. discretization
            output_var_names = block.config_json["output_variable_names"]
        elif "output_variable_name" in block.config_json:
            output_var_names = [block.config_json["output_variable_name"]]
        elif "output_variable" in block.config_json:
            output_var_names = [block.config_json["output_variable"]]
        else:
            output_var_names = ["paraphrased"]

        # For single variable, store as {name: value}
        if len(output_var_names) == 1:
            block_run.named_outputs_json = {output_var_names[0]: new_output["llm_output_text"]}
        elif len(output_var_names) > 1:
            # You may want to set only the first, or require named_outputs_json for multi-output blocks
            block_run.named_outputs_json = {output_var_names[0]: new_output["llm_output_text"]}
        block_run.llm_output_text = new_output["llm_output_text"]
    else:
        # Fallback: keep existing
        pass

    block_run.list_outputs_json = new_output.get("list_outputs_json", block_run.list_outputs_json)
    block_run.matrix_outputs_json = new_output.get("matrix_outputs_json", block_run.matrix_outputs_json)
    block_run.updated_at = make_naive(datetime.now(timezone.utc))
    await db.commit()
    await db.refresh(block_run)

    # ---- RECOMPUTE PARENT RUN SUMMARY (results_summary_json) ----
    block_runs = (await db.execute(
        select(models.BlockRun).where(models.BlockRun.run_id == run_id)
    )).scalars().all()

    summary = {}
    for br in block_runs:
        if br.named_outputs_json:
            summary[f"block_{br.block_id}_{br.block_name_snapshot}"] = br.named_outputs_json
        if br.list_outputs_json:
            summary[f"block_{br.block_id}_{br.block_name_snapshot}"] = br.list_outputs_json
        if br.matrix_outputs_json:
            summary[f"block_{br.block_id}_{br.block_name_snapshot}"] = br.matrix_outputs_json
    run.results_summary_json = summary
    await db.commit()
    await db.refresh(run)

    return block_run
