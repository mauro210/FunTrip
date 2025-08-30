import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth, API_BASE_URL } from "../AuthContext";

// Define a type for your Trip data as received from the backend
interface Trip {
  id: number;
  name: string;
  city: string;
  stay_address: string | null;
  start_date: string;
  end_date: string;
  num_travelers: number;
  budget_per_person: number | null;
  activity_preferences: string[] | null;
  user_id: number;
}

// Define a type for the geographic data we want to store from a selected place
interface PlaceGeoData {
  name: string;      // The primary name (e.g., "Dallas")
  country: string;   // The country (e.g., "United States")
  locality: string;  // The city/locality component (e.g., "Dallas")
  placeId: string;   // Google Place ID (unique identifier)
}

const EditTripForm: React.FC = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { tripId } = useParams<{ tripId: string }>();

  const [initialTripName, setInitialTripName] = useState("");
  const [tripName, setTripName] = useState("");
  const [city, setCity] = useState("");
  const [isCityValidSelection, setIsCityValidSelection] = useState<boolean>(false);
  const [selectedCityGeoData, setSelectedCityGeoData] = useState<PlaceGeoData | null>(null); 

  const [stayAddress, setStayAddress] = useState<string>("");
  const [isStayAddressValidSelection, setIsStayAddressValidSelection] = useState<boolean>(false);
  const [selectedStayAddressGeoData, setSelectedStayAddressGeoData] = useState<PlaceGeoData | null>(null); 

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [numTravelers, setNumTravelers] = useState(1);
  const [budgetPerPerson, setBudgetPerPerson] = useState<string>("");
  const [activityPreferences, setActivityPreferences] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoadingTrip, setIsLoadingTrip] = useState<boolean>(true);

  const cityInputRef = useRef<HTMLInputElement>(null);
  const stayAddressInputRef = useRef<HTMLInputElement>(null);

  const availablePreferences = [
    'Highlights', 'Adventure', 'Culture', 'Entertainment', 'Shopping', 'Nature', 
    'History', 'Photography', 'Nightlife', 'Family', 'Food', 'Relaxation' 
  ];

  // Helper to extract relevant geo data from a Google Place result
  const extractGeoData = (place: google.maps.places.PlaceResult): PlaceGeoData | null => {
    if (!place || !place.place_id) return null;

    const countryComponent = place.address_components?.find(comp => comp.types.includes('country'));
    const localityComponent = place.address_components?.find(comp => comp.types.includes('locality')); // City/locality

    return {
      placeId: place.place_id,
      name: place.name || place.formatted_address || '',
      country: countryComponent?.long_name || '',
      locality: localityComponent?.long_name || '',
    };
  };

  // Effect to fetch existing trip data and initialize Autocomplete
  useEffect(() => {
    const fetchTripData = async () => {
      if (!token || !user || !tripId) {
        setIsLoadingTrip(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/trips/${tripId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data: Trip = await response.json();
          setInitialTripName(data.name);
          setTripName(data.name);
          setCity(data.city);
          setIsCityValidSelection(true);
          // For initial load, we assume the city from DB is valid and its geo data is "known"
          // We don't have the full place object, so we'll simulate the minimum needed for comparison
          setSelectedCityGeoData({
            placeId: '', // No placeId from simple string
            name: data.city,
            country: '', // This will ideally be populated by a server-side call or a more complex initial load if ever needed for full data
            locality: data.city.split(',')[0].trim() // Basic parsing for locality
          });

          setStayAddress(data.stay_address || "");
          setIsStayAddressValidSelection(!!data.stay_address);
          // For initial load, simulate geo data for stay_address if it exists
          if (data.stay_address) {
            setSelectedStayAddressGeoData({
                placeId: '', // No placeId from simple string
                name: data.stay_address,
                country: '',
                locality: '' // Will try to derive from string or leave empty for now
            });
          } else {
            setSelectedStayAddressGeoData(null);
          }

          setStartDate(data.start_date);
          setEndDate(data.end_date);
          setNumTravelers(data.num_travelers);
          setBudgetPerPerson(
            data.budget_per_person !== null ? data.budget_per_person.toString() : ""
          );
          setActivityPreferences(data.activity_preferences || []);
        } else {
          const errorData = await response.json();
          setError(errorData.detail || "Failed to load trip data.");
          console.error("Fetch trip data error:", errorData);
        }
      } catch (err) {
        setError("Network error or server is unreachable.");
        console.error("Fetch trip data network error:", err);
      } finally {
        setIsLoadingTrip(false);
      }
    };

    const initAutocomplete = () => {
        if (window.google && window.google.maps && window.google.maps.places) {
            if (cityInputRef.current) {
                const cityAutocomplete = new window.google.maps.places.Autocomplete(
                    cityInputRef.current,
                    { types: ['(cities)'] }
                );
                cityAutocomplete.addListener('place_changed', () => {
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
                const stayAddressAutocomplete = new window.google.maps.places.Autocomplete(
                    stayAddressInputRef.current,
                    { types: ['establishment', 'geocode'] }
                );
                stayAddressAutocomplete.addListener('place_changed', () => {
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
            console.warn("Google Maps API (Places Library) not loaded. Autocomplete will not function.");
        }
    };

    fetchTripData().then(() => {
        setTimeout(initAutocomplete, 100);
    });

  }, [token, user, tripId]);

  const handlePreferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setActivityPreferences((prev) =>
      checked ? [...prev, value] : prev.filter((pref) => pref !== value)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token || !tripId) {
      setError("Authentication error or missing trip ID.");
      return;
    }

    // Client-side validation
    if (!tripName || !city || !startDate || !endDate) {
      setError("Please fill in all required fields (Name, City, Start Date, End Date).");
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
        setError('Please select a valid city from the autocomplete suggestions for "City".');
        return;
    }
    if (stayAddress) { // Only validate if stayAddress is not empty
        if (!isStayAddressValidSelection) {
            setError('Please select a valid address for "Where You\'re Staying" from the autocomplete suggestions, or leave it empty.');
            return;
        }
        // Geographic consistency validation
        if (selectedCityGeoData && selectedStayAddressGeoData) {
            const cityCountry = selectedCityGeoData.country.toLowerCase();
            const stayCountry = selectedStayAddressGeoData.country.toLowerCase();
            const cityLocality = selectedCityGeoData.locality.toLowerCase();
            const stayLocality = selectedStayAddressGeoData.locality.toLowerCase();

            // Check if countries match AND (if both localities exist and match OR stay_address locality is empty)
            // This allows for addresses that might not have a specific 'locality' component
            if (cityCountry !== stayCountry || (cityLocality && stayLocality && cityLocality !== stayLocality)) {
                setError(`"Where You're Staying" must be located in the selected city.`);
                return;
            }
        } else {
            setError('Could not verify geographic data for "Where You\'re Staying". Please try selecting it again from the suggestions.');
            return;
        }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/trips/${tripId}`, {
        method: "PUT",
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
          budget_per_person: budgetPerPerson ? parseFloat(budgetPerPerson) : null,
          activity_preferences: activityPreferences,
        }),
      });

      if (response.ok) {
        const updatedTrip = await response.json();
        setSuccess(`Trip "${updatedTrip.name}" updated successfully! Redirecting to My Trips...`);
        setTimeout(() => navigate("/my-trips"), 1500);
      } else {
        const errorData = await response.json();
        if (response.status === 422 && errorData.detail && Array.isArray(errorData.detail)) {
          const messages = errorData.detail
            .map((err: any) => {
              const loc = err.loc ? err.loc.join(".") + ": " : "";
              return `${loc}${err.msg}`;
            })
            .join("\n");
          setError(`Validation Error:\n${messages}`);
        } else {
          setError(errorData.detail || "Failed to update trip.");
        }
        console.error("Trip update error:", errorData);
      }
    } catch (err) {
      setError("Network error or server is unreachable. Please check your internet connection.");
      console.error("Trip update network error:", err);
    }
  };

  if (isLoadingTrip || !user) {
    return <div className="page-container">Loading trip details...</div>;
  }

  return (
    <div className="page-container">
      <h2>Edit Trip: {initialTripName}</h2>
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

        <div className="form-actions-buttons">
          <button type="submit" className="auth-button">
            Update Trip
          </button>
          <button
            type="button"
            onClick={() => navigate("/my-trips")}
            className="navbar-button"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditTripForm;