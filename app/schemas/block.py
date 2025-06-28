# (Content from previous response - unchanged and correct)
from pydantic import BaseModel, Field, field_validator, model_validator
from typing import List, Dict, Any, Optional, Union
from datetime import datetime
from app.models.block import BlockTypeEnum # Import Enum from models

# --- Block Config Schemas ---
class BlockConfigBase(BaseModel):
    prompt: Optional[str] = Field(default="", description="Prompt template for the LLM. Use Jinja2 syntax like {{variable_name}}.")

class BlockConfigStandard(BlockConfigBase):
    output_variable_name: str = Field(default="output", description="Name of the variable to store the LLM output.")

class BlockConfigDiscretization(BlockConfigBase):
    prompt: str = Field(..., description="Prompt for the LLM, expected to guide structured output (e.g., JSON).")
    output_names: List[str] = Field(..., min_length=1, description="List of names for the discretized output variables.")

class BlockConfigSingleList(BlockConfigBase):
    prompt: str = Field(..., description="Prompt template. Use {{item}} for the current list item and {{item_index}} for its index.")
    input_list_variable_name: str = Field(..., description="Name of the global list or variable (which should be a list) to iterate over.")
    output_list_variable_name: str = Field(default="processed_list", description="Name for the new list variable containing results.")
    # store_in_global_list: Optional[bool] = Field(default=False) # Future: option to save output list as a new global list
    # global_list_name: Optional[str] = Field(default=None) # Future: name if stored

class BlockConfigMultiListInputItem(BaseModel):
    name: str = Field(..., description="Name of the global list or variable (which should be a list).")
    # item_placeholder_in_prompt: str = Field(..., description="Placeholder name for items from this list in the prompt, e.g., {{claims_item}}")
    # priority: int = Field(default=1, ge=1, description="Priority for looping. Lower numbers are higher priority.") # Future: for complex iteration logic

class BlockConfigMultiList(BlockConfigBase):
    prompt: str = Field(..., description="Prompt template. Use placeholders like {{item1}}, {{item2}} for current items from respective lists.")
    input_lists_config: List[BlockConfigMultiListInputItem] = Field(..., min_length=1, description="Configuration for input lists. The engine will typically use the first as primary, second as secondary for matrix, etc.")
    output_matrix_variable_name: str = Field(default="comparison_matrix", description="Name for the new matrix (list of lists or dict of dicts) variable.")

# --- Main Block Schemas ---
class BlockBase(BaseModel):
    name: str = Field(default="Untitled Block", min_length=1, max_length=255)
    type: BlockTypeEnum
    order: int = Field(default=0, ge=0)
    llm_model_override: Optional[str] = Field(None, example="claude-3-sonnet-20240229")
    config_json: Dict[str, Any] # This will be validated by the specific config model in `model_validator`

    @model_validator(mode='before')
    @classmethod
    def validate_config_json_against_type(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            # Let Pydantic handle if 'data' is not a dict (e.g. if request is malformed)
            return data 

        block_type = data.get('type')
        config_json_data = data.get('config_json', {}) # Ensure config_json is a dict

        if not isinstance(config_json_data, dict):
             # If config_json itself is not a dict (e.g. sent as null or string), raise or default
             # For now, let specific model parsing handle it, or default to empty dict if appropriate
             config_json_data = {}


        validated_config = {}
        if block_type == BlockTypeEnum.STANDARD:
            validated_config = BlockConfigStandard(**config_json_data).model_dump()
        elif block_type == BlockTypeEnum.DISCRETIZATION:
            validated_config = BlockConfigDiscretization(**config_json_data).model_dump()
        elif block_type == BlockTypeEnum.SINGLE_LIST:
            validated_config = BlockConfigSingleList(**config_json_data).model_dump()
        elif block_type == BlockTypeEnum.MULTI_LIST:
            validated_config = BlockConfigMultiList(**config_json_data).model_dump()
        else:
            # If block_type is None or not recognized, pass config_json_data as is.
            # Further validation might occur, or it might be an error if type is mandatory.
            # For creation, type is mandatory.
            validated_config = config_json_data
        
        data['config_json'] = validated_config
        return data

class BlockCreate(BlockBase):
    sequence_id: int

class BlockUpdate(BaseModel): # For PATCH, all fields are optional
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    order: Optional[int] = Field(None, ge=0)
    llm_model_override: Optional[str] = Field(None)
    config_json: Optional[Dict[str, Any]] = None # Type will be validated against existing block's type in service/CRUD

class BlockRead(BlockBase):
    id: int
    sequence_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
