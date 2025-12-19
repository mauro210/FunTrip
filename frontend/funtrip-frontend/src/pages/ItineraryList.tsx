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

// Interface for fetching the base trip name
interface BaseTrip {
  name: string;
}

const ItineraryList: React.FC = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { tripId } = useParams<{ tripId: string }>();

  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [tripName, setTripName] = useState<string>(""); // State for the actual trip name
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itineraryToDelete, setItineraryToDelete] = useState<{
    id: number;
    title: string;
  } | null>(null);

  // Function to fetch the base trip name
  const fetchTripName = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/trips/${tripId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data: BaseTrip = await response.json();
        setTripName(data.name);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to load trip details.");
      }
    } catch (err) {
      setError("Network error or server is unreachable.");
    }
  };

  // Fetch itineraries when the component mounts
  const fetchItineraries = async () => {
    if (!token || !user || !tripId) {
      setIsFetching(false);
      return;
    }

    // Run this first, since it is essential for the page title
    await fetchTripName();

    try {
      const response = await fetch(
        `${API_BASE_URL}/itineraries/trip/${tripId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data: Itinerary[] = await response.json();
        setItineraries(data);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to fetch itineraries.");
      }
    } catch (err) {
      setError("Network error or server is unreachable.");
    } finally {
      setIsFetching(false);
    }
  };

  // Fetch itineraries on component mount or when tripId/token changes
  useEffect(() => {
    if (token && tripId) {
      fetchItineraries();
    }
  }, [token, tripId]);

  // Function to generate a new itinerary
  const handleGenerateItinerary = async () => {
    if (!token || !tripId) {
      setError("Authentication error or missing trip ID.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/itineraries/generate/${tripId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        // If generation is successful, re-fetch the list to show the new itinerary
        await fetchItineraries();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to generate itinerary.");
      }
    } catch (err) {
      setError("Network error or server is unreachable.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Functions for deleting an itinerary
  const confirmDelete = (itineraryId: number, itineraryTitle: string) => {
    setItineraryToDelete({ id: itineraryId, title: itineraryTitle });
    setIsDeleteModalOpen(true);
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setItineraryToDelete(null);
  };

  const executeDeleteItinerary = async () => {
    if (!token || !itineraryToDelete) {
      setError("Authentication error or no itinerary selected for deletion.");
      setIsDeleteModalOpen(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/itineraries/${itineraryToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 204) {
        setItineraries((prevItineraries) =>
          prevItineraries.filter((itin) => itin.id !== itineraryToDelete.id)
        );
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to delete itinerary.");
      }
    } catch (err) {
      setError("Network error or server is unreachable.");
    } finally {
      setIsDeleteModalOpen(false);
      setItineraryToDelete(null);
    }
  };

  if (isFetching) {
    return <div className="page-container">Loading itineraries...</div>;
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

  // Use the actual tripName from state
  const displayTripName = tripName || "Trip";

  return (
    /* 1. Wrapper: Flex column that centers content, but has no width limits itself */
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
      }}
    >
      {/* 2. Back Button Container: constrained to 800px to match the card below */}
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

      {/* 3. Main Card: We rely purely on the CSS class 'page-container' for sizing */
      /* We just remove the margin so it sits closer to the button */}
      <div className="page-container" style={{ margin: "0 0 2rem 0" }}>
        <h2>Itineraries for {displayTripName}</h2>

        <button
          onClick={handleGenerateItinerary}
          className="navbar-button"
          disabled={isGenerating}
          style={{ marginBottom: "1.5rem" }}
        >
          {isGenerating ? "Generating..." : "Generate New Itinerary"}
        </button>

        {itineraries.length === 0 ? (
          <p>
            No itineraries have been generated yet. Click "Generate New
            Itinerary" to get started!
          </p>
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
          message={`Are you sure you want to delete itinerary "${itineraryToDelete?.title}"? This action cannot be undone.`}
          onConfirm={executeDeleteItinerary}
          onCancel={handleCancelDelete}
        />
      </div>
    </div>
  );
};

export default ItineraryList;
