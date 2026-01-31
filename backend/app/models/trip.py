from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.database import Base

class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, index=True, nullable=False)
    city = Column(String, nullable=False) 
    stay_address = Column(String, nullable=True) 
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    num_travelers = Column(Integer, default=1, nullable=False)
    budget_per_person = Column(Float) # Can be nullable if budget is optional
    activity_preferences = Column(JSON) # Stores preferences as a JSON list/dict

    # Relationships:
    # A Trip belongs to one User
    owner = relationship("User", back_populates="trips")
    # A Trip can have many generated Itineraries
    itineraries = relationship("Itinerary", back_populates="trip_info", cascade="all, delete-orphan")

    def __repr__(self):
        return (f"<Trip(id={self.id}, name='{self.name}', city='{self.city}', "
                        f"start_date={self.start_date}, end_date={self.end_date})>")