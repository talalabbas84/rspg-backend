# (Content from previous response - unchanged and correct)
from pydantic import BaseModel, Field
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: str | None = None # Subject (user identifier)
    exp: datetime | None = None # Expiry timestamp
