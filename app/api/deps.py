# (Content from previous response - unchanged and correct)
from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt, JWTError
from pydantic import ValidationError

from app.core import security
from app.core.config import settings
from app.db.session import get_db # Use the async get_db
from app.models.user import User
from app.crud.crud_user import user as crud_user # Use the instance
from app.schemas.token import TokenPayload


reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login" # Points to your login endpoint
)

async def get_current_user(
    db: AsyncSession = Depends(get_db), token: str = Depends(reusable_oauth2)
) -> User:
    try:
        payload = security.decode_access_token(token)
        if payload is None or payload.sub is None: # Check if token was decoded and has sub
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Could not validate credentials, token payload invalid.",
            )
    except (JWTError, ValidationError) as e: # Catch JWT specific errors and Pydantic validation errors
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Could not validate credentials, token error: {str(e)}",
        )
    
    user_id = int(payload.sub) # Assuming sub is user ID and it's an int
    user = await crud_user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user.")
    return current_user


async def get_current_active_superuser(
    current_user: User = Depends(get_current_active_user),
) -> User:
    if not await crud_user.is_superuser(current_user): # Use await for async method
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="The user doesn't have enough privileges."
        )
    return current_user
