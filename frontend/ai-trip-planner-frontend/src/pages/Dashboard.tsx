import React from 'react';
import { useAuth } from '../AuthContext';
import { Link } from 'react-router-dom'; // Import Link for navigation

const Dashboard: React.FC = () => {
  const { user, isLoading } = useAuth(); 

  // Explicitly handle loading state within Dashboard, or if user somehow becomes null
  if (isLoading || !user) {
    return (
      <div className="page-container">
        <p>Loading user data or not authenticated...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h2>Welcome to your Dashboard, {user.first_name}!</h2>
      <p>This is where you'll plan your trips.</p>
      <p>Your email: {user.email}</p>

      <div className="dashboard-actions">
        {/* Button to navigate to the trip planning form */}
        <Link to="/plan-trip" className="auth-button">
          Plan a New Trip
        </Link>
        {/* Button to navigate to the list of existing trips */}
        <Link to="/my-trips" className="auth-button">
          View My Trips
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
