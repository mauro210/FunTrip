from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func # For server_default timestamps

from app.database import Base

class Itinerary(Base):
    __tablename__ = "itineraries"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    version = Column(Integer, default=1, nullable=False) # To track multiple generations for the same trip
    plan_data = Column(JSON, nullable=False) # Stores the detailed structured itinerary (ItineraryContent Pydantic schema)
    total_estimated_cost = Column(Float, nullable=True) # Optional: sum of activity costs
    total_estimated_duration_minutes = Column(Integer, nullable=True) # Optional: sum of activity durations

    # Relationships:
    trip_info = relationship("Trip", back_populates="itineraries")
    user_owner = relationship("User", back_populates="itineraries") # Direct relationship to user

    def __repr__(self):
        return (f"<Itinerary(id={self.id}, trip_id={self.trip_id}, "
                f"version={self.version}, generated_at={self.generated_at})>")