# (Content from previous response - unchanged and correct)
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.crud.base import CRUDBase
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash

class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    async def get_by_email(self, db: AsyncSession, *, email: str) -> Optional[User]:
        result = await db.execute(select(self.model).filter(self.model.email == email))
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, *, obj_in: UserCreate) -> User:
        # Pydantic V2: db_obj_data = obj_in.model_dump()
        # Pydantic V1: db_obj_data = obj_in.dict()
        db_obj_data = obj_in.model_dump()
        db_obj_data["hashed_password"] = get_password_hash(obj_in.password)
        del db_obj_data["password"] # Remove plain password
        
        db_obj = self.model(**db_obj_data)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self, db: AsyncSession, *, db_obj: User, obj_in: UserUpdate
    ) -> User:
        # Pydantic V2: update_data = obj_in.model_dump(exclude_unset=True)
        # Pydantic V1: update_data = obj_in.dict(exclude_unset=True)
        update_data = obj_in.model_dump(exclude_unset=True)
        
        if "password" in update_data and update_data["password"]:
            hashed_password = get_password_hash(update_data["password"])
            db_obj.hashed_password = hashed_password
            del update_data["password"]
        
        return await super().update(db, db_obj=db_obj, obj_in=update_data)

    async def is_superuser(self, user: User) -> bool:
        return user.is_superuser

user = CRUDUser(User)
