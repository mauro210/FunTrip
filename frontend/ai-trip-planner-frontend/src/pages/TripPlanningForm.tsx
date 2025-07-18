import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API_BASE_URL } from '../AuthContext'; 

const TripPlanningForm: React.FC = () => {
  const { token, user } = useAuth(); // Get token and user from AuthContext
  const navigate = useNavigate();

  const [tripName, setTripName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [numTravelers, setNumTravelers] = useState(1);
  const [budgetPerPerson, setBudgetPerPerson] = useState<string>(''); // Use string for input
  const [activityPreferences, setActivityPreferences] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Available activity preferences for checkboxes
  const availablePreferences = [
    'Nature', 'Architecture', 'Museums', 'Food', 'Outdoors',
    'Adventure', 'Nightlife', 'Relaxation', 'Shopping', 'History'
  ];

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

    if (!token) {
      setError('You must be logged in to create a trip.');
      return;
    }

    // Basic client-side validation
    if (!tripName || !destination || !startDate || !endDate) {
      setError('Please fill in all required fields (Name, Destination, Start Date, End Date).');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be after end date.');
      return;
    }
    if (numTravelers < 1) {
      setError('Number of travelers must be at least 1.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/trips/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Include the JWT token
        },
        body: JSON.stringify({
          name: tripName,
          destination,
          start_date: startDate,
          end_date: endDate,
          num_travelers: numTravelers,
          // Convert budget to number or null
          budget_per_person: budgetPerPerson ? parseFloat(budgetPerPerson) : null,
          activity_preferences: activityPreferences,
        }),
      });

      if (response.ok) {
        const newTrip = await response.json();
        setSuccess(`Trip "${newTrip.name}" created successfully! Redirecting to My Trips...`);
        setTimeout(() => navigate('/my-trips'), 1500);
      } else {
        const errorData = await response.json();
        if (response.status === 422 && errorData.detail && Array.isArray(errorData.detail)) {
          const messages = errorData.detail.map((err: any) => {
            const loc = err.loc ? err.loc.join('.') + ': ' : '';
            return `${loc}${err.msg}`;
          }).join('\n');
          setError(`Validation Error:\n${messages}`);
        } else {
          setError(errorData.detail || 'Failed to create trip.');
        }
        console.error('Trip creation error:', errorData);
      }
    } catch (err) {
      setError('Network error or server is unreachable. Please check your internet connection.');
      console.error('Trip creation network error:', err);
    }
  };

  if (!user) {
    // This case should be mostly handled by PrivateRoute, but good fallback
    return <div className="page-container">Please log in to plan a trip.</div>;
  }

  return (
    <div className="page-container">
      <h2>Plan a New Trip</h2>
      <form onSubmit={handleSubmit} className="trip-form">
        {error && <p className="error-message" style={{ whiteSpace: 'pre-wrap' }}>{error}</p>}
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
          <label htmlFor="destination">Destination:</label>
          <input
            type="text"
            id="destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            required
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
            onChange={(e) => setNumTravelers(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="budgetPerPerson">Budget Per Person (USD, optional):</label>
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

        <button type="submit" className="auth-button">Create Trip</button>
      </form>
    </div>
  );
};

export default TripPlanningForm;
