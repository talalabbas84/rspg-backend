from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.crud.base import CRUDBase
from app.models.global_list import GlobalList, GlobalListItem
from app.schemas.global_list import GlobalListCreate, GlobalListUpdate, GlobalListItemCreate, GlobalListItemUpdate

class CRUDGlobalList(CRUDBase[GlobalList, GlobalListCreate, GlobalListUpdate]):
    async def create_with_owner(
        self, db: AsyncSession, *, obj_in: GlobalListCreate, user_id: int
    ) -> GlobalList:
        # Pydantic V2: list_data = obj_in.model_dump(exclude={"items"})
        # Pydantic V1: list_data = obj_in.dict(exclude={"items"})
        list_data = obj_in.model_dump(exclude={"items"})
        
        db_list = self.model(**list_data, user_id=user_id)
        db.add(db_list)
        await db.flush() # To get db_list.id for items

        if obj_in.items:
            for item_in in obj_in.items:
                # Pydantic V2: item_data = item_in.model_dump()
                # Pydantic V1: item_data = item_in.dict()
                item_data = item_in.model_dump()
                db_item = GlobalListItem(**item_data, global_list_id=db_list.id)
                db.add(db_item)
        
        await db.commit()
        await db.refresh(db_list)
        # If items were created, db_list.items might not be populated unless re-queried or relationship configured for it.
        # For simplicity, returning the list object. Frontend might need to re-fetch if it needs items immediately.
        # Or, eager load them after refresh if necessary.
        # A more robust way: query again with selectinload(GlobalList.items)
        refreshed_list = await db.execute(
            select(GlobalList).options(selectinload(GlobalList.items)).filter(GlobalList.id == db_list.id)
        )
        return refreshed_list.scalar_one()


    async def get_multi_by_owner(
        self, db: AsyncSession, *, user_id: int, skip: int = 0, limit: int = 100
    ) -> List[GlobalList]:
        result = await db.execute(
            select(self.model)
            .filter(self.model.user_id == user_id)
            .options(selectinload(self.model.items)) # Eager load items
            .order_by(self.model.name)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_by_id_and_owner(
        self, db: AsyncSession, *, id: int, user_id: int
    ) -> Optional[GlobalList]:
        result = await db.execute(
            select(self.model)
            .filter(self.model.id == id, self.model.user_id == user_id)
            .options(selectinload(self.model.items)) # Eager load items
        )
        return result.scalar_one_or_none()

class CRUDGlobalListItem(CRUDBase[GlobalListItem, GlobalListItemCreate, GlobalListItemUpdate]):
    async def create_for_list(
        self, db: AsyncSession, *, obj_in: GlobalListItemCreate, global_list_id: int
    ) -> GlobalListItem:
        # Pydantic V2: item_data = obj_in.model_dump()
        # Pydantic V1: item_data = obj_in.dict()
        item_data = obj_in.model_dump()
        db_item = self.model(**item_data, global_list_id=global_list_id)
        db.add(db_item)
        await db.commit()
        await db.refresh(db_item)
        return db_item

    async def get_multi_by_list(
        self, db: AsyncSession, *, global_list_id: int, skip: int = 0, limit: int = 1000
    ) -> List[GlobalListItem]:
        result = await db.execute(
            select(self.model)
            .filter(self.model.global_list_id == global_list_id)
            .order_by(self.model.order, self.model.created_at) # Order by 'order' then by creation
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

global_list = CRUDGlobalList(GlobalList)
global_list_item = CRUDGlobalListItem(GlobalListItem)
