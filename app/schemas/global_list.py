# (Content from previous response - unchanged and correct)
from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime

# --- Global List Item Schemas ---
class GlobalListItemBase(BaseModel):
    value: Any = Field(..., example="Positive Feedback or {'fact': 'A fact'}")
    order: Optional[int] = Field(0, example=1)

class GlobalListItemCreate(GlobalListItemBase):
    pass # global_list_id will be path param or injected

class GlobalListItemUpdate(GlobalListItemBase):
    value: Optional[Any] = None # Allow partial updates
    order: Optional[int] = None

class GlobalListItemRead(GlobalListItemBase):
    id: int
    global_list_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Global List Schemas ---
class GlobalListBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, example="Sentiment Categories")
    description: Optional[str] = Field(None, example="A list of possible sentiment categories for classification.")

class GlobalListCreate(GlobalListBase):
    # Optionally allow creating items along with the list
    items: Optional[List[GlobalListItemCreate]] = Field(None, example=[{"value": "Urgent"}, {"value": "Non-Urgent"}])

class GlobalListUpdate(GlobalListBase):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    items: Optional[List[GlobalListItemCreate]] = Field(
        None,
        example=[{"value": "JP", "order": 0}, {"value": "US", "order": 1}]
    )


class GlobalListRead(GlobalListBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    items: List[GlobalListItemRead] = [] # Eagerly load items

    class Config:
        from_attributes = True
