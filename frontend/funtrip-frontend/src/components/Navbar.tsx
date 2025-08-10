import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext'; 

const Navbar: React.FC = () => {
  const { user, logout, isLoading } = useAuth(); // Get user, logout, isLoading from context

  if (isLoading) {
    return (
      <nav className="navbar">
        <div className="navbar-brand">AI Trip Planner</div>
        <div className="navbar-links">Loading...</div>
      </nav>
    );
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">AI Trip Planner</Link>
      </div>
      <div className="navbar-links">
        {user ? (
          <>
            <span>Welcome, {user.username}!</span>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/plan-trip">Plan Trip</Link> 
            <Link to="/my-trips">My Trips</Link>   
            <button onClick={logout} className="navbar-button">Logout</button>
          </>
        ) : (
          <>
            <Link to="/register">Register</Link>
            <Link to="/login">Login</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
