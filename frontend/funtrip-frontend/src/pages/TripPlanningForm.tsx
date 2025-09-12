import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, API_BASE_URL } from "../AuthContext";

// Define a type for the geographic data we want to store from a selected place
interface PlaceGeoData {
  name: string; // The primary name (e.g., "Dallas")
  country: string; // The country (e.g., "United States")
  locality: string; // The city/locality component (e.g., "Dallas")
  placeId: string; // Google Place ID (unique identifier)
  lat: number;
  lng: number;
}

const TripPlanningForm: React.FC = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [tripName, setTripName] = useState("");
  const [city, setCity] = useState("");
  const [isCityValidSelection, setIsCityValidSelection] =
    useState<boolean>(false);
  const [selectedCityGeoData, setSelectedCityGeoData] =
    useState<PlaceGeoData | null>(null);

  const [stayAddress, setStayAddress] = useState<string>("");
  const [isStayAddressValidSelection, setIsStayAddressValidSelection] =
    useState<boolean>(false);
  const [selectedStayAddressGeoData, setSelectedStayAddressGeoData] =
    useState<PlaceGeoData | null>(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [numTravelers, setNumTravelers] = useState(1);
  const [budgetPerPerson, setBudgetPerPerson] = useState<string>("");
  const [activityPreferences, setActivityPreferences] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const cityInputRef = useRef<HTMLInputElement>(null);
  const stayAddressInputRef = useRef<HTMLInputElement>(null);

  const availablePreferences = [
    "Highlights",
    "Adventure",
    "Culture",
    "Entertainment",
    "Shopping",
    "Nature",
    "History",
    "Photography",
    "Nightlife",
    "Family",
    "Food",
    "Relaxation",
  ];

  const handlePreferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setActivityPreferences((prev) =>
      checked ? [...prev, value] : prev.filter((pref) => pref !== value)
    );
  };

  // Helper to extract relevant geo data from a Google Place result
  const extractGeoData = (
    place: google.maps.places.PlaceResult
  ): PlaceGeoData | null => {
    if (!place || !place.place_id) return null;

    const countryComponent = place.address_components?.find((comp) =>
      comp.types.includes("country")
    );
    const localityComponent = place.address_components?.find((comp) =>
      comp.types.includes("locality")
    ); // City/locality

    if (!place.geometry?.location) {
      throw new Error("Selected place does not have coordinates");
    }

    return {
      placeId: place.place_id,
      name: place.name || place.formatted_address || "", // Use name or formatted_address
      country: countryComponent?.long_name || "",
      locality: localityComponent?.long_name || "",
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    };
  };

  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
      if (cityInputRef.current) {
        const cityAutocomplete = new window.google.maps.places.Autocomplete(
          cityInputRef.current,
          { types: ["(cities)"] }
        );
        cityAutocomplete.addListener("place_changed", () => {
          const place = cityAutocomplete.getPlace();
          if (place.formatted_address) {
            setCity(place.formatted_address);
            setIsCityValidSelection(true);
            setSelectedCityGeoData(extractGeoData(place)); // Store geo data
          } else if (place.name) {
            setCity(place.name);
            setIsCityValidSelection(true);
            setSelectedCityGeoData(extractGeoData(place)); // Store geo data
          } else {
            setIsCityValidSelection(false);
            setSelectedCityGeoData(null); // Clear geo data
          }
        });
      }

      if (stayAddressInputRef.current) {
        const stayAddressAutocomplete =
          new window.google.maps.places.Autocomplete(
            stayAddressInputRef.current,
            { types: ["establishment", "geocode"] }
          );
        stayAddressAutocomplete.addListener("place_changed", () => {
          const place = stayAddressAutocomplete.getPlace();
          if (place.formatted_address) {
            setStayAddress(place.formatted_address);
            setIsStayAddressValidSelection(true);
            setSelectedStayAddressGeoData(extractGeoData(place)); // Store geo data
          } else if (place.name) {
            setStayAddress(place.name);
            setIsStayAddressValidSelection(true);
            setSelectedStayAddressGeoData(extractGeoData(place)); // Store geo data
          } else {
            setIsStayAddressValidSelection(false);
            setSelectedStayAddressGeoData(null); // Clear geo data
          }
        });
      }
    } else {
      console.warn(
        "Google Maps API (Places Library) not loaded. Autocomplete will not function."
      );
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token) {
      setError("You must be logged in to create a trip.");
      return;
    }

    // Basic client-side validation for required fields
    if (!tripName || !city || !startDate || !endDate) {
      setError(
        "Please fill in all required fields (Name, City, Start Date, End Date)."
      );
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError("Start date cannot be after end date.");
      return;
    }
    if (numTravelers < 1) {
      setError("Number of travelers must be at least 1.");
      return;
    }
    // Autocomplete selection validation
    if (!isCityValidSelection) {
      setError(
        'Please select a valid city from the autocomplete suggestions for "City".'
      );
      return;
    }
    // Geographic consistency validation for stay_address
    if (stayAddress) {
      // Only validate if stayAddress is provided
      if (!isStayAddressValidSelection) {
        setError(
          'Please select a valid address for "Where You\'re Staying" from the autocomplete suggestions, or leave it empty.'
        );
        return;
      }

      function haversineDistance(
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
      ): number {
        const toRad = (x: number): number => (x * Math.PI) / 180;
        const R = 6371; // Earth radius in km
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // distance in km
      }
      // Check if the selected stay address is consistent with the selected city
      if (selectedCityGeoData && selectedStayAddressGeoData) {
        const cityLat = selectedCityGeoData.lat;
        const cityLng = selectedCityGeoData.lng;
        const stayLat = selectedStayAddressGeoData.lat;
        const stayLng = selectedStayAddressGeoData.lng;

        const cityRadiusKm = 50;

        if (
          haversineDistance(cityLat, cityLng, stayLat, stayLng) > cityRadiusKm
        ) {
          setError(
            `"Where You're Staying" must be located in the selected city.`
          );
          return;
        }
      } else {
        // This case should ideally not happen if isStayAddressValidSelection is true, but good for robustness
        setError(
          'Could not verify geographic data for "Where You\'re Staying". Please try selecting it again.'
        );
        return;
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/trips/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: tripName,
          city: city,
          stay_address: stayAddress || null,
          start_date: startDate,
          end_date: endDate,
          num_travelers: numTravelers,
          budget_per_person: budgetPerPerson
            ? parseFloat(budgetPerPerson)
            : null,
          activity_preferences: activityPreferences,
        }),
      });

      if (response.ok) {
        const newTrip = await response.json();
        setSuccess(
          `Trip "${newTrip.name}" created successfully! Redirecting to My Trips...`
        );
        setTimeout(() => navigate("/my-trips"), 1500);
      } else {
        const errorData = await response.json();
        if (
          response.status === 422 &&
          errorData.detail &&
          Array.isArray(errorData.detail)
        ) {
          const messages = errorData.detail
            .map((err: any) => {
              const loc = err.loc ? err.loc.join(".") + ": " : "";
              return `${loc}${err.msg}`;
            })
            .join("\n");
          setError(`Validation Error:\n${messages}`);
        } else {
          setError(errorData.detail || "Failed to create trip.");
        }
        console.error("Trip creation error:", errorData);
      }
    } catch (err) {
      setError(
        "Network error or server is unreachable. Please check your internet connection."
      );
      console.error("Trip creation network error:", err);
    }
  };

  if (!user) {
    return <div className="page-container">Please log in to plan a trip.</div>;
  }

  return (
    <div className="page-container">
      <h2>Plan a New Trip</h2>
      <form onSubmit={handleSubmit} className="trip-form">
        {error && (
          <p className="error-message" style={{ whiteSpace: "pre-wrap" }}>
            {error}
          </p>
        )}
        {success && <p className="success-message">{success}</p>}

        <div className="form-group">
          <label htmlFor="tripName">Trip Name:</label>
          <input
            type="text"
            id="tripName"
            value={tripName}
            onChange={(e) => setTripName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="city">City:</label>
          <input
            type="text"
            id="city"
            ref={cityInputRef}
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setIsCityValidSelection(false);
              setSelectedCityGeoData(null); // Clear geo data on change
            }}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="stayAddress">Where You're Staying (Optional):</label>
          <input
            type="text"
            id="stayAddress"
            ref={stayAddressInputRef}
            value={stayAddress}
            onChange={(e) => {
              setStayAddress(e.target.value);
              setIsStayAddressValidSelection(false);
              setSelectedStayAddressGeoData(null); // Clear geo data on change
            }}
            placeholder="e.g., Hotel, Airbnb, specific address"
          />
        </div>

        <div className="form-group">
          <label htmlFor="startDate">Start Date:</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="endDate">End Date:</label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="numTravelers">Number of Travelers:</label>
          <input
            type="number"
            id="numTravelers"
            value={numTravelers}
            onChange={(e) =>
              setNumTravelers(Math.max(1, parseInt(e.target.value) || 1))
            }
            min="1"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="budgetPerPerson">
            Budget Per Person (USD, optional):
          </label>
          <input
            type="number"
            id="budgetPerPerson"
            value={budgetPerPerson}
            onChange={(e) => setBudgetPerPerson(e.target.value)}
            min="0"
            step="0.01"
          />
        </div>

        <div className="form-group">
          <label>Activity Preferences (select all that apply):</label>
          <div className="preferences-checkbox-group">
            {availablePreferences.map((pref) => (
              <label key={pref} className="checkbox-label">
                <input
                  type="checkbox"
                  value={pref}
                  checked={activityPreferences.includes(pref)}
                  onChange={handlePreferenceChange}
                />
                {pref}
              </label>
            ))}
          </div>
        </div>

        <button type="submit" className="auth-button">
          Create Trip
        </button>
      </form>
    </div>
  );
};

export default TripPlanningForm;
