# (Content from previous response - unchanged and correct)
from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class Sequence(Base):
    __tablename__ = "sequences"
    name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    default_llm_model = Column(String, nullable=True, default="claude-3-opus-20240229") # Example default

    owner = relationship("User", back_populates="sequences")
    blocks = relationship("Block", back_populates="sequence", cascade="all, delete-orphan", order_by="Block.order")
    variables = relationship("Variable", back_populates="sequence", cascade="all, delete-orphan")
    runs = relationship("Run", back_populates="sequence", cascade="all, delete-orphan")
