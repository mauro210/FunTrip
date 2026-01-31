import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  type ReactNode,
} from "react";

// Base URL for the backend API
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Define the shape of our authentication context
interface AuthContextType {
  token: string | null;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  } | null;
  isGuest: boolean; // Track guest status
  guestTrips: any[]; // Array to store guest trips
  login: (accessToken: string) => Promise<void>;
  loginAsGuest: () => void; // Function to trigger guest mode
  addGuestTrip: (trip: any) => void; // Function to add a trip
  removeGuestTrip: (id: number) => void; // Function to remove a trip
  updateGuestTrip: (updatedTrip: any) => void; // Function to update a trip
  logout: () => void;
  isLoading: boolean;
}

// Create the context with a default (null) value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define props for the AuthProvider
interface AuthProviderProps {
  children: ReactNode;
}

// AuthProvider component to wrap the app and provide the context
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("accessToken")
  );
  // Initialize isGuest from sessionStorage so it persists 
  // until the tab is closed, but not across separate visits.
  const [isGuest, setIsGuest] = useState<boolean>(
    sessionStorage.getItem("isGuest") === "true"
  );
  const [guestTrips, setGuestTrips] = useState<any[]>([]);
  const [user, setUser] = useState<{
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Function to fetch user data from /auth/me endpoint
  const fetchUser = async (accessToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsGuest(false); // Ensure guest mode is off if a real user logs in
      } else {
        // If token is invalid or expired, clear it
        console.error("Failed to fetch user data:", response.statusText);
        setToken(null);
        localStorage.removeItem("accessToken");
        setUser(null);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setToken(null);
      localStorage.removeItem("accessToken");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to load user data when token changes or on initial load
  useEffect(() => {
    if (token) {
      fetchUser(token);
    } else if (isGuest) {
      // If guest, set a mock user so the UI has a name to display
      setUser({
        id: 0,
        username: "GuestUser",
        email: "guest@example.com",
        first_name: "Guest",
        last_name: "Explorer",
      });
      setIsLoading(false);
    } else {
      setUser(null);
      setIsLoading(false);
    }
  }, [token, isGuest]);

  // Login function
  const login = async (accessToken: string) => {
    localStorage.setItem("accessToken", accessToken);
    sessionStorage.removeItem("isGuest"); // Clear guest mode on real login
    setIsGuest(false);
    setToken(accessToken);
    setIsLoading(true); // Set loading true while fetching user data
  };

  // Function to enter Guest Mode
  const loginAsGuest = () => {
    sessionStorage.setItem("isGuest", "true");
    setIsGuest(true);
    setToken(null); // Guests don't have real tokens
    localStorage.removeItem("accessToken");
  };

  const addGuestTrip = (trip: any) => {
    setGuestTrips((prevTrips) => [...prevTrips, trip]);
  };

  const removeGuestTrip = (id: number) => {
  setGuestTrips((prev) => prev.filter((trip) => trip.id !== id));
  };

  const updateGuestTrip = (updatedTrip: any) => {
    setGuestTrips((prevTrips) =>
      prevTrips.map((trip) => (trip.id === updatedTrip.id ? updatedTrip : trip))
    );
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("accessToken");
    sessionStorage.removeItem("isGuest");
    setToken(null);
    setUser(null);
    setIsGuest(false);
    setGuestTrips([]); // Clear trips on logout
  };

  // Provide the context values to children
  return (
    <AuthContext.Provider value={{ token, user, isGuest, guestTrips, login, loginAsGuest, addGuestTrip, removeGuestTrip, updateGuestTrip, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to easily consume the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
