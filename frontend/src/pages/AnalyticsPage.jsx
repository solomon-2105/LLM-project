import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Plot from 'react-plotly.js'; // Plotly is used for charts
import './AnalyticsPage.css'; // We'll add styles for the table

const API_URL = "http://localhost:5000";

function AnalyticsPage({ user }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all test results for the user when the page loads
    axios.get(`${API_URL}/api/analytics?username=${user}`)
      .then(response => {
        // Parse dates right after fetching
        const parsedData = response.data.map(item => ({
          ...item,
          test_date: new Date(item.test_date) // Convert string date to Date object
        }));
        // Sort data by date, newest first
        parsedData.sort((a, b) => b.test_date - a.test_date);
        setData(parsedData);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching analytics:", error);
        setData([]); // Set empty data on error
        setLoading(false);
      });
  }, [user]); // Re-run effect if the user changes

  if (loading) {
    return <h1>Loading your analytics...</h1>;
  }

  if (data.length === 0) {
    return <h1>No test data found. Go take some tests!</h1>;
  }

  // --- Process Data for Charts and Table ---

  // 1. For Pie Chart (Tests Attempted per Subject)
  const subjectCounts = {};
  data.forEach(d => {
    subjectCounts[d.subject] = (subjectCounts[d.subject] || 0) + 1;
  });

  const pieLabels = Object.keys(subjectCounts);
  const pieValues = Object.values(subjectCounts);

  const pieChartData = [{
    values: pieValues,
    labels: pieLabels,
    type: 'pie',
    hole: .4, // Makes it a donut chart
    hoverinfo: 'label+percent',
    textinfo: 'value',
    textfont_size: 20,
    marker: {
      line: {
        color: '#000000',
        width: 1
      }
    }
  }];

  // 2. Data for the History Table (already in `data` state)

  return (
    <div className="analytics-page">
      <h1>📊 Your Analytics</h1>

      {/* --- Pie Chart Section --- */}
      <h2>Tests Attempted per Subject</h2>
      <Plot
        data={pieChartData}
        layout={{
          title: 'Breakdown of Tests Taken',
          showlegend: true,
          height: 400,
          width: 500
        }}
        useResizeHandler={true}
        style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }} // Center the chart
      />

      {/* --- History Table Section --- */}
      <h2>Test History</h2>
      <div className="history-table-container">
        <table className="history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Topic</th>
              <th>Subject</th>
              <th>Score (%)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((result, index) => (
              <tr key={result.result_id || index}> {/* Use result_id if available */}
                <td>{result.test_date.toLocaleDateString()}</td>
                <td>{result.topic}</td>
                <td>{result.subject}</td>
                <td>{result.score.toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
export default AnalyticsPage;