import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, API_BASE_URL } from "../AuthContext"; 

const Login: React.FC = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth(); // Use the login function from AuthContext

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // FastAPI's OAuth2PasswordRequestForm expects 'username' and 'password'
    // even if 'username' can be an email.
    const formData = new URLSearchParams();
    formData.append("username", usernameOrEmail);
    formData.append("password", password);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded", // Important for OAuth2PasswordRequestForm
        },
        body: formData.toString(),
      });

      if (response.ok) {
        const data = await response.json();
        await login(data.access_token); // Use the login function from context
        navigate("/dashboard"); // Redirect to dashboard on successful login
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Login failed.");
      }
    } catch (err) {
      setError("Network error or server is unreachable.");
      console.error("Login error:", err);
    }
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        {error && <p className="error-message">{error}</p>}
        <div className="form-group">
          <label htmlFor="usernameOrEmail">Username or Email:</label>
          <input
            type="text"
            id="usernameOrEmail"
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="auth-button">
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
