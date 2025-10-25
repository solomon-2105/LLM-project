import React, { useState } from 'react';
import axios from 'axios';

const API_URL = "http://localhost:5000";

function LoginPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); 
    const endpoint = isLogin ? "/api/login" : "/api/register";
    const url = `${API_URL}${endpoint}`;

    try {
      const response = await axios.post(url, { username, password });
      if (isLogin) {
        onLogin(response.data.username);
      } else {
        alert("Registration successful! Please log in.");
        setIsLogin(true);
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.data.error);
      } else {
        setError("Network error. Is the backend server running?");
      }
    }
  };

  return (
    <div className="login-container">
      <h1>🤖 AI Tutor</h1>
      <div className="tabs">
        <div className={`tab ${isLogin ? 'active' : ''}`} onClick={() => setIsLogin(true)}>Login</div>
        <div className={`tab ${!isLogin ? 'active' : ''}`} onClick={() => setIsLogin(false)}>Register</div>
      </div>
      <div className="login-form">
        <form onSubmit={handleSubmit}>
          <label htmlFor="username">Username (Email)</label>
          <input type="email" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <label htmlFor="password">Password</label>
          <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit">{isLogin ? "Login" : "Register"}</button>
          {error && <p className="error">{error}</p>}
        </form>
      </div>
    </div>
  );
}
export default LoginPage;