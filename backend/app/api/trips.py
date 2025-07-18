from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.trip import TripCreate, TripOut, TripUpdate
from app.schemas.user import UserResponse # Import UserResponse to get current user details
from app.services import trip as trip_service 
from app.api.auth import get_current_user # Import the dependency to get the current user

router = APIRouter(prefix="/trips", tags=["Trips"])

@router.post("/", response_model=TripOut, status_code=status.HTTP_201_CREATED)
def create_new_trip(
    trip_in: TripCreate,
    current_user: UserResponse = Depends(get_current_user), # Get the authenticated user
    db: Session = Depends(get_db)
):
    """
    Create a new trip for the authenticated user.
    """
    # Use current_user.id to link the trip to the correct user
    new_trip = trip_service.create_trip(db=db, trip_in=trip_in, user_id=current_user.id)
    return new_trip

@router.get("/", response_model=List[TripOut])
def read_user_trips(
    current_user: UserResponse = Depends(get_current_user), # Get the authenticated user
    db: Session = Depends(get_db)
):
    """
    Retrieve all trips created by the authenticated user.
    """
    trips = trip_service.get_user_trips(db=db, user_id=current_user.id)
    return trips

@router.get("/{trip_id}", response_model=TripOut)
def read_single_trip(
    trip_id: int,
    current_user: UserResponse = Depends(get_current_user), # Get the authenticated user
    db: Session = Depends(get_db)
):
    """
    Retrieve a specific trip by its ID, ensuring it belongs to the authenticated user.
    """
    trip = trip_service.get_trip_by_id(db=db, trip_id=trip_id, user_id=current_user.id)
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found or not authorized")
    return trip

@router.put("/{trip_id}", response_model=TripOut) 
def update_single_trip(
    trip_id: int,
    trip_update: TripUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update an existing trip.
    """
    db_trip = trip_service.get_trip_by_id(db=db, trip_id=trip_id, user_id=current_user.id)
    if not db_trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found or not authorized")
    
    updated_trip = trip_service.update_trip(db=db, db_trip=db_trip, trip_update=trip_update)
    return updated_trip

@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT) # 204 No Content for successful deletion
def delete_single_trip(
    trip_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a trip.
    """
    db_trip = trip_service.get_trip_by_id(db=db, trip_id=trip_id, user_id=current_user.id)
    if not db_trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found or not authorized")
    
    trip_service.delete_trip(db=db, db_trip=db_trip)
    return # No content to return for 204