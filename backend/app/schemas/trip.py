from pydantic import BaseModel, ConfigDict, Field
from datetime import date
from typing import Optional, List, Dict, Any

class TripCreate(BaseModel):
    """Schema for creating a new trip."""
    name: str = Field(..., min_length=1, max_length=100, description="Name of the trip")
    city: str = Field(..., min_length=1, max_length=100, description="City of the destination")
    stay_address: Optional[str] = Field(None, description="Specific address where you'll be staying (e.g., hotel, Airbnb)") 
    start_date: date = Field(..., description="Start date of the trip (YYYY-MM-DD)")
    end_date: date = Field(..., description="End date of the trip (YYYY-MM-DD)")
    num_travelers: int = Field(1, ge=1, description="Number of travelers (minimum 1)")
    budget_per_person: Optional[float] = Field(None, ge=0, description="Budget per person in USD (optional)")
    activity_preferences: Optional[List[str]] = Field(None, description="List of activity preferences (e.g., ['nature', 'architecture'])")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "European Adventure",
                "city": "Paris, France", 
                "stay_address": "123 Rue de Rivoli, 75001 Paris", 
                "start_date": "2025-09-01",
                "end_date": "2025-09-07",
                "num_travelers": 2,
                "budget_per_person": 100.0,
                "activity_preferences": ["museums", "food", "outdoors"]
            }
        }
    )

class TripUpdate(BaseModel):
    """Schema for updating an existing trip. All fields are optional."""
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Name of the trip")
    city: Optional[str] = Field(None, min_length=1, max_length=100, description="City of the destination") 
    stay_address: Optional[str] = Field(None, description="Specific address where you'll be staying (e.g., hotel, Airbnb)") 
    start_date: Optional[date] = Field(None, description="Start date of the trip (YYYY-MM-DD)")
    end_date: Optional[date] = Field(None, description="End date of the trip (YYYY-MM-DD)")
    num_travelers: Optional[int] = Field(None, ge=1, description="Number of travelers (minimum 1)")
    budget_per_person: Optional[float] = Field(None, ge=0, description="Budget per person in USD (optional)")
    activity_preferences: Optional[List[str]] = Field(None, description="List of activity preferences (e.g., ['nature', 'architecture'])")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Updated Europe Trip",
                "city": "Rome, Italy", 
                "stay_address": "Via del Corso, 00186 Rome", 
                "budget_per_person": 120.0,
                "activity_preferences": ["museums", "shopping"]
            }
        }
    )

class TripOut(BaseModel):
    """Schema for returning trip details."""
    id: int
    user_id: int
    name: str
    city: str 
    stay_address: Optional[str] = None 
    start_date: date
    end_date: date
    num_travelers: int
    budget_per_person: Optional[float] = None
    activity_preferences: Optional[List[str]] = None # Will be parsed from JSON in DB

    model_config = ConfigDict(from_attributes=True)