from sqlalchemy import Column, Integer, String, Float, JSON
from app.database import Base

class Attraction(Base):
    __tablename__ = "attractions"

    id = Column(Integer, primary_key=True, index=True)
    google_place_id = Column(String, unique=True, index=True, nullable=True) # Optional: ID from Google Places API
    name = Column(String, index=True, nullable=False)
    city = Column(String, index=True, nullable=False)
    country = Column(String, index=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    type = Column(String) # e.g., "Museum", "Restaurant", "Outdoor", "Historic Site"
    description = Column(String)
    # Store opening hours as JSON: {"monday": "9:00-17:00", "tuesday": "closed", "special_dates": {"2024-12-25": "closed"}}
    opening_hours = Column(JSON)
    estimated_duration_minutes = Column(Integer) # How long a typical visit takes
    admission_cost = Column(Float) # Estimated cost
    website = Column(String)
    phone = Column(String)
    image_url = Column(String) # Optional: for displaying in UI
    rating = Column(Float) # Optional: User rating from external sources (e.g., Google Places)
    num_reviews = Column(Integer) # Optional: Number of reviews

    def __repr__(self):
        return f"<Attraction(id={self.id}, name='{self.name}', city='{self.city}')>"