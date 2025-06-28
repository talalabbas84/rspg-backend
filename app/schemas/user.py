# (Content from previous response - unchanged and correct)
from pydantic import BaseModel, EmailStr, Field
from typing import Optional

# Shared properties
class UserBase(BaseModel):
    email: EmailStr = Field(..., example="user@example.com")
    full_name: Optional[str] = Field(None, example="John Doe")
    is_active: Optional[bool] = True
    is_superuser: bool = False

# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(..., min_length=8, example="strongpassword123")

# Properties to receive via API on update
class UserUpdate(UserBase):
    password: Optional[str] = Field(None, min_length=8, example="newstrongpassword123")
    email: Optional[EmailStr] = Field(None, example="user@example.com") # Allow email update if needed
    full_name: Optional[str] = Field(None, example="John Doe Updated")
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None


# Properties stored in DB
class UserInDBBase(UserBase):
    id: int
    hashed_password: str

    class Config:
        from_attributes = True # Pydantic V2
        # orm_mode = True # Pydantic V1

# Additional properties to return via API
class UserRead(UserBase):
    id: int

    class Config:
        from_attributes = True
