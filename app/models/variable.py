import enum
from sqlalchemy import Column, Integer, String, ForeignKey, JSON, Text, Enum as SQLAlchemyEnum, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base import Base

class VariableTypeEnum(str, enum.Enum):
    GLOBAL = "global"    # User-defined global variable (user-wide or sequence-wide)
    INPUT = "input"      # Expected at runtime for the sequence
    # Future: You can add more types if needed

class Variable(Base):
    __tablename__ = "variables"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(SQLAlchemyEnum(VariableTypeEnum), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Always set (either as user-global, or via sequence.owner)
    sequence_id = Column(Integer, ForeignKey("sequences.id"), nullable=True)  # Nullable for user-global vars
    value_json = Column(JSON, nullable=True)
    description = Column(Text, nullable=True)

    sequence = relationship("Sequence", back_populates="variables")
    owner = relationship("User", back_populates="variables")

    __table_args__ = (
        UniqueConstraint('name', 'sequence_id', name='_sequence_variable_name_uc'),
        UniqueConstraint('name', 'user_id', 'sequence_id', name='_user_var_name_uc'),  # Prevent user-level dupes (user-global)
    )
