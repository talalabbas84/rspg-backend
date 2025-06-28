import enum
from sqlalchemy import Column, Integer, String, Text, JSON, ForeignKey, Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class BlockTypeEnum(str, enum.Enum):
    STANDARD = "standard"
    DISCRETIZATION = "discretization"
    SINGLE_LIST = "single_list"
    MULTI_LIST = "multi_list"
    # Add other block types here if needed, e.g., CODE_EXECUTION, API_CALL

class Block(Base):
    __tablename__ = "blocks"
    name = Column(String, nullable=False, default="Untitled Block")
    type = Column(SQLAlchemyEnum(BlockTypeEnum), nullable=False)
    order = Column(Integer, nullable=False, default=0) # For ordering within a sequence
    sequence_id = Column(Integer, ForeignKey("sequences.id"), nullable=False)
    
    # config_json stores type-specific configuration for the block
    # e.g., prompt template, output variable names, input list names, etc.
    config_json = Column(JSON, nullable=False, default=lambda: {})
    
    # Optional: Store the LLM model override for this specific block
    llm_model_override = Column(String, nullable=True)

    sequence = relationship("Sequence", back_populates="blocks")
    block_runs = relationship("BlockRun", back_populates="block", cascade="all, delete-orphan")
