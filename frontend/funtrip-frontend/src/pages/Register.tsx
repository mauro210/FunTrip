import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../AuthContext';
import { useAuth } from '../AuthContext';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth(); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // --- Client-Side Validation ---
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (username.length < 2) {
      setError('Username must be at least 2 characters.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    // Basic email regex
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('Please enter a valid email address.');
        return;
    }
    // --- End Client-Side Validation ---

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          first_name: firstName,
          last_name: lastName,
          password,
        }),
      });

      if (response.ok) {
        const data = await response.json(); // Get the token data from response
        await login(data.access_token); // Automatically log in
        setSuccess('Registration successful! Redirecting to dashboard...');
        setTimeout(() => navigate('/dashboard'), 1000); // Redirect faster
      } else {
        const errorData = await response.json();
        // --- Robust Backend Error Display ---
        if (response.status === 400 && errorData.detail) {
          setError(errorData.detail); // For "Username/email already registered"
        } else if (response.status === 422 && errorData.detail && Array.isArray(errorData.detail)) {
          // FastAPI validation errors come as an array in 'detail'
          const messages = errorData.detail.map((err: any) => {
            const loc = err.loc ? err.loc.join('.') + ': ' : '';
            return `${loc}${err.msg}`;
          }).join('\n'); // Join multiple errors with a newline
          setError(`Validation Error:\n${messages}`);
        } else {
          setError(errorData.detail || 'Registration failed due to an unknown error.');
        }
        console.error('Registration error details:', errorData);
      }
    } catch (err) {
      setError('Network error or server is unreachable. Please check your internet connection and ensure the backend server is running.');
      console.error('Registration error:', err);
    }
  };

  return (
    <div className="auth-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        {/* Display errors with newlines for multiple messages */}
        {error && <p className="error-message" style={{ whiteSpace: 'pre-wrap' }}>{error}</p>}
        {success && <p className="success-message">{success}</p>}
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="firstName">First Name:</label>
          <input
            type="text"
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="lastName">Last Name:</label>
          <input
            type="text"
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
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
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="auth-button">Register</button>
      </form>
    </div>
  );
};

export default Register;
