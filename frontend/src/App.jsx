import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import LearnPage from './pages/LearnPage';
import TestPage from './pages/TestPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProfilePage from './pages/ProfilePage';
import AnalysisPage from './pages/AnalysisPage'; // <-- NEW
import Navbar from './components/Navbar';
import './index.css';

function App() {
  const [user, setUser] = useState(localStorage.getItem("username"));

  const handleLogin = (username) => {
    localStorage.setItem("username", username);
    setUser(username);
  };

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("currentTopic"); // Clear topic on logout
    setUser(null);
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
      <div className="app-container">
        <Navbar username={user} onLogout={handleLogout} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<LearnPage user={user} />} />
            <Route path="/test" element={<TestPage user={user} />} />
            <Route path="/analysis" element={<AnalysisPage user={user} />} /> {/* <-- NEW */}
            <Route path="/analytics" element={<AnalyticsPage user={user} />} />
            <Route path="/profile" element={<ProfilePage user={user} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
  );
}
export default App;