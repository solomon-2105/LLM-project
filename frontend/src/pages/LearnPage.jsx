// file: frontend/src/pages/LearnPage.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown'; // <-- NEW IMPORT
import YouTubeEmbed from '../components/YouTubeEmbed'; // <-- NEW IMPORT
import './LearnPage.css';

const API_URL = "http://localhost:5000";

function LearnPage({ user }) {
  // State for the dropdown structure
  const [contentStructure, setContentStructure] = useState(null);
  
  // State for what the user has selected
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");

  // State for the lists in the dropdowns
  const [classList, setClassList] = useState([]);
  const [subjectList, setSubjectList] = useState([]);
  const [topicList, setTopicList] = useState([]);

  // State for the content to display
  const [notes, setNotes] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // 1. Fetch the app structure (classes, subjects, topics)
  useEffect(() => {
    axios.get(`${API_URL}/api/content`)
      .then(response => {
        setContentStructure(response.data);
        setClassList(Object.keys(response.data));
      })
      .catch(error => console.error("Error fetching content structure:", error));
  }, []);

  // 2. Fetch AI Notes and Video when topic changes
  useEffect(() => {
    if (selectedClass && selectedSubject && selectedTopic) {
      setIsLoading(true);
      setError("");
      setNotes("");
      setVideoUrl("");
      
      axios.post(`${API_URL}/api/get-topic-details`, {
        class: selectedClass,
        subject: selectedSubject,
        topic: selectedTopic
      })
      .then(response => {
        setNotes(response.data.notes);
        setVideoUrl(response.data.video_url);
        setIsLoading(false);
        // Save topic info for the test page
        localStorage.setItem('currentTopic', JSON.stringify({
            topic: selectedTopic,
            subject: selectedSubject
        }));
      })
      .catch(error => {
        console.error("Error fetching topic details:", error);
        setError("Failed to load notes for this topic. Please try again.");
        setIsLoading(false);
      });
    }
  }, [selectedTopic, selectedSubject, selectedClass]); // Re-run when any of these change

  // --- Dropdown Handlers ---
  const handleClassChange = (e) => {
    const newClass = e.target.value;
    setSelectedClass(newClass);
    setSelectedSubject("");
    setSelectedTopic("");
    setSubjectList(newClass ? Object.keys(contentStructure[newClass]) : []);
    setTopicList([]);
    setNotes(""); setVideoUrl(""); setError("");
  };

  const handleSubjectChange = (e) => {
    const newSubject = e.target.value;
    setSelectedSubject(newSubject);
    setSelectedTopic("");
    setTopicList(newSubject ? contentStructure[selectedClass][newSubject] : []);
    setNotes(""); setVideoUrl(""); setError("");
  };

  const handleTopicChange = (e) => {
    setSelectedTopic(e.target.value);
    // The useEffect hook will handle fetching
  };

  const username = user.split('@')[0];

  return (
    <div className="learn-page">
      <h1>Welcome back, {username}!</h1>
      <p>Let's get started. Choose what you want to learn today.</p>
      
      <div className="selection-container">
        <select value={selectedClass} onChange={handleClassChange}><option value="">Select a Class</option>
          {classList.map(c => (<option key={c} value={c}>{c}</option>))}
        </select>
        
        {selectedClass && (
          <select value={selectedSubject} onChange={handleSubjectChange}><option value="">Select a Subject</option>
            {subjectList.map(s => (<option key={s} value={s}>{s}</option>))}
          </select>
        )}
        
        {selectedSubject && (
          <select value={selectedTopic} onChange={handleTopicChange}><option value="">Select a Topic</option>
            {topicList.map(t => (<option key={t} value={t}>{t}</option>))}
          </select>
        )}
      </div>

      {/* --- Display Content Area --- */}
      <div className="content-container">
        {isLoading && <h3>Generating your notes...</h3>}
        {error && <p className="error">{error}</p>}
        
        {notes && (
          <div className="notes-box">
            <h2>AI-Generated Notes: {selectedTopic}</h2>
            <ReactMarkdown>{notes}</ReactMarkdown>
          </div>
        )}
        
        {videoUrl && (
          <>
            <h2>Video Lesson</h2>
            <YouTubeEmbed videoUrl={videoUrl} />
          </>
        )}
        
        {notes && !isLoading && (
          <div className="test-link-container">
            <Link to="/test" className="test-link">
              Ready? Take the Test on {selectedTopic} →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default LearnPage;