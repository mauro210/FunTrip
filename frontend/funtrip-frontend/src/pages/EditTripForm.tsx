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

const EditTripForm: React.FC = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { tripId } = useParams<{ tripId: string }>();

  const [initialTripName, setInitialTripName] = useState("");
  const [tripName, setTripName] = useState("");
  const [city, setCity] = useState("");
  const [stayAddress, setStayAddress] = useState<string>("");

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

  // Effect to fetch existing trip data
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
          setStayAddress(data.stay_address || "");
          setStartDate(data.start_date);
          setEndDate(data.end_date);
          setNumTravelers(data.num_travelers);
          setBudgetPerPerson(
            data.budget_per_person !== null
              ? data.budget_per_person.toString()
              : ""
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

    fetchTripData();
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
    if (!tripName || !startDate || !endDate) {
      setError(
        "Please fill in all required fields (Name, Start Date, End Date)."
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

    try {
      const response = await fetch(`${API_BASE_URL}/trips/${tripId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: tripName,
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
        const updatedTrip = await response.json();
        setSuccess(
          `Trip "${updatedTrip.name}" updated successfully! Redirecting to My Trips...`
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
          setError(errorData.detail || "Failed to update trip.");
        }
        console.error("Trip update error:", errorData);
      }
    } catch (err) {
      setError(
        "Network error or server is unreachable. Please check your internet connection."
      );
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
            disabled
          />
        </div>

        <div className="form-group">
          <label htmlFor="stayAddress">Where You're Staying (Optional):</label>
          <input
            type="text"
            id="stayAddress"
            ref={stayAddressInputRef}
            value={stayAddress}
            placeholder="e.g., Hotel, Airbnb, specific address"
            disabled
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
