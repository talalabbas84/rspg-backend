from sqlalchemy import Column, Integer, String, Text, ForeignKey, UniqueConstraint, JSON
from sqlalchemy.orm import relationship
from app.db.base import Base

class GlobalList(Base):
    __tablename__ = "global_lists"
    id = Column(Integer, primary_key=True, index=True)  # <-- ADD THIS LINE
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    owner = relationship("User", back_populates="global_lists")
    items = relationship("GlobalListItem", back_populates="global_list", cascade="all, delete-orphan", lazy="selectin")

    __table_args__ = (UniqueConstraint('name', 'user_id', name='_user_globallist_name_uc'),)


class GlobalListItem(Base):
    __tablename__ = "global_list_items"
    id = Column(Integer, primary_key=True, index=True)  # <-- ADD THIS LINE
    value = Column(JSON, nullable=False) # The actual item value
    order = Column(Integer, default=0) # Optional: for ordered lists
    global_list_id = Column(Integer, ForeignKey("global_lists.id"), nullable=False)

    global_list = relationship("GlobalList", back_populates="items")
