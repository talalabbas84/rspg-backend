# (Content from previous response - unchanged and correct)
from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from fastapi.encoders import jsonable_encoder # For converting Pydantic models to dicts

from app.db.base import Base

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)

class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model

    async def get(self, db: AsyncSession, id: Any) -> Optional[ModelType]:
        result = await db.execute(select(self.model).filter(self.model.id == id))
        return result.scalar_one_or_none()

    async def get_multi(
        self, db: AsyncSession, *, skip: int = 0, limit: int = 100
    ) -> List[ModelType]:
        result = await db.execute(
            select(self.model).offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def create(self, db: AsyncSession, *, obj_in: CreateSchemaType) -> ModelType:
        # Pydantic V2: obj_in_data = obj_in.model_dump()
        # Pydantic V1: obj_in_data = jsonable_encoder(obj_in)
        obj_in_data = obj_in.model_dump()
        db_obj = self.model(**obj_in_data)
        db.add(db_obj)
        try:
            await db.commit()
        except IntegrityError as e: # Catch DB constraint violations
            await db.rollback()
            # You might want to parse e.orig to give a more specific error
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Database integrity error: {e.orig}")
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self,
        db: AsyncSession,
        *,
        db_obj: ModelType,
        obj_in: Union[UpdateSchemaType, Dict[str, Any]]
    ) -> ModelType:
        obj_data = jsonable_encoder(db_obj) # Current state of db_obj as dict
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            # Pydantic V2: update_data = obj_in.model_dump(exclude_unset=True)
            # Pydantic V1: update_data = obj_in.dict(exclude_unset=True)
            update_data = obj_in.model_dump(exclude_unset=True)
        
        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
        db.add(db_obj)
        try:
            await db.commit()
        except IntegrityError as e:
            await db.rollback()
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Database integrity error during update: {e.orig}")
        await db.refresh(db_obj)
        return db_obj

    async def remove(self, db: AsyncSession, *, id: int) -> ModelType | None:
        obj = await self.get(db, id=id)
        if obj:
            await db.delete(obj)
            await db.commit()
        return obj # Returns the deleted object or None if not found
