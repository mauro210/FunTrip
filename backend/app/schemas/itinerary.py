from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from datetime import datetime, date as date_type

# --- Schemas for the detailed plan_data JSON within an Itinerary ---

class Activity(BaseModel):
    """Represents a single activity within an itinerary."""
    time: str = Field(..., description="Time of the activity (e.g., '9:00 AM', 'Morning', 'Lunch')")
    name: str = Field(..., description="Name or title of the activity (e.g., 'Visit Eiffel Tower')")
    description: Optional[str] = Field(None, description="Brief description of the activity")
    location: Optional[str] = Field(None, description="Physical location or address of the activity")
    estimated_duration_minutes: Optional[int] = Field(None, ge=5, description="Estimated duration of the activity in minutes")
    transportation: Optional[str] = Field(None, description="Suggested transportation method to this activity (e.g., 'Walk', 'Metro', 'Taxi')")
    cost_usd: Optional[float] = Field(None, ge=0, description="Estimated cost of the activity in USD")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "time": "10:00 AM",
                "name": "Eiffel Tower Tour",
                "description": "Iconic landmark offering panoramic city views.",
                "location": "Champ de Mars, 5 Avenue Anatole France, 75007 Paris",
                "estimated_duration_minutes": 120,
                "transportation": "Metro Line 9",
                "cost_usd": 25.0
            }
        }
    )

class DailyPlan(BaseModel):
    """Represents the plan for a single day of the trip."""
    day_number: int = Field(..., ge=1, description="Day number of the trip (e.g., 1 for the first day)")
    day_date: date_type = Field(..., description="Calendar date of the day (YYYY-MM-DD)")
    theme: Optional[str] = Field(None, description="Optional theme or focus for the day (e.g., 'Historical Exploration')")
    activities: List[Activity] = Field(..., description="List of activities planned for this day")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "day_number": 1,
                "date": "2025-09-01",
                "theme": "Arrival and Parisian Charm",
                "activities": [
                    {
                        "time": "Afternoon",
                        "name": "Hotel Check-in",
                        "description": "Settle into your accommodation in Paris.",
                        "location": "Example Hotel Address, Paris",
                        "estimated_duration_minutes": 60
                    },
                    {
                        "time": "Evening",
                        "name": "Seine River Cruise",
                        "description": "Enjoy illuminated landmarks from the river.",
                        "location": "Pont de l'Alma, Paris",
                        "estimated_duration_minutes": 90,
                        "cost_usd": 18.0
                    }
                ]
            }
        }
    )

class ItineraryContent(BaseModel):
    """The full structured content of a generated itinerary."""
    title: str = Field(..., description="Title of the generated itinerary (e.g., '7-Day Paris Adventure')")
    duration_days: int = Field(..., ge=1, description="Total number of days covered by the itinerary")
    daily_plans: List[DailyPlan] = Field(..., description="List of detailed plans for each day")
    notes: Optional[str] = Field(None, description="Any general notes or tips for the entire itinerary")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "7-Day Parisian Charm Itinerary",
                "duration_days": 7,
                "daily_plans": [
                    {
                        "day_number": 1,
                        "date": "2025-09-01",
                        "theme": "Arrival and Exploration",
                        "activities": [
                            { "time": "15:00", "name": "Hotel Check-in", "location": "Your Hotel" }
                        ]
                    },
                    {
                        "day_number": 2,
                        "date": "2025-09-02",
                        "theme": "Iconic Landmarks",
                        "activities": [
                            { "time": "09:00", "name": "Eiffel Tower", "location": "Paris", "cost_usd": 25.0 }
                        ]
                    }
                ],
                "notes": "Remember to book tickets for popular attractions in advance!"
            }
        }
    )

# --- Schema for the overall Itinerary object returned by API ---

class ItineraryOut(BaseModel):
    """Schema for returning full Itinerary details."""
    id: int
    trip_id: int
    user_id: int
    generated_at: datetime
    version: int # To allow for multiple generated versions of an itinerary
    plan_data: ItineraryContent # The structured JSON content
    total_estimated_cost: Optional[float] = None
    total_estimated_duration_minutes: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

class ItineraryGenerateRequest(BaseModel):
    """Schema for input when requesting itinerary generation."""
    # No specific fields needed beyond trip_id which will be in the path for now
    # but could include preferences for itinerary style etc.
    pass