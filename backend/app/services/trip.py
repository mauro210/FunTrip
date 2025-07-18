from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.trip import Trip 
from app.models.user import User # Import User model for type hinting
from app.schemas.trip import TripCreate 

def create_trip(db: Session, trip_in: TripCreate, user_id: int) -> Trip:
    """
    Creates a new trip in the database.
    """
    db_trip = Trip(
        user_id=user_id,
        name=trip_in.name,
        destination=trip_in.destination,
        start_date=trip_in.start_date,
        end_date=trip_in.end_date,
        num_travelers=trip_in.num_travelers,
        budget_per_person=trip_in.budget_per_person,
        activity_preferences=trip_in.activity_preferences
    )
    db.add(db_trip)
    db.commit()
    db.refresh(db_trip)
    return db_trip

def get_user_trips(db: Session, user_id: int) -> List[Trip]:
    """
    Retrieves all trips for a specific user.
    """
    return db.query(Trip).filter(Trip.user_id == user_id).all()

def get_trip_by_id(db: Session, trip_id: int, user_id: int) -> Optional[Trip]:
    """
    Retrieves a specific trip by ID, ensuring it belongs to the given user.
    """
    return db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == user_id).first()