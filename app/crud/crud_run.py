from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import and_

from app.crud.base import CRUDBase
from app.models.run import Run, BlockRun
from app.schemas.run import RunCreate, RunUpdate, BlockRunCreate # BlockRunUpdate not strictly needed from API
from pydantic import BaseModel

class CRUDRun(CRUDBase[Run, RunCreate, RunUpdate]):
    async def create_with_user_and_sequence(
        self, db: AsyncSession, *, obj_in: RunCreate, user_id: int
    ) -> Run:
        if hasattr(obj_in, "model_dump"):
            obj_in_data = obj_in.model_dump()
        elif hasattr(obj_in, "dict"):  # For Pydantic v1
            obj_in_data = obj_in.dict()
        elif isinstance(obj_in, dict):
            obj_in_data = obj_in
        else:
            raise ValueError("Invalid obj_in type for CRUDRun.create_with_user_and_sequence")
        db_obj = self.model(**obj_in_data, user_id=user_id)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj


    async def get_multi_by_sequence_and_user(
        self, db: AsyncSession, *, sequence_id: int, user_id: int, skip: int = 0, limit: int = 100
    ) -> List[Run]:
        result = await db.execute(
            select(self.model)
            .filter(self.model.sequence_id == sequence_id, self.model.user_id == user_id)
            .options(selectinload(self.model.block_runs)) # Eager load block_runs
            .order_by(self.model.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_by_id_and_user(
        self, db: AsyncSession, *, id: int, user_id: int
    ) -> Optional[Run]:
        result = await db.execute(
            select(self.model)
            .filter(self.model.id == id, self.model.user_id == user_id)
            .options(selectinload(self.model.block_runs).selectinload(BlockRun.block)) # Load block_runs and their associated block
        )
        return result.scalar_one_or_none()

class CRUDBlockRun(CRUDBase[BlockRun, BlockRunCreate, BaseModel]): # UpdateSchema not used from API
    # BlockRuns are typically created by the system (execution engine), not directly via API in full detail.
    # The create method from CRUDBase can be used internally by the engine.
    pass

run = CRUDRun(Run)
block_run = CRUDBlockRun(BlockRun)
