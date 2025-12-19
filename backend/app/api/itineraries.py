from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.api.auth import get_current_user
from app.models.user import User # For type hinting current_user
from app.models.itinerary import Itinerary # Import the Itinerary model
from app.schemas.itinerary import ItineraryOut, ItineraryGenerateRequest # Import schemas
from app.services import itinerary_generator as itinerary_service 
from app.models.trip import Trip # Import Trip model to check ownership

router = APIRouter(prefix="/itineraries", tags=["Itineraries"])

@router.post("/generate/{trip_id}", response_model=ItineraryOut, status_code=status.HTTP_201_CREATED)
def generate_trip_itinerary(
    trip_id: int,
    current_user: User = Depends(get_current_user), # Ensure user is authenticated
    db: Session = Depends(get_db)
):
    """
    Generates a new itinerary for a specific trip using AI.
    The trip must belong to the authenticated user.
    """
    # Verify the trip exists and belongs to the current user
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found or you do not have access to this trip."
        )

    try:
        # Call the itinerary generation service
        new_itinerary = itinerary_service.generate_itinerary(db=db, trip_id=trip_id)
        return new_itinerary
    except ValueError as e:
        # Catch specific ValueErrors (e.g., from AI response validation)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Itinerary generation failed: {e}"
        )
    except Exception as e:
        # Catch any other unexpected errors during generation
        print(f"Server error during itinerary generation for trip {trip_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during itinerary generation. Please try again."
        )

@router.get("/trip/{trip_id}", response_model=List[ItineraryOut])
def get_trip_itineraries(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves all generated itineraries for a specific trip, ordered by version.
    The trip must belong to the authenticated user.
    """
    # Verify the trip exists and belongs to the current user
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found or you do not have access to this trip."
        )

    itineraries = db.query(Itinerary)\
                    .filter(Itinerary.trip_id == trip_id)\
                    .order_by(Itinerary.version.desc())\
                    .all()
    return itineraries

@router.get("/{itinerary_id}", response_model=ItineraryOut)
def get_single_itinerary(
    itinerary_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves a single itinerary by its ID, ensuring it belongs to the authenticated user.
    """
    itinerary = db.query(Itinerary).filter(Itinerary.id == itinerary_id, Itinerary.user_id == current_user.id).first()
    if not itinerary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Itinerary not found or you do not have access to this itinerary."
        )
    return itinerary

@router.delete("/{itinerary_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_itinerary(
    itinerary_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deletes a specific itinerary by its ID, ensuring it belongs to the authenticated user.
    """
    itinerary = db.query(Itinerary).filter(Itinerary.id == itinerary_id, Itinerary.user_id == current_user.id).first()
    if not itinerary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Itinerary not found or you do not have access to this itinerary."
        )
    
    db.delete(itinerary)
    db.commit()
    return # 204 No Content response
