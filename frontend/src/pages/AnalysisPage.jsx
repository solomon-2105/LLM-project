import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AnalysisPage.css';

const API_URL = "http://localhost:5000";

function YouTubeEmbed({ videoUrl }) {
  const videoId = videoUrl.split('v=')[1]?.split('&')[0];
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;
  return (
    <div className="video-container">
      <iframe
        src={embedUrl}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Embedded YouTube Video"
      ></iframe>
    </div>
  );
}

function AnalysisPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [analysisData] = useState(location.state?.analysis || []);
  const [topicInfo] = useState(location.state?.topicInfo || null);
  const [scoreData] = useState(location.state?.scoreData || null);

  if (!analysisData || analysisData.length === 0) {
    return (
      <div>
        {scoreData && (
          <div className="score-box">
            <h2>Your Score</h2>
            <div className="score-display">
              {scoreData.correct} / {scoreData.total}
            </div>
            <div className="score-percentage">
              ({scoreData.percentage.toFixed(0)}%)
            </div>
          </div>
        )}
        <h1>No Analysis Found</h1>
        <p>You may have gotten a perfect score, or an error occurred.</p>
        <button onClick={() => navigate('/')}>Back to Learn</button>
      </div>
    );
  }

  const takeDynamicTest = async () => {
    const weak_concepts = analysisData.map(a => a.concept_name);
    try {
      const response = await axios.post(`${API_URL}/api/generate-dynamic-test`, {
        topic: topicInfo.topic,
        weak_concepts: weak_concepts,
      });
      localStorage.setItem('currentQuiz', JSON.stringify(response.data));
      localStorage.setItem('currentTopicName', `Dynamic Test: ${topicInfo.topic}`);
      navigate('/test');
    } catch (error) {
      console.error("Error generating dynamic test:", error);
      alert("Failed to create dynamic test.");
    }
  };

  return (
    <div className="analysis-page">
      {scoreData && (
        <div className="score-box">
          <h2>Your Score</h2>
          <div className="score-display">
            {scoreData.correct} / {scoreData.total}
          </div>
          <div className="score-percentage">
            ({scoreData.percentage.toFixed(0)}%)
          </div>
        </div>
      )}

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
