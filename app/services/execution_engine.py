# (Content from previous response - unchanged and correct)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app import models
from app.crud import crud_block, crud_variable, crud_run, crud_global_list, crud_sequence
from app.models.run import Run, RunStatusEnum
from app.models.variable import VariableTypeEnum
from app.services.llm_interface import call_claude_api
from app.services.prompt_utils import render_prompt, discretize_output
from app.schemas.run import BlockRunCreate
from app.schemas.block import (
    BlockConfigStandard, BlockConfigDiscretization, 
    BlockConfigSingleList, BlockConfigMultiList, BlockConfigMultiListInputItem
)
import json
from datetime import datetime, timezone
import logging
from typing import Dict, Any, Tuple, List, Optional, Union
from app.crud.crud_variable import variable


logger = logging.getLogger(__name__)

import re
def get_context_value(context, name):
    # Try exact match, normalized, and lowercased, and finally scan all keys for a case-insensitive match.
    norm_name = _normalize_key(name)
    for try_key in [
        name,
        norm_name,
        name.strip(),
        norm_name.strip(),
        name.lower(),
        norm_name.lower()
    ]:
        if try_key in context:
            return context[try_key]
    # Fallback: scan all keys for best-effort match (case-insensitive)
    for k, v in context.items():
        if k.lower() == name.lower() or k.lower() == norm_name.lower():
            return v
    return None


def _normalize_key(key: str) -> str:
    """Convert key to snake_case, remove special chars, lower."""
    # normalize to snake_case, remove special characters, and replace spaces with underscores
    key = key.strip().lower()
    # Replace spaces with underscores, remove non-alphanumeric characters except underscores
    # and ensure no double underscores
    # Also remove leading/trailing underscores
    # This regex replaces any sequence of non-alphanumeric characters with a single underscore
    # and then replaces multiple underscores with a single underscore
    # Finally, it strips leading/trailing underscores
    # and replaces spaces with underscores
    # This ensures keys are safe for use in Python variable names or JSON keys
    key = re.sub(r'\s+', '_', key)  # Replace spaces with underscores
    key = re.sub(r'[^a-zA-Z0-9_]', '_', key)  # Remove non-alphanumeric characters except underscores
    key = re.sub(r'_+', '_', key)  # Replace multiple underscores with a single underscore
    key = key.strip('_')  # Remove leading/trailing underscores
    # Ensure it starts with a letter or underscore (Python variable name rules)
    if key and not key[0].isalpha() and key[0] != '_':
        key = '_' + key  # Prepend underscore if it starts with a digit
    # Final normalization: ensure no leading/trailing underscores and no spaces
    key = key.replace(' ', '_')  # Replace any remaining spaces with underscores
    # Final cleanup: ensure no leading/trailing underscores and no double underscores
    key = key.strip('_').replace('__', '_')  # Remove leading/trailing underscores
    
    return re.sub(r'[^a-zA-Z0-9_]', '_', key).replace('__', '_').strip('_').replace(' ', '_')

async def _gather_sequence_context(
    db: AsyncSession, sequence_id: int, user_id: int, input_overrides: Dict[str, Any] = None
) -> Dict[str, Any]:
    context = {}
    db_vars = await crud_variable.variable.get_multi_by_sequence(db, sequence_id=sequence_id)
    for var_model in db_vars:
        val = var_model.value_json.get("value") if var_model.type == models.VariableTypeEnum.GLOBAL else \
              var_model.value_json.get("default") if var_model.type == models.VariableTypeEnum.INPUT else None
        # Add both raw and normalized keys
        context[var_model.name] = val
        context[_normalize_key(var_model.name)] = val

    # Global lists
    global_lists_models = await crud_global_list.global_list.get_multi_by_owner(db, user_id=user_id, limit=1000)
    for glist_model in global_lists_models:
        list_val = [item.value for item in glist_model.items]
        context[glist_model.name] = list_val
        context[_normalize_key(glist_model.name)] = list_val

    # Input overrides
    if input_overrides:
        for key, value in input_overrides.items():
            context[key] = value
            context[_normalize_key(key)] = value

    # Ensure all defined INPUT vars are present
    for var_model in db_vars:
        if var_model.type == models.VariableTypeEnum.INPUT:
            for key in [var_model.name, _normalize_key(var_model.name)]:
                if key not in context:
                    context[key] = None

    logger.debug(f"Initial context for sequence {sequence_id} (user {user_id}): "
                 f"{ {k: (str(v)[:50] + '...' if isinstance(v, str) and len(v) > 50 else v) for k,v in context.items()} }")
    return context


async def _execute_single_block_logic(
    db: AsyncSession,
    block: models.Block,
    current_context: Dict[str, Any],
    sequence_default_llm_model: str 
) -> Tuple[Dict[str, Any], str, str, Dict[str, Any] | None, Dict[str, Any] | None, Dict[str, Any] | None, str | None]:

    block_config_dict = block.config_json
    prompt_template = block_config_dict.get("prompt", "")
    effective_model = block.llm_model_override or sequence_default_llm_model

    output_data_for_context: Dict[str, Any] = {}
    rendered_prompt_text = ""
    llm_raw_output_text = ""
    named_outputs_json_for_db = None
    list_outputs_json_for_db = None
    matrix_outputs_json_for_db = None
    error_message_str = None

    try:
        if block.type == models.BlockTypeEnum.STANDARD:
            config = BlockConfigStandard(**block_config_dict)
            print(config.prompt, current_context, 'checkkkk thissssss')  # Debug: print the prompt template
            rendered_prompt_text = render_prompt(config.prompt, current_context)
            llm_raw_output_text = await call_claude_api(rendered_prompt_text, model=effective_model)
            output_data_for_context[config.output_variable_name] = llm_raw_output_text
            named_outputs_json_for_db = {config.output_variable_name: llm_raw_output_text}

        elif block.type == models.BlockTypeEnum.DISCRETIZATION:
            config = BlockConfigDiscretization(**block_config_dict)
            rendered_prompt_text = render_prompt(config.prompt, current_context)
            llm_raw_output_text = await call_claude_api(rendered_prompt_text, model=effective_model)
            named_outputs = discretize_output(llm_raw_output_text, config.output_names)
            output_data_for_context.update(named_outputs)
            named_outputs_json_for_db = named_outputs
        
        elif block.type == models.BlockTypeEnum.SINGLE_LIST:
            config = BlockConfigSingleList(**block_config_dict)
            # Add a fallback to try all context keys for lists
            input_list = get_context_value(current_context, config.input_list_variable_name)
            if not isinstance(input_list, list):
                # Fallback: find any context value that is a list with 3 strings, and log the candidates.
                list_candidates = {k: v for k, v in current_context.items() if isinstance(v, list)}
                print("DEBUG list_candidates:", list_candidates)
                # If only one candidate, pick it
                if len(list_candidates) == 1:
                    input_list = list(list_candidates.values())[0]
                else:
                    input_list = None

            if not isinstance(input_list, list):
                raise ValueError(
                    f"Input '{config.input_list_variable_name}' for Single List block is not a list or not found. "
                    f"Available keys: {list(current_context.keys())}. "
                    f"Found value: {input_list} (type: {type(input_list)})"
                )

            if not isinstance(input_list, list):
                raise ValueError(f"Input '{config.input_list_variable_name}' for Single List block is not a list or not found. Found type: {type(input_list)}.")
            print(f"Input list for block {block.id} ('{block.name}'): {input_list}")  # Debug: print input list
            print("config", config)  # Debug: print block config
            
            item_results = []
            rendered_prompt_text = f"Single List Block. Template: {config.prompt[:100]}... on list '{config.input_list_variable_name}' ({len(input_list)} items)."
            
            for idx, item_value in enumerate(input_list):
                item_context = {**current_context, "item": item_value, "item_index": idx}
                item_prompt = render_prompt(config.prompt, item_context)
                item_llm_output = await call_claude_api(item_prompt, model=effective_model)
                item_results.append(item_llm_output)
            
            output_data_for_context[config.output_list_variable_name] = item_results
            llm_raw_output_text = json.dumps(item_results)
            list_outputs_json_for_db = {"name": config.output_list_variable_name, "values": item_results}

        elif block.type == models.BlockTypeEnum.MULTI_LIST:
            config = BlockConfigMultiList(**block_config_dict)
            if not config.input_lists_config or len(config.input_lists_config) < 1: # Typically 2 for matrix
                raise ValueError("Multi-List block requires at least one input list configuration, typically two for matrix.")

            # Simplified: uses first two lists for matrix-style iteration.
            # A more complex engine would use priorities from BlockConfigMultiListInputItem.
            list1_config = config.input_lists_config[0]
            list1_data = current_context.get(list1_config.name)
            if not isinstance(list1_data, list):
                raise ValueError(f"Input list '{list1_config.name}' not found or not a list.")

            matrix_results: Union[List[List[str]], List[str]]
            rendered_prompt_text = f"Multi List Block. Template: {config.prompt[:100]}..."

            if len(config.input_lists_config) >= 2:
                list2_config = config.input_lists_config[1]
                list2_data = current_context.get(list2_config.name)
                if not isinstance(list2_data, list):
                    raise ValueError(f"Input list '{list2_config.name}' not found or not a list.")
                
                temp_matrix_results = []
                for idx1, item1_val in enumerate(list1_data):
                    row_results = []
                    for idx2, item2_val in enumerate(list2_data):
                        item_context = {
                            **current_context,
                            "item1": item1_val, # Generic name for first list item
                            "item1_name": list1_config.name, # Name of the list itself
                            "item1_index": idx1,
                            "item2": item2_val, # Generic name for second list item
                            "item2_name": list2_config.name,
                            "item2_index": idx2,
                        }
                        item_prompt = render_prompt(config.prompt, item_context)
                        item_llm_output = await call_claude_api(item_prompt, model=effective_model)
                        row_results.append(item_llm_output)
                    temp_matrix_results.append(row_results)
                matrix_results = temp_matrix_results
            else: # Only one list configured, treat as single list iteration
                temp_list_results = []
                for idx, item_val in enumerate(list1_data):
                    item_context = {**current_context, "item1": item_val, "item1_name": list1_config.name, "item1_index": idx}
                    item_prompt = render_prompt(config.prompt, item_context)
                    item_llm_output = await call_claude_api(item_prompt, model=effective_model)
                    temp_list_results.append(item_llm_output)
                matrix_results = [temp_list_results] # Output is a list containing one list of results

            output_data_for_context[config.output_matrix_variable_name] = matrix_results
            llm_raw_output_text = json.dumps(matrix_results)
            matrix_outputs_json_for_db = {"name": config.output_matrix_variable_name, "values": matrix_results}
        else:
            raise NotImplementedError(f"Block type '{block.type}' execution not implemented.")

    except ValueError as ve:
        logger.error(f"Configuration or rendering error in block {block.id} ('{block.name}'): {ve}", exc_info=False) # Keep log cleaner
        error_message_str = str(ve)
    except Exception as e:
        logger.error(f"Unexpected error executing block {block.id} ('{block.name}'): {e}", exc_info=True)
        error_message_str = f"Unexpected error: {str(e)}"

    return output_data_for_context, rendered_prompt_text, llm_raw_output_text, \
           named_outputs_json_for_db, list_outputs_json_for_db, matrix_outputs_json_for_db, \
           error_message_str

async def execute_sequence(
    db: AsyncSession, run_id: int, sequence_id: int, user_id: int,
    input_overrides_json: Dict[str, Any] = None
) -> models.Run:
    run_obj = await crud_run.run.get(db, id=run_id)
    sequence_obj = await crud_sequence.sequence.get(db, id=sequence_id) # Fetch sequence for default_llm_model

    if not run_obj or run_obj.sequence_id != sequence_id or run_obj.user_id != user_id:
        raise ValueError("Run not found or access denied.")
    if not sequence_obj:
        raise ValueError("Sequence not found.")
    
    print("input_overrides_json in execute_sequence:", input_overrides_json)  # Debug: print input overrides

    run_obj.status = models.RunStatusEnum.RUNNING
    run_obj.started_at = datetime.now(timezone.utc)
    run_obj.input_overrides_json = input_overrides_json
    db.add(run_obj)
    # No commit yet, will commit after all block runs or on failure

    current_context = await _gather_sequence_context(db, sequence_id, user_id, input_overrides_json)
    sequence_default_llm_model = run_obj.llm_model_override or sequence_obj.default_llm_model or "claude-3-opus-20240229"


    blocks = await crud_block.block.get_multi_by_sequence(db, sequence_id=sequence_id)
    if not blocks:
        run_obj.status = models.RunStatusEnum.COMPLETED # Or FAILED if no blocks is an error
        run_obj.completed_at = datetime.now(timezone.utc)
        run_obj.error_message = "Sequence has no blocks to execute."
        db.add(run_obj)
        await db.commit()
        await db.refresh(run_obj)
        return run_obj

    overall_success = True
    final_outputs_summary = {}

    for block in blocks:
        block_run_create_schema = BlockRunCreate(
            run_id=run_obj.id, block_id=block.id, status=models.RunStatusEnum.RUNNING,
            block_name_snapshot=block.name, block_type_snapshot=block.type
        )
        db_block_run = models.BlockRun(**block_run_create_schema.model_dump())
        db_block_run.started_at = datetime.now(timezone.utc)
        db.add(db_block_run)
        await db.flush() # Get ID for db_block_run

        (block_output_data, rendered_prompt, llm_raw_output,
         named_outputs_db, list_outputs_db, matrix_outputs_db, error_message) = await _execute_single_block_logic(
            db, block, current_context, sequence_default_llm_model
        )
         
        for output_var, value in block_output_data.items():
            await variable.upsert_variable(
                db=db,
                name=output_var,
                value=value,
                user_id=run_obj.user_id,
                sequence_id=run_obj.sequence_id,
                type=VariableTypeEnum.OUTPUT._value_
            )


        db_block_run.prompt_text = rendered_prompt
        db_block_run.llm_output_text = llm_raw_output
        db_block_run.named_outputs_json = named_outputs_db
        db_block_run.list_outputs_json = list_outputs_db
        db_block_run.matrix_outputs_json = matrix_outputs_db
        db_block_run.completed_at = datetime.now(timezone.utc)

        if error_message:
            db_block_run.status = models.RunStatusEnum.FAILED
            db_block_run.error_message = error_message
            overall_success = False
            logger.error(f"Block ID {block.id} failed for run ID {run_obj.id}: {error_message}")
            # Stop sequence on first error
            run_obj.error_message = f"Failed at block '{block.name}': {error_message}"
            break 
        else:
            db_block_run.status = models.RunStatusEnum.COMPLETED
            current_context.update(block_output_data)
            final_outputs_summary[f"block_{block.id}_{block.name.replace(' ','_')}"] = block_output_data
        
        await db.flush()

    run_obj.status = models.RunStatusEnum.COMPLETED if overall_success else models.RunStatusEnum.FAILED
    run_obj.completed_at = datetime.now(timezone.utc)
    run_obj.results_summary_json = final_outputs_summary

    db.add(run_obj)
    await db.commit()
    await db.refresh(run_obj)
    
    # Eagerly load block_runs for the response
    run_obj_with_details = await crud_run.run.get_by_id_and_user(db, id=run_obj.id, user_id=user_id) # This loads details
    return run_obj_with_details if run_obj_with_details else run_obj


async def preview_prompt_for_block(
    db: AsyncSession, sequence_id: int, block_id: int, user_id: int,
    input_overrides: Dict[str, Any] = None
) -> Dict[str, Any]:
    target_block = await crud_block.block.get(db, id=block_id)
    sequence_obj = await crud_sequence.sequence.get(db, id=sequence_id)

    if not target_block or target_block.sequence_id != sequence_id:
        raise ValueError("Block not found or does not belong to the sequence.")
    if not sequence_obj:
        raise ValueError("Sequence not found.")
    
    # Ownership check should be done at route level using current_user.id == sequence_obj.user_id

    current_context = await _gather_sequence_context(db, sequence_id, user_id, input_overrides)
    sequence_default_llm_model = sequence_obj.default_llm_model or "claude-3-opus-20240229"
    
    prior_blocks = await db.execute(
        select(models.Block)
        .filter(models.Block.sequence_id == sequence_id, models.Block.order < target_block.order)
        .order_by(models.Block.order)
    )
    
    for prev_block in prior_blocks.scalars().all():
        prev_block_config = prev_block.config_json
        if prev_block.type == models.BlockTypeEnum.STANDARD:
            cfg = BlockConfigStandard(**prev_block_config)
            current_context[cfg.output_variable_name] = f"[Simulated output from {prev_block.name}]"
        elif prev_block.type == models.BlockTypeEnum.DISCRETIZATION:
            cfg = BlockConfigDiscretization(**prev_block_config)
            for name in cfg.output_names:
                current_context[name] = f"[Simulated output '{name}' from {prev_block.name}]"
        elif prev_block.type == models.BlockTypeEnum.SINGLE_LIST:
            cfg = BlockConfigSingleList(**prev_block_config)
            current_context[cfg.output_list_variable_name] = [f"[Simulated item from list output of {prev_block.name}]"]
        elif prev_block.type == models.BlockTypeEnum.MULTI_LIST:
            cfg = BlockConfigMultiList(**prev_block_config)
            current_context[cfg.output_matrix_variable_name] = [[f"[Simulated item from matrix output of {prev_block.name}]"]]

    target_block_config_dict = target_block.config_json
    prompt_template = target_block_config_dict.get("prompt", "")
    preview_render_context = {**current_context}

    if target_block.type == models.BlockTypeEnum.SINGLE_LIST:
        cfg = BlockConfigSingleList(**target_block_config_dict)
        preview_render_context["item"] = f"[SAMPLE_ITEM_FROM_{cfg.input_list_variable_name}]"
        preview_render_context["item_index"] = 0
    elif target_block.type == models.BlockTypeEnum.MULTI_LIST:
        cfg = BlockConfigMultiList(**target_block_config_dict)
        if cfg.input_lists_config:
            list1_cfg = cfg.input_lists_config[0]
            preview_render_context["item1"] = f"[SAMPLE_FROM_{list1_cfg.name}]"
            preview_render_context["item1_name"] = list1_cfg.name
            preview_render_context["item1_index"] = 0
            if len(cfg.input_lists_config) >= 2:
                list2_cfg = cfg.input_lists_config[1]
                preview_render_context["item2"] = f"[SAMPLE_FROM_{list2_cfg.name}]"
                preview_render_context["item2_name"] = list2_cfg.name
                preview_render_context["item2_index"] = 0
    
    try:
        rendered_prompt = render_prompt(prompt_template, preview_render_context)
    except ValueError as e:
        rendered_prompt = f"Error rendering prompt preview: {e}. Template: {prompt_template}"
    except Exception as e:
        rendered_prompt = f"Unexpected error rendering prompt preview: {e}. Template: {prompt_template}"

    return {
        "block_id": target_block.id, "block_name": target_block.name,
        "block_type": target_block.type.value, "prompt_template": prompt_template,
        "rendered_prompt": rendered_prompt,
        "context_used_for_preview": {
            k: (str(v)[:100] + '...' if isinstance(v, str) and len(v) > 100 else v) 
            for k,v in preview_render_context.items()
        }
    }


# app/services/execution_engine.py

async def execute_single_block(
    db: AsyncSession,
    block: models.Block,
    sequence: models.Sequence,
    user_id: int,
    input_overrides: dict = None,
) -> models.BlockRun:
    # Build context as in sequence
    context = await _gather_sequence_context(db, sequence.id, user_id, input_overrides)
    sequence_default_llm_model = block.llm_model_override or sequence.default_llm_model or "claude-3-opus-20240229"
    manual_run = Run(
        user_id=user_id,
        sequence_id=sequence.id,
        status=RunStatusEnum.COMPLETED,   # or "MANUAL" if you want a special status
        started_at=datetime.now(timezone.utc),
        completed_at=datetime.now(timezone.utc),
        llm_model_override=block.llm_model_override or sequence.default_llm_model,
        input_overrides_json=input_overrides,
        results_summary_json=None,
        error_message=None,
        # any other required fields...
    )
    db.add(manual_run)
    await db.flush()  # This gives you manual_run.id
    # Execute
    (block_output_data, rendered_prompt, llm_raw_output,
     named_outputs_db, list_outputs_db, matrix_outputs_db, error_message) = await _execute_single_block_logic(
        db, block, context, sequence_default_llm_model
    )
    
    for output_var, value in block_output_data.items():
            await variable.upsert_variable(
                db=db,
                name=output_var,
                value=value,
                user_id=user_id,
                sequence_id=sequence.id,
                type=VariableTypeEnum.OUTPUT._value_
            )
     
   
    # Create and save a BlockRun (no parent run in this mode)
    block_run = models.BlockRun(
        run_id=manual_run.id,   # Not part of a full sequence run
        block_id=block.id,
        status=models.RunStatusEnum.FAILED if error_message else models.RunStatusEnum.COMPLETED,
        block_name_snapshot=block.name,
        block_type_snapshot=block.type,
        started_at=datetime.now(timezone.utc),
        completed_at=datetime.now(timezone.utc),
        prompt_text=rendered_prompt,
        llm_output_text=llm_raw_output,
        named_outputs_json=named_outputs_db,
        list_outputs_json=list_outputs_db,
        matrix_outputs_json=matrix_outputs_db,
        error_message=error_message,
    )
    db.add(block_run)
    await db.commit()
    await db.refresh(block_run)
    return block_run
