# (Content from previous response - with config_json validation enhancement)
from typing import Dict, Any, Union
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException, status
from pydantic import ValidationError as PydanticValidationError # Alias to avoid confusion

from app.crud.base import CRUDBase
from app.models.block import Block, BlockTypeEnum
from app.schemas.block import (
    BlockCreate, BlockUpdate,
    BlockConfigStandard, BlockConfigDiscretization,
    BlockConfigSingleList, BlockConfigMultiList
)

class CRUDBlock(CRUDBase[Block, BlockCreate, BlockUpdate]):
    async def get_multi_by_sequence(
        self, db: AsyncSession, *, sequence_id: int, skip: int = 0, limit: int = 1000
    ) -> list[Block]:
        result = await db.execute(
            select(self.model)
            .filter(self.model.sequence_id == sequence_id)
            .order_by(self.model.order) # Always return blocks in order
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def update(
        self,
        db: AsyncSession,
        *,
        db_obj: Block,
        obj_in: Union[BlockUpdate, Dict[str, Any]]
    ) -> Block:
        update_data = obj_in if isinstance(obj_in, dict) else obj_in.model_dump(exclude_unset=True)

        # If config_json is being updated, validate it against the block's existing type
        if 'config_json' in update_data and update_data['config_json'] is not None:
            try:
                current_config = update_data['config_json']
                if db_obj.type == BlockTypeEnum.STANDARD:
                    validated_config = BlockConfigStandard(**current_config).model_dump()
                elif db_obj.type == BlockTypeEnum.DISCRETIZATION:
                    validated_config = BlockConfigDiscretization(**current_config).model_dump()
                elif db_obj.type == BlockTypeEnum.SINGLE_LIST:
                    validated_config = BlockConfigSingleList(**current_config).model_dump()
                elif db_obj.type == BlockTypeEnum.MULTI_LIST:
                    validated_config = BlockConfigMultiList(**current_config).model_dump()
                else:
                    # Should not happen if type is valid
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unknown block type for config validation: {db_obj.type}")
                update_data['config_json'] = validated_config
            except PydanticValidationError as e:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Invalid config_json for block type {db_obj.type}: {e.errors()}"
                )
        
        return await super().update(db, db_obj=db_obj, obj_in=update_data)

block = CRUDBlock(Block)
