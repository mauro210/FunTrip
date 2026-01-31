import React, { useEffect, useState } from "react";
import { useAuth, API_BASE_URL } from "../AuthContext";
import { Link, useNavigate } from "react-router-dom";
import ConfirmModal from "../components/ConfirmModal";

// Define a type for the Itinerary data as received from the backend
interface Itinerary {
  id: number;
  title: string;
  version: number;
  generated_at: string;
}

// Define a type for the Trip data as received from the backend
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
  itineraries: Itinerary[];
}

const MyTrips: React.FC = () => {
  const { token, user, isLoading, isGuest, guestTrips, removeGuestTrip } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const fetchTrips = async () => {
    // If not logged in and not a guest, stop.
    if (!token && !isGuest) {
      setIsFetching(false);
      return;
    }

    // GUEST LOGIC: Load from memory
    if (isGuest) {
      // Cast guestTrips to Trip[] to satisfy TypeScript
      setTrips(guestTrips as Trip[]);
      setIsFetching(false);
      return;
    }
    // REAL USER LOGIC: Load from API
    try {
      const response = await fetch(`${API_BASE_URL}/trips/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
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

  useEffect(() => {
    // Determine if we can load data
    if (!isLoading) {
       if (user || isGuest) {
         fetchTrips();
       } else {
         setIsFetching(false); // Not auth, not guest -> stop loading
       }
    }
    // Add guestTrips to dependency array so the list updates immediately when a guest creates/deletes a trip
  }, [token, user, isLoading, isGuest, guestTrips]);

  const confirmDelete = (tripId: number, tripName: string) => {
    setTripToDelete({ id: tripId, name: tripName });
    setIsModalOpen(true);
  };

  const handleCancelDelete = () => {
    setIsModalOpen(false);
    setTripToDelete(null);
  };

  const executeDeleteTrip = async () => {
    // Safety check: ensure a trip is selected
    if (!tripToDelete) {
      setError("No trip selected for deletion.");
      setIsModalOpen(false);
      return;
    }

    // GUEST LOGIC: Delete from memory
    if (isGuest) {
      removeGuestTrip(tripToDelete.id);
      setIsModalOpen(false);
      setTripToDelete(null);
      return;
    }

    // REAL USER LOGIC: Delete from API
    // We check for token here. If no token and not guest, it's an auth error.
    if (!token) {
        setError("Authentication error.");
        setIsModalOpen(false);
        return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/trips/${tripToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 204) {
        setTrips((prevTrips) =>
          prevTrips.filter((trip) => trip.id !== tripToDelete.id)
        );
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to delete trip.");
        console.error("Delete trip error:", errorData);
      }
    } catch (err) {
      setError("Network error or server is unreachable.");
      console.error("Delete trip network error:", err);
    } finally {
      setIsModalOpen(false);
      setTripToDelete(null);
    }
  };

  // Function to navigate to the itinerary list page
  const handleViewItineraries = (tripId: number) => {
    navigate(`/itineraries/${tripId}`);
  };

  const handleEditTrip = (tripId: number) => {
    navigate(`/edit-trip/${tripId}`);
  };

  if (isLoading || isFetching) {
    return <div className="page-container">Loading your trips...</div>;
  }

  if (error) {
    return (
      <div
        className="page-container error-message"
        style={{ whiteSpace: "pre-wrap" }}
      >
        {error}
      </div>
    );
  }

  if (!user && !isGuest) {
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
                <strong>City:</strong> {trip.city}
              </p>
              {trip.stay_address && (
                <p>
                  <strong>Where You're Staying:</strong> {trip.stay_address}
                </p>
              )}
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
              <div className="trip-card-actions">
                <button
                  onClick={() => handleViewItineraries(trip.id)}
                  className="navbar-button"
                >
                  View Itineraries
                </button>
                <button
                  onClick={() => handleEditTrip(trip.id)}
                  className="navbar-button"
                >
                  Edit Trip
                </button>
                <button
                  onClick={() => confirmDelete(trip.id, trip.name)}
                  className="navbar-button"
                >
                  Delete Trip
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={isModalOpen}
        message={`Are you sure you want to delete trip "${tripToDelete?.name}"? This action cannot be undone.`}
        onConfirm={executeDeleteTrip}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default MyTrips;
