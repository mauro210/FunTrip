import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
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
  const { token, isGuest, isLoading } = useAuth();

  if (isLoading) {
    return <div className="page-container">Loading authentication...</div>;
  }

  // ALLOW access if there is a real token OR if guest mode is active
  return (token || isGuest) ? children : <Navigate to="/" replace />;
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
            {/* Guest confirmation page */}
            <Route path="/continue-as-guest" element={<GuestLanding />} />
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

// Home Page Component
const Home: React.FC = () => {
  const navigate = useNavigate();
  const { token, isGuest } = useAuth();

  // If already logged in or in guest mode, go straight to dashboard
  if (token || isGuest) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="page-container">
      <h2>Welcome to FunTrip!</h2>
      <p>Plan your perfect trip with the power of AI.</p>
      
      <div className="dashboard-actions">
        <button onClick={() => navigate("/login")} className="auth-button">
          Login
        </button>
        <button onClick={() => navigate("/register")} className="auth-button">
          Register
        </button>
        <button onClick={() => navigate("/continue-as-guest")} className="auth-button">
          Continue as Guest
        </button>
      </div>
    </div>
  );
};

// Guest Landing Component
const GuestLanding: React.FC = () => {
  const navigate = useNavigate();
  const { loginAsGuest } = useAuth();

  const handleStartGuestMode = () => {
    loginAsGuest();
    navigate("/dashboard");
  };

  return (
    <div className="page-container">
      <h2>Continue as Guest</h2>
      <p style={{ margin: "0rem 0", color: "#555", lineHeight: "1.6" }}>
        Continue as Guest lets you explore all features without creating an account. 
        <br />
        Trips and itineraries created in guest mode are temporary and won’t be saved once you leave the app.
      </p>
      <button onClick={handleStartGuestMode} className="auth-button" style={{ marginTop: "2rem" }}>
        Start Guest Session
      </button>
    </div>
  );
};

export default App;
