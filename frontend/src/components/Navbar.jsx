import React from 'react';
import { NavLink } from 'react-router-dom';

function Navbar({ username, onLogout }) {
  return (
    <nav className="sidebar">
      <h2>Welcome,</h2>
      <h3>{username}</h3>
      
      <NavLink to="/">📚 Learn</NavLink>
      <NavLink to="/analytics">📊 Analytics</NavLink>
      <NavLink to="/profile">👤 Profile</NavLink>
      
      <button onClick={onLogout}>Logout</button>
    </nav>
  );
}
export default Navbar;