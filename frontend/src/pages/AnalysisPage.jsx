import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AnalysisPage.css'; // We'll create this

const API_URL = "http://localhost:5000";

function YouTubeEmbed({ videoUrl }) {
  const videoId = videoUrl.split('v=')[1]?.split('&')[0];
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;
  return (
    <div className="video-container">
      <iframe src={embedUrl} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Embedded YouTube Video"></iframe>
    </div>
  );
}

function AnalysisPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // analysisData and topicInfo are passed from the TestPage
  const [analysisData, setAnalysisData] = useState(location.state?.analysis || []);
  const [topicInfo, setTopicInfo] = useState(location.state?.topicInfo || null);
  
  if (!analysisData || analysisData.length === 0) {
    return (
      <div>
        <h1>No Analysis Found</h1>
        <p>You may have gotten a perfect score, or an error occurred.</p>
        <button onClick={() => navigate('/')}>Back to Learn</button>
      </div>
    );
  }

  // This is a "recursive" feature.
  // We re-use the TestPage to take the new dynamic test.
  const takeDynamicTest = async () => {
    const weak_concepts = analysisData.map(a => a.concept_name);
    
    try {
      // 1. Generate the new test
      const response = await axios.post(`${API_URL}/api/generate-dynamic-test`, {
        topic: topicInfo.topic,
        weak_concepts: weak_concepts
      });
      
      // 2. Save this new test data to localStorage
      // We'll hijack the 'currentQuiz' key that TestPage looks for
      localStorage.setItem('currentQuiz', JSON.stringify(response.data));
      localStorage.setItem('currentTopicName', `Dynamic Test: ${topicInfo.topic}`);
      
      // 3. Navigate to TestPage
      // It will now load our new dynamic test!
      navigate('/test');
      
    } catch (error) {
      console.error("Error generating dynamic test:", error);
      alert("Failed to create dynamic test.");
    }
  };

  return (
    <div className="analysis-page">
      <h1>Your Test Analysis for {topicInfo?.topic}</h1>
      <p>You seem to be struggling with the following concepts. Let's review!</p>
      
      {analysisData.map((item, index) => (
        <div key={index} className="analysis-item">
          <h2>Concept: {item.concept_name}</h2>
          
          <h3>🧠 Explanation</h3>
          <p>{item.explanation}</p>
          
          <h3>📺 Video to Watch</h3>
          <YouTubeEmbed videoUrl={item.video_url} />
          
          <h3>✏️ Practice Questions</h3>
          {item.practice_questions.map((q, qIndex) => (
            <div key={qIndex} className="practice-q">
              <strong>{qIndex + 1}. {q.question}</strong>
              <ul>
                {Object.entries(q.options).map(([key, value]) => (
                  <li key={key}><strong>{key}:</strong> {value}</li>
                ))}
              </ul>
              <p><em>Correct Answer: {q.answer}</em></p>
            </div>
          ))}
        </div>
      ))}
      
      <div className="dynamic-test-box">
        <h2>Ready to try again?</h2>
        <p>Let's take a new test focusing on just these weak areas.</p>
        <button onClick={takeDynamicTest} className="dynamic-btn">
          Generate Dynamic Assessment
        </button>
      </div>
    </div>
  );
}
export default AnalysisPage;