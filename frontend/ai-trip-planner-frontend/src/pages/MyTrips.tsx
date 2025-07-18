import React, { useEffect, useState } from "react";
import { useAuth, API_BASE_URL } from "../AuthContext";
import { Link } from "react-router-dom";

// Define a type for your Trip data as received from the backend
interface Trip {
  id: number;
  name: string;
  destination: string;
  start_date: string; // Dates often come as strings from API
  end_date: string;
  num_travelers: number;
  budget_per_person: number | null;
  activity_preferences: string[] | null;
  user_id: number;
}

const MyTrips: React.FC = () => {
  const { token, user, isLoading } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState<boolean>(true);

  useEffect(() => {
    const fetchTrips = async () => {
      if (!token || !user) {
        setIsFetching(false);
        return; // Don't fetch if not authenticated
      }

      try {
        const response = await fetch(`${API_BASE_URL}/trips/`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`, // Include the JWT token
          },
        });

        if (response.ok) {
          const data: Trip[] = await response.json();
          setTrips(data);
        } else {
          const errorData = await response.json();
          setError(errorData.detail || "Failed to fetch trips.");
          console.error("Fetch trips error:", errorData);
        }
      } catch (err) {
        setError("Network error or server is unreachable.");
        console.error("Fetch trips network error:", err);
      } finally {
        setIsFetching(false);
      }
    };

    // Only fetch if not currently loading auth and user is available
    if (!isLoading && user) {
      fetchTrips();
    }
  }, [token, user, isLoading]); // Re-run when token or user changes, or loading state resolves

  if (isLoading || isFetching) {
    return <div className="page-container">Loading your trips...</div>;
  }

  if (error) {
    return <div className="page-container error-message">{error}</div>;
  }

  if (!user) {
    // Should be caught by PrivateRoute, but good defensive check
    return (
      <div className="page-container">Please log in to view your trips.</div>
    );
  }

  return (
    <div className="page-container">
      <h2>My Trips</h2>
      <Link
        to="/plan-trip"
        className="navbar-button"
        style={{ marginBottom: "1.5rem", display: "inline-block" }}
      >
        Plan a New Trip
      </Link>

      {trips.length === 0 ? (
        <p>
          You haven't planned any trips yet. Click "Plan a New Trip" to get
          started!
        </p>
      ) : (
        <div className="trip-list-container">
          {trips.map((trip) => (
            <div key={trip.id} className="trip-card">
              <h3>{trip.name}</h3>
              <p>
                <strong>Destination:</strong> {trip.destination}
              </p>
              <p>
                <strong>Dates:</strong> {trip.start_date} to {trip.end_date}
              </p>
              <p>
                <strong>Travelers:</strong> {trip.num_travelers}
              </p>
              {trip.budget_per_person !== null && (
                <p>
                  <strong>Budget/Person:</strong> ${trip.budget_per_person}
                </p>
              )}
              {trip.activity_preferences &&
                trip.activity_preferences.length > 0 && (
                  <p>
                    <strong>Preferences:</strong>{" "}
                    {trip.activity_preferences.join(", ")}
                  </p>
                )}
              {/* Link to view itinerary (future phase) */}
              <button className="navbar-button">
                View Itinerary (Coming Soon)
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTrips;
