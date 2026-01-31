import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth, API_BASE_URL } from "../AuthContext";
import ConfirmModal from "../components/ConfirmModal";

// Define types for the data returned by the backend (only minimal structure needed for reference)
interface ItineraryContent {
  title: string;
  duration_days: number;
  daily_plans: any[]; // Simplified type for rendering
  notes?: string;
}

interface Itinerary {
  id: number;
  trip_id: number;
  user_id: number;
  generated_at: string;
  version: number;
  plan_data: ItineraryContent;
  total_estimated_cost?: number;
  total_estimated_duration_minutes?: number;
}

const ItineraryList: React.FC = () => {
  // Get Guest context values
  const { token, isGuest, guestTrips, updateGuestTrip } = useAuth();
  const navigate = useNavigate();
  const { tripId } = useParams<{ tripId: string }>();

  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [tripName, setTripName] = useState<string>("");
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itineraryToDelete, setItineraryToDelete] = useState<{
    id: number;
    title: string;
  } | null>(null);

  // --- Fetch Data (Handles Guest vs Real) ---
  const loadData = async () => {
    if (!tripId) return;
    setIsFetching(true);

    // GUEST LOGIC: Load from Memory
    if (isGuest) {
      const id = parseInt(tripId);
      const foundTrip = guestTrips.find((t: any) => t.id === id);

      if (foundTrip) {
        setTripName(foundTrip.name);
        // Guest trips might not have 'itineraries' array initialized yet
        setItineraries(foundTrip.itineraries || []);
      } else {
        setError("Trip not found in guest session.");
      }
      setIsFetching(false);
      return;
    }

    // REAL USER LOGIC: Fetch from API
    if (!token) {
      setIsFetching(false);
      return;
    }

    try {
      // 1. Fetch Trip Name
      const tripRes = await fetch(`${API_BASE_URL}/trips/${tripId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (tripRes.ok) {
        const tripData = await tripRes.json();
        setTripName(tripData.name);
      }

      // 2. Fetch Itineraries
      const itinRes = await fetch(
        `${API_BASE_URL}/itineraries/trip/${tripId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (itinRes.ok) {
        const itinData = await itinRes.json();
        setItineraries(itinData);
      } else {
        setError("Failed to fetch itineraries.");
      }
    } catch (err) {
      setError("Network error.");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token, tripId, isGuest, guestTrips]); // Re-run if guestTrips updates

  // --- Generate Itinerary ---
  const handleGenerateItinerary = async () => {
    if (!tripId) return;

    setIsGenerating(true);
    setError(null);

    // --- GUEST LOGIC: Call Stateless Endpoint ---
    if (isGuest) {
      const currentTrip = guestTrips.find(
        (t: any) => t.id === parseInt(tripId)
      );
      if (!currentTrip) {
        setError("Trip data lost. Please try again.");
        setIsGenerating(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/itineraries/generate/guest`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // No Authorization header needed for guest endpoint
            },
            body: JSON.stringify({
              name: currentTrip.name, 
              city: currentTrip.city,
              stay_address: currentTrip.stay_address || null,
              start_date: currentTrip.start_date,
              end_date: currentTrip.end_date,
              num_travelers: currentTrip.num_travelers,
              budget_per_person: currentTrip.budget_per_person,
              activity_preferences: currentTrip.activity_preferences,
            }),
          }
        );

        if (response.ok) {
          const rawItinerary = await response.json();
          
          const existingItineraries: Itinerary[] = currentTrip.itineraries || [];

          // 1. Calculate the correct Next Version based on frontend history
          // Find the highest current version (default to 0 if list is empty)
          const maxVersion = existingItineraries.reduce(
              (max, item) => (item.version > max ? item.version : max), 
              0
          );
          const nextVersion = maxVersion + 1;

          // 2. Create the final object with the corrected version
          const newItinerary = {
              ...rawItinerary,
              version: nextVersion 
          };
          
          // 3. Prepend to array so it shows up at the top (Newest First)
          const updatedTrip = {
              ...currentTrip,
              itineraries: [newItinerary, ...existingItineraries] 
          };
          
          updateGuestTrip(updatedTrip);

          // UI will auto-update due to useEffect dependency
        } else {
          const errorData = await response.json();
          // Handle Rate Limiting specifically
          if (response.status === 429) {
            setError(
              "You are generating itineraries too quickly. Please wait a moment."
            );
          } else {
            setError(errorData.detail || "Failed to generate itinerary.");
          }
        }
      } catch (err) {
        setError("Network error or server unreachable.");
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    // --- REAL USER LOGIC: Call Database Endpoint ---
    if (!token) {
      setError("Auth Error.");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/itineraries/generate/${tripId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        loadData(); // Re-fetch from DB
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to generate itinerary.");
      }
    } catch (err) {
      setError("Network error.");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Delete Itinerary ---
  const confirmDelete = (itineraryId: number, itineraryTitle: string) => {
    setItineraryToDelete({ id: itineraryId, title: itineraryTitle });
    setIsDeleteModalOpen(true);
  };

  const executeDeleteItinerary = async () => {
    if (!itineraryToDelete || !tripId) {
      setIsDeleteModalOpen(false);
      return;
    }

    // GUEST LOGIC: Delete from Memory
    if (isGuest) {
      const currentTrip = guestTrips.find(
        (t: any) => t.id === parseInt(tripId)
      );
      if (currentTrip && currentTrip.itineraries) {
        const updatedItins = currentTrip.itineraries.filter(
          (i: any) => i.id !== itineraryToDelete.id
        );
        const updatedTrip = { ...currentTrip, itineraries: updatedItins };
        updateGuestTrip(updatedTrip);
      }
      setIsDeleteModalOpen(false);
      setItineraryToDelete(null);
      return;
    }

    // REAL USER LOGIC: Delete from API
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/itineraries/${itineraryToDelete.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 204) {
        setItineraries((prev) =>
          prev.filter((itin) => itin.id !== itineraryToDelete.id)
        );
      } else {
        setError("Failed to delete.");
      }
    } catch (err) {
      setError("Network error.");
    } finally {
      setIsDeleteModalOpen(false);
      setItineraryToDelete(null);
    }
  };

  if (isFetching) {
    return <div className="page-container">Loading itineraries...</div>;
  }

  const displayTripName = tripName || "Trip";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
      }}
    >
      <div style={{ width: "100%", maxWidth: "800px" }}>
        <button
          onClick={() => navigate("/my-trips")}
          className="navbar-button"
          style={{
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span>&larr;</span> Back
        </button>
      </div>

      <div className="page-container" style={{ margin: "0 0 2rem 0" }}>
        <h2>Itineraries for {displayTripName}</h2>

        {error && (
          <div className="error-message" style={{ marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        <button
          onClick={handleGenerateItinerary}
          className="navbar-button"
          disabled={isGenerating}
          style={{ marginBottom: "1.5rem" }}
        >
          {isGenerating ? "Generating..." : "Generate New Itinerary"}
        </button>

        {itineraries.length === 0 ? (
          <p>No itineraries generated yet.</p>
        ) : (
          <div className="itinerary-list-container">
            {itineraries.map((itinerary) => (
              <div key={itinerary.id} className="itinerary-card">
                <h3>{itinerary.plan_data.title}</h3>
                <p>
                  <strong>Version:</strong> {itinerary.version}
                </p>
                <p>
                  <strong>Generated On:</strong>{" "}
                  {new Date(itinerary.generated_at).toLocaleDateString()}
                </p>
                <div className="itinerary-card-actions">
                  <button
                    onClick={() =>
                      navigate(`/itinerary-details/${itinerary.id}`)
                    }
                    className="navbar-button"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() =>
                      confirmDelete(itinerary.id, itinerary.plan_data.title)
                    }
                    className="navbar-button delete-button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <ConfirmModal
          isOpen={isDeleteModalOpen}
          message={`Are you sure you want to delete itinerary "${itineraryToDelete?.title}"?`}
          onConfirm={executeDeleteItinerary}
          onCancel={() => setIsDeleteModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default ItineraryList;
