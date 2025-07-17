import React from 'react';
import { useAuth } from '../AuthContext';

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

  // At this point, TypeScript knows 'user' is not null
  return (
    <div className="page-container">
      <h2>Welcome to your Dashboard, {user.first_name}!</h2>
      <p>This is where you'll plan your trips.</p>
      <p>Your email: {user.email}</p>
      {/* Add more dashboard content here */}
    </div>
  );
};

export default Dashboard;
