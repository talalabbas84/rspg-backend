# (Content from previous response - unchanged and correct)
from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.db.base import Base

class User(Base):
    __tablename__ = "users"
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    full_name = Column(String, index=True, nullable=True)

    sequences = relationship("Sequence", back_populates="owner", cascade="all, delete-orphan")
    global_lists = relationship("GlobalList", back_populates="owner", cascade="all, delete-orphan")
    runs = relationship("Run", back_populates="user", cascade="all, delete-orphan")
    variables = relationship("Variable", back_populates="owner")

