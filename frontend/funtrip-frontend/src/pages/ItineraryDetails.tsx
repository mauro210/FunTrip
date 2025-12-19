import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth, API_BASE_URL } from "../AuthContext";

// --- Interfaces that match the Backend Data Structure ---
interface Activity {
  time: string;
  name: string;
  description?: string;
  location?: string;
  estimated_duration_minutes?: number;
  transportation?: string;
  cost_usd?: number;
}

interface DailyPlan {
  day_number: number;
  day_date: string; // ISO string format
  theme?: string;
  activities: Activity[];
}

interface ItineraryContent {
  title: string;
  duration_days: number;
  daily_plans: DailyPlan[];
  notes?: string;
}

interface Itinerary {
  id: number;
  generated_at: string;
  version: number;
  plan_data: ItineraryContent;
  total_estimated_cost?: number;
  total_estimated_duration_minutes?: number;
}

const ItineraryDetails: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { itineraryId } = useParams<{ itineraryId: string }>();

  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItineraryDetails = async () => {
    if (!token || !itineraryId) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/itineraries/${itineraryId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data: Itinerary = await response.json();
        setItinerary(data);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to load itinerary details.");
      }
    } catch (err) {
      setError("Network error or server is unreachable.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItineraryDetails();
  }, [token, itineraryId]);

  if (isLoading)
    return <div className="page-container">Loading your adventure...</div>;

  if (error) {
    return (
      <div className="page-container error-message">
        <h3>Error Loading Itinerary</h3>
        <p>{error}</p>
        <button onClick={() => navigate(-1)} className="navbar-button">
          Go Back
        </button>
      </div>
    );
  }

  if (!itinerary)
    return <div className="page-container">Itinerary not found.</div>;

  const { plan_data } = itinerary;

  return (
    /* 1. Wrapper to center everything on the page */
    <div style={{ maxWidth: "900px", margin: "2rem auto", padding: "0 1rem" }}>
      {/* 2. Back Button - Sits outside the white card */}
      <button
        onClick={() => navigate(-1)}
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

      {/* 3. The Main Card Container */}
      <div
        className="page-container itinerary-details-container"
        style={{
          margin: "0",
          maxWidth: "100%",
        }} /* Override default margins since wrapper handles it */
      >
        {/* Header Section */}
        <div className="itinerary-header">
          <div className="header-content">
            <h1>{plan_data.title}</h1>
            <div className="itinerary-meta">
              <span className="meta-tag">
                🗓️ {plan_data.duration_days} Days
              </span>
              {itinerary.total_estimated_cost !== undefined &&
                itinerary.total_estimated_cost !== null && (
                  <span className="meta-tag">
                    💰 Est. Total: ${itinerary.total_estimated_cost.toFixed(0)}
                  </span>
                )}
              <span className="meta-tag">🤖 Version {itinerary.version}</span>
            </div>
          </div>
        </div>

        {/* AI Notes Section (if available) */}
        {plan_data.notes && (
          <div className="notes-box">
            <h3>💡 Notes</h3>
            <p>{plan_data.notes}</p>
          </div>
        )}

        {/* Daily Plans List */}
        <div className="days-container">
          {plan_data.daily_plans.map((day) => (
            <div key={day.day_number} className="day-card">
              <div className="day-header">
                <h2>Day {day.day_number}</h2>
                <div className="day-date-theme">
                  <span className="date-text">
                    {new Date(day.day_date).toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  {day.theme && (
                    <span className="theme-badge">{day.theme}</span>
                  )}
                </div>
              </div>

              <div className="timeline">
                {day.activities.map((activity, index) => (
                  <div key={index} className="timeline-item">
                    <div className="timeline-time">{activity.time}</div>
                    <div className="timeline-content">
                      <h3>{activity.name}</h3>
                      <p className="description">{activity.description}</p>

                      <div className="activity-details-grid">
                        {activity.location && (
                          <div className="detail-item">
                            📍 {activity.location}
                          </div>
                        )}
                        {activity.cost_usd !== undefined &&
                          activity.cost_usd > 0 && (
                            <div className="detail-item">
                              💵 ${activity.cost_usd.toFixed(2)}
                            </div>
                          )}
                        {activity.transportation && (
                          <div className="detail-item">
                            🚗 {activity.transportation}
                          </div>
                        )}
                        {activity.estimated_duration_minutes && (
                          <div className="detail-item">
                            ⏱️ {activity.estimated_duration_minutes} min
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ItineraryDetails;
