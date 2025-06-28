from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.crud.base import CRUDBase
from app.models.variable import Variable, VariableTypeEnum
from app.schemas.variable import VariableCreate, VariableUpdate

class CRUDVariable(CRUDBase[Variable, VariableCreate, VariableUpdate]):
    async def get_by_name_and_sequence(
        self, db: AsyncSession, *, name: str, sequence_id: int
    ) -> Optional[Variable]:
        result = await db.execute(
            select(self.model).filter(self.model.name == name, self.model.sequence_id == sequence_id)
        )
        return result.scalar_one_or_none()

    async def get_multi_by_sequence(
        self, db: AsyncSession, *, sequence_id: int, skip: int = 0, limit: int = 1000
    ) -> List[Variable]:
        result = await db.execute(
            select(self.model)
            .filter(self.model.sequence_id == sequence_id)
            .order_by(self.model.name)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_by_name_and_user(
        self, db: AsyncSession, *, name: str, user_id: int
    ) -> Optional[Variable]:
        # Only fetches user-global (not sequence) variables
        result = await db.execute(
            select(self.model).filter(
                self.model.name == name,
                self.model.user_id == user_id,
                self.model.sequence_id == None
            )
        )
        return result.scalar_one_or_none()
    

    async def get_multi_by_user(
        self, db: AsyncSession, *, user_id: int, skip: int = 0, limit: int = 1000
    ) -> List[Variable]:
        # Returns all variables (sequence and user-global) for a user
        result = await db.execute(
            select(self.model)
            .filter(self.model.user_id == user_id)
            .order_by(self.model.name)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()
    
    async def create_with_owner(
        self, db: AsyncSession, *, obj_in: VariableCreate, user_id: int
    ) -> Variable:
        obj_in_data = obj_in.model_dump()  # Pydantic v2
        db_obj = self.model(**obj_in_data, user_id=user_id)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

variable = CRUDVariable(Variable)
