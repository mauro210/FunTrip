from sqlalchemy import Boolean, Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship

from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String, nullable=False) 
    last_name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False) # For email verification
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True) # Will update on login

    # Relationships:
    # A User can have many Trips
    trips = relationship("Trip", back_populates="owner")
    # A User can have many Itineraries
    itineraries = relationship("Itinerary", back_populates="user_owner")

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}')>"