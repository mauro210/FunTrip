import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import TripPlanningForm from "./pages/TripPlanningForm";
import MyTrips from "./pages/MyTrips";
import EditTripForm from "./pages/EditTripForm";
import { AuthProvider, useAuth } from "./AuthContext";
import "./App.css"; // Import global styles
import ItineraryList from "./pages/ItineraryList";
import ItineraryDetails from "./pages/ItineraryDetails";

// PrivateRoute component to protect routes
const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({
  children,
}) => {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return <div className="page-container">Loading authentication...</div>;
  }

  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        {" "}
        {/* Wrap the entire app with AuthProvider */}
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} /> {/* Simple home page */}
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            {/* Protected Dashboard Route */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            {/* Protected Trip Planning Form Route */}
            <Route
              path="/plan-trip"
              element={
                <PrivateRoute>
                  <TripPlanningForm />
                </PrivateRoute>
              }
            />
            {/* Protected My Trips Route */}
            <Route
              path="/my-trips"
              element={
                <PrivateRoute>
                  <MyTrips />
                </PrivateRoute>
              }
            />
            {/* Protected Edit Trip Route with dynamic ID */}
            <Route
              path="/edit-trip/:tripId"
              element={
                <PrivateRoute>
                  <EditTripForm />
                </PrivateRoute>
              }
            />
            {/* Protected Itinerary List Route */}
            <Route
              path="/itineraries/:tripId"
              element={
                <PrivateRoute>
                  <ItineraryList />
                </PrivateRoute>
              }
            />
            {/* Protected Itinerary Details Route */}
            <Route
              path="/itinerary-details/:itineraryId"
              element={
                <PrivateRoute>
                  <ItineraryDetails />
                </PrivateRoute>
              }
            />
            {/* Fallback for unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </AuthProvider>
    </Router>
  );
}

// Simple Home Page Component
const Home: React.FC = () => (
  <div className="page-container">
    <h2>Welcome to FunTrip!</h2>
    <p>Plan your perfect trip with the power of AI.</p>
  </div>
);

export default App;
