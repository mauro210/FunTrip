import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  type ReactNode,
} from "react";

// Base URL for the backend API
export const API_BASE_URL = "https://funtrip-backend.onrender.com";

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
  login: (accessToken: string) => Promise<void>;
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
    } else {
      setUser(null);
      setIsLoading(false);
    }
  }, [token]);

  // Login function
  const login = async (accessToken: string) => {
    localStorage.setItem("accessToken", accessToken);
    setToken(accessToken);
    setIsLoading(true); // Set loading true while fetching user data
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("accessToken");
    setToken(null);
    setUser(null);
  };

  // Provide the context values to children
  return (
    <AuthContext.Provider value={{ token, user, login, logout, isLoading }}>
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
