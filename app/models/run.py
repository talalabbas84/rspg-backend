# (Content from previous response - unchanged and correct)
import enum
from sqlalchemy import Column, Integer, String, Text, JSON, ForeignKey, DateTime, Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.models.block import BlockTypeEnum # Re-import for snapshot type

class RunStatusEnum(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled" # Optional

class Run(Base): # Represents a single execution of a sequence
    __tablename__ = "runs"
    sequence_id = Column(Integer, ForeignKey("sequences.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False) # User who initiated the run
    status = Column(SQLAlchemyEnum(RunStatusEnum), nullable=False, default=RunStatusEnum.PENDING)
    
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    input_overrides_json = Column(JSON, nullable=True) # Inputs provided at runtime
    results_summary_json = Column(JSON, nullable=True) # Final outputs or summary
    error_message = Column(Text, nullable=True) # If the overall run failed

    # Optional: Store the LLM model used for this run if it was overridden globally for the run
    llm_model_override = Column(String, nullable=True)

    sequence = relationship("Sequence", back_populates="runs")
    user = relationship("User", back_populates="runs")
    block_runs = relationship("BlockRun", back_populates="run", cascade="all, delete-orphan", order_by="BlockRun.started_at") # Order by execution start

class BlockRun(Base): # Represents the execution of a single block within a Run
    __tablename__ = "block_runs"
    run_id = Column(Integer, ForeignKey("runs.id"), nullable=False)
    block_id = Column(Integer, ForeignKey("blocks.id"), nullable=True) # Nullable if block was deleted after run
    
    status = Column(SQLAlchemyEnum(RunStatusEnum), nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Snapshots of block details at the time of execution
    block_name_snapshot = Column(String, nullable=True)
    block_type_snapshot = Column(SQLAlchemyEnum(BlockTypeEnum), nullable=True) # Use the same Enum
    # config_json_snapshot = Column(JSON, nullable=True) # Potentially large, consider if needed

    prompt_text = Column(Text, nullable=True) # The rendered prompt sent to LLM
    llm_output_text = Column(Text, nullable=True) # Raw output from LLM
    
    # Structured outputs based on block type
    named_outputs_json = Column(JSON, nullable=True) # For Standard, Discretization
    list_outputs_json = Column(JSON, nullable=True) # For SingleList
    matrix_outputs_json = Column(JSON, nullable=True) # For MultiList
    
    error_message = Column(Text, nullable=True) # If this specific block run failed

    run = relationship("Run", back_populates="block_runs")
    block = relationship("Block", back_populates="block_runs") # Link to the original block
