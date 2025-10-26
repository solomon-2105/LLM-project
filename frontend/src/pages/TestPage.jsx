import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './TestPage.css';

const API_URL = "http://localhost:5000";

function TestPage({ user }) {
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [topicInfo, setTopicInfo] = useState(null);
  
  const navigate = useNavigate();

  // Load test on page mount
  useEffect(() => {
    const topicData = JSON.parse(localStorage.getItem('currentTopic'));
    if (!topicData) {
      navigate('/'); // No topic selected, go back to Learn
      return;
    }
    setTopicInfo(topicData);

    // Fetch test from Gemini
    axios.post(`${API_URL}/api/generate-test`, { topic: topicData.topic })
      .then(response => {
        setQuestions(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error generating test:", error);
        alert("Failed to generate test. Please try again.");
        navigate('/');
      });
  }, [navigate]);

  const handleOptionChange = (qIndex, optionKey) => {
    setUserAnswers({
      ...userAnswers,
      [qIndex]: optionKey
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    let correctCount = 0;
    const answerPayload = {};
    
    questions.forEach((q, index) => {
      answerPayload[index] = userAnswers[index];
      if (q.answer === userAnswers[index]) {
        correctCount++;
      }
    });

    const totalQuestions = questions.length; // <-- ADDED THIS
    const score = (correctCount / totalQuestions) * 100; // <-- UPDATED THIS
    
    const submission = {
      username: user,
      subject: topicInfo.subject,
      topic: topicInfo.topic,
      score: score,
      questions: questions,
      user_answers: answerPayload
    };

    try {
      const response = await axios.post(`${API_URL}/api/submit-test`, submission);
      
      // --- MODIFIED NAVIGATE CALL ---
      navigate('/analysis', { 
        state: { 
          analysis: response.data, 
          topicInfo: topicInfo,
          scoreData: {
            correct: correctCount,
            total: totalQuestions,
            percentage: score
          }
        } 
      });
      
    } catch (error) {
      console.error("Error submitting test:", error);
      alert("Failed to submit test results.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return <h1>Loading your test, please wait...</h1>;
  }

  return (
    <div className="test-page">
      <h1>Test: {topicInfo?.topic}</h1>
      <form onSubmit={handleSubmit}>
        {questions.map((q, qIndex) => (
          <div key={qIndex} className="question-box">
            <h4>{qIndex + 1}. {q.question}</h4>
            <div className="options-container">
              {Object.entries(q.options).map(([key, value]) => (
                <label key={key} className="option-label">
                  <input
                    type="radio"
                    name={`question-${qIndex}`}
                    value={key}
                    onChange={() => handleOptionChange(qIndex, key)}
                    checked={userAnswers[qIndex] === key}
    _               />
                  <strong>{key}:</strong> {value}
                </label>
              ))}
            </div>
          </div>
        ))}
        <button type="submit" className="submit-btn" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Test & See Analysis"}
        </button>
      </form>
    </div>
  );
}
export default TestPage;