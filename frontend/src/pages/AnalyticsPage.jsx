import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Plot from 'react-plotly.js';

const API_URL = "http://localhost:5000";

function AnalyticsPage({ user }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/api/analytics?username=${user}`)
      .then(response => {
        setData(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching analytics:", error);
        setData([]); // Set empty data on error
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return <h1>Loading your analytics...</h1>;
  }

  if (data.length === 0) {
    return <h1>No test data found.</h1>;
  }

  // --- Process Data for Charts ---
  
  // 1. For Line Chart (Scores over time)
  const lineChartData = [
    {
      x: data.map(d => d.test_date),
      y: data.map(d => d.score),
      type: 'scatter',
      mode: 'lines+markers',
      marker: { color: 'blue' },
    }
  ];

  // 2. For Pie Chart (Average by Subject)
  const subjectScores = {};
  const subjectCounts = {};
  data.forEach(d => {
    if (!subjectScores[d.subject]) {
      subjectScores[d.subject] = 0;
      subjectCounts[d.subject] = 0;
    }
    subjectScores[d.subject] += d.score;
    subjectCounts[d.subject]++;
  });
  
  const pieLabels = Object.keys(subjectScores);
  const pieValues = pieLabels.map(subject => subjectScores[subject] / subjectCounts[subject]);

  const pieChartData = [{
    values: pieValues,
    labels: pieLabels,
    type: 'pie'
  }];

  return (
    <div className="analytics-page">
      <h1>📊 Your Analytics</h1>
      
      <h2>Improvement Over Time</h2>
      <Plot
        data={lineChartData}
        layout={{ title: 'Your Test Scores Over Time', xaxis: { title: 'Date' }, yaxis: { title: 'Score (%)' } }}
        useResizeHandler={true}
        style={{ width: '100%', height: '100%' }}
      />
      
      <h2>Average Score by Subject</h2>
      <Plot
        data={pieChartData}
        layout={{ title: 'Average Score per Subject' }}
        useResizeHandler={true}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
export default AnalyticsPage;