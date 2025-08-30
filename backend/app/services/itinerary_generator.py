import os
import json
from datetime import date, timedelta, datetime
from typing import Optional, List, Dict, Any, cast

from google.generativeai.generative_models import GenerativeModel

from sqlalchemy.orm import Session
from pydantic import ValidationError
from sqlalchemy.sql import func

from app.models.trip import Trip
from app.models.itinerary import Itinerary
from app.schemas.itinerary import ItineraryContent, DailyPlan, Activity

# Configure Google Generative AI with the API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable not set.")

# Set the GOOGLE_API_KEY environment variable for the process
os.environ["GOOGLE_API_KEY"] = GEMINI_API_KEY

# Initialize the generative model
model = GenerativeModel('gemini-2.5-flash')

def get_trip_duration_days(start_date: date, end_date: date) -> int:
    """Calculates the duration of a trip in days."""
    return (end_date - start_date).days + 1

def generate_itinerary_prompt(trip: Trip) -> str:
    """
    Constructs a detailed prompt for the Gemini AI based on trip details,
    requesting output in a specific JSON format.
    """
    start_dt = cast(date, trip.start_date)
    end_dt = cast(date, trip.end_date)
    duration_days = get_trip_duration_days(start_dt, end_dt)
    
    preferences_str = ""
    if trip.activity_preferences is not None:
        preferences_list = cast(List[str], trip.activity_preferences)
        if len(preferences_list) > 0:
            preferences_str = ", ".join(preferences_list)
            preferences_str = f"User activity preferences: {preferences_str}. "

    budget_str = ""
    total_trip_budget = 0.0
    if trip.budget_per_person is not None:
        total_trip_budget = trip.budget_per_person * trip.num_travelers
        budget_str = f"Total trip budget for all travelers: ${total_trip_budget:.2f} USD. "

    stay_address_str = ""
    if trip.stay_address is not None:
        stay_address_value = cast(str, trip.stay_address)
        if stay_address_value != '':
            stay_address_str = f"The user is staying at {stay_address_value}. Please factor this location into daily travel logistics and start/end points for activities."

    today_date_str = datetime.now().strftime('%Y-%m-%d')
    
    accommodation_location_example = f"at {cast(str, trip.stay_address)}" if trip.stay_address is not None and cast(str, trip.stay_address) != '' else 'General city area'
    
    prompt = f"""
    You are an expert AI trip planner. Your task is to create a detailed, daily itinerary for a trip based on the provided user details.
    Today's Date: {today_date_str}
    
    **Trip Details:**
    - Trip Name: "{trip.name}"
    - Destination City: "{trip.city}"
    - Number of Travelers: {trip.num_travelers}
    - Start Date: {start_dt.strftime('%Y-%m-%d')}
    - End Date: {end_dt.strftime('%Y-%m-%d')}
    - Trip Duration: {duration_days} days
    {preferences_str}{budget_str}
    {stay_address_str}

    **Important Instructions for Itinerary Generation:**
    1.  **Output Format:** Your entire response MUST be a valid JSON object strictly adhering to the following Pydantic schema structure. Do NOT include any additional text, markdown, or commentary outside of the JSON. Ensure all required fields are present and types match.
    2.  **Daily Plans:** Provide a plan for each day of the trip ({duration_days} days).
    3.  **Activities:** Each day must have a list of activities.
        * `time`: **Provide specific times in 12-hour format (e.g., '9:00 AM', '1:30 PM', '7:00 PM'). Do NOT use general periods like Morning/Afternoon/Lunch/Evening/Night.**
        * `name`: A concise name for the activity.
        * `description`: A brief (1-2 sentence) description.
        * `location`: A general location (e.g., "Eiffel Tower area") or a specific address if a well-known landmark. Assume travel time between locations.
        * `estimated_duration_minutes`: Provide a reasonable estimate (integer, >= 5).
        * `transportation`: Suggest how to get there (e.g., "Walk", "Metro", "Taxi", "Bus", "Uber/Lyft").
        * `cost_usd`: Provide an estimated cost in USD (float, >= 0) if applicable (e.g., for tickets, meals, transport). Use 0.0 for free activities.
    4.  **Dates:** Ensure the `day_date` in each `DailyPlan` is accurate and sequential starting from the `trip.start_date`. **Crucially, ensure `day_date` is formatted as a strict "YYYY-MM-DD" string.**
    5.  **Personalization:** Tailor the itinerary to the `activity_preferences`. **Strictly adhere to the budget constraints for all cost estimations.**
    6.  **Budget Constraint:** The **total estimated cost of the itinerary MUST NOT exceed the total trip budget**. It should ideally stay within or just below the total budget.
    7.  **Logistics:** Consider distances between attractions within a day. Group activities geographically to minimize travel.
    8.  **Realism:** Suggest realistic opening hours, typical durations, and general costs for well-known attractions. If specific times/costs are unknown, provide reasonable estimates or leave optional fields `null`.
    9.  **Comprehensive Itinerary:** Include typical travel events like checking into accommodation (if applicable) and major meals (breakfast, lunch, dinner) where appropriate.

    **Output Schema (Strictly follow this structure. Do not deviate.):**
    ```json
    {{
      "title": "A creative, fun, and descriptive title based on the itinerary's main themes and highlights (e.g., 'Parisian Romance & Art Extravaganza')",
      "duration_days": {duration_days},
      "daily_plans": [
        {{
          "day_number": 1,
          "day_date": "{start_dt.strftime('%Y-%m-%d')}",
          "theme": "Arrival and Exploration",
          "activities": [
            {{
              "time": "3:00 PM",
              "name": "Check-in at accommodation",
              "description": "Settle into your accommodation.",
              "location": "{accommodation_location_example}",
              "estimated_duration_minutes": 60,
              "transportation": "Taxi/Public Transport from Airport",
              "cost_usd": 0.0
            }},
            {{
              "time": "7:30 PM",
              "name": "Welcome Dinner",
              "description": "Enjoy a casual dinner at a local restaurant.",
              "location": "Near your accommodation",
              "estimated_duration_minutes": 90,
              "transportation": "Walk",
              "cost_usd": 30.0
            }}
          ]
        }},
        {{
          "day_number": 2,
          "day_date": "{(start_dt + timedelta(days=1)).strftime('%Y-%m-%d')}",
          "theme": "Culture and Landmarks",
          "activities": [
            {{
              "time": "9:00 AM",
              "name": "Main City Landmark (e.g., Museum, Historical Site)",
              "description": "Explore the city's main cultural attraction.",
              "location": "Specific address or landmark name",
              "estimated_duration_minutes": 180,
              "transportation": "Public Transport",
              "cost_usd": 20.0
            }},
            {{
              "time": "12:30 PM",
              "name": "Local Cafe",
              "description": "Grab a quick and authentic lunch.",
              "location": "Near landmark",
              "estimated_duration_minutes": 60,
              "transportation": "Walk",
              "cost_usd": 15.0
            }}
          ]
        }}
      ],
      "notes": "General tips for your trip, e.g., currency, emergency numbers, local customs. Ensure this is concise."
    }}
    ```
    Ensure the `day_date` fields are strictly `YYYY-MM-DD` strings. Provide actual dates based on the trip's start date. The `title`, `duration_days`, `daily_plans`, and `notes` fields must always be present in the final JSON output.
    """
    return prompt

def generate_itinerary(db: Session, trip_id: int) -> Itinerary:
    """
    Generates an itinerary for a given trip using the Gemini API and saves it to the database.
    """
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise ValueError(f"Trip with ID {trip_id} not found.")

    prompt_content = generate_itinerary_prompt(trip)
    
    response = model.generate_content(prompt_content)
    
    try:
        generated_json_str = response.text
        
        json_start = generated_json_str.find('{')
        json_end = generated_json_str.rfind('}') + 1
        
        if json_start != -1 and json_end != -1 and json_end > json_start:
            clean_json_str = generated_json_str[json_start:json_end]
        else:
            clean_json_str = generated_json_str

        itinerary_data_dict = json.loads(clean_json_str)
        
        itinerary_content = ItineraryContent.model_validate(itinerary_data_dict)

        total_cost = 0.0
        total_duration = 0
        for daily_plan in itinerary_content.daily_plans:
            for activity in daily_plan.activities:
                if activity.cost_usd is not None:
                    total_cost += activity.cost_usd
                if activity.estimated_duration_minutes is not None:
                    total_duration += activity.estimated_duration_minutes

        latest_version = db.query(func.max(Itinerary.version)).filter(Itinerary.trip_id == trip.id).scalar() or 0
        new_version = latest_version + 1

        db_itinerary = Itinerary(
            trip_id=trip.id,
            user_id=trip.user_id,
            generated_at=datetime.now(),
            version=new_version,
            plan_data=json.loads(itinerary_content.model_dump_json()),
            total_estimated_cost=total_cost,
            total_estimated_duration_minutes=total_duration
        )

        db.add(db_itinerary)
        db.commit()
        db.refresh(db_itinerary)
        
        return db_itinerary

    except ValidationError as e:
        print(f"Pydantic validation error for AI response: {e.errors()}")
        print(f"Raw AI text response (failed validation):\n{generated_json_str}")
        raise ValueError(f"AI response did not match expected itinerary schema: {e.errors()}")
    except json.JSONDecodeError as e:
        print(f"JSON decoding error from AI response: {e}")
        print(f"Raw AI text response (failed JSON parse):\n{generated_json_str}")
        raise ValueError("AI response was not valid JSON.")
    except Exception as e:
        print(f"An unexpected error occurred during AI itinerary generation: {e}")
        print(f"Raw AI text response (if available):\n{response.text if 'response' in locals() else 'N/A'}")
        raise RuntimeError(f"Failed to generate itinerary: {e}")