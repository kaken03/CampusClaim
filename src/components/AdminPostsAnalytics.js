import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function AdminPostsAnalytics({ posts }) {
  const [timeframe, setTimeframe] = useState('daily');
  const [lostData, setLostData] = useState({ labels: [], datasets: [] });
  const [foundData, setFoundData] = useState({ labels: [], datasets: [] });
  const [claimedData, setClaimedData] = useState({ labels: [], datasets: [] });

  useEffect(() => {
    if (!posts || posts.length === 0) return;

    const lostPosts = posts.filter(p => p.collection === 'LostItems' && p.createdAt?.seconds);
    const foundPosts = posts.filter(p => p.collection === 'FoundItems' && p.createdAt?.seconds);
    const claimedPosts = posts.filter(p => p.claimed && p.createdAt?.seconds);

    const groupDataByTimeframe = (data) => {
      const counts = {};
      data.forEach(item => {
        const date = new Date(item.createdAt.seconds * 1000);
        let key = '';

        if (timeframe === 'daily') {
          key = date.toISOString().split('T')[0];
        } else if (timeframe === 'weekly') {
          const startOfWeek = new Date(date);
          startOfWeek.setDate(date.getDate() - date.getDay());
          key = startOfWeek.toISOString().split('T')[0];
        } else if (timeframe === 'monthly') {
          key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        } else if (timeframe === 'annually') {
          key = date.getFullYear().toString();
        }
        counts[key] = (counts[key] || 0) + 1;
      });
      return counts;
    };

    const lostCounts = groupDataByTimeframe(lostPosts);
    const foundCounts = groupDataByTimeframe(foundPosts);
    const claimedCounts = groupDataByTimeframe(claimedPosts);

    const allLabels = Object.keys({ ...lostCounts, ...foundCounts, ...claimedCounts }).sort();

    setLostData({
      labels: allLabels,
      datasets: [{
        label: 'Lost Items',
        data: allLabels.map(label => lostCounts[label] || 0),
        fill: false,
        backgroundColor: 'rgb(255, 99, 132)',
        borderColor: 'rgba(255, 99, 132, 0.2)',
      }],
    });
    setFoundData({
      labels: allLabels,
      datasets: [{
        label: 'Found Items',
        data: allLabels.map(label => foundCounts[label] || 0),
        fill: false,
        backgroundColor: 'rgb(54, 162, 235)',
        borderColor: 'rgba(54, 162, 235, 0.2)',
      }],
    });
    setClaimedData({
      labels: allLabels,
      datasets: [{
        label: 'Claimed Items',
        data: allLabels.map(label => claimedCounts[label] || 0),
        fill: false,
        backgroundColor: 'rgb(75, 192, 192)',
        borderColor: 'rgba(75, 192, 192, 0.2)',
      }],
    });
  }, [posts, timeframe]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Lost and Found Post Statistics' },
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  const totalLost = posts.filter(p => p.collection === 'LostItems').length;
  const totalFound = posts.filter(p => p.collection === 'FoundItems').length;
  const totalClaimed = posts.filter(p => p.claimed).length;

  return (
    <div className="analytics-container">
      <div className="analytics-summary">
        <div className="summary-card">
          <h4>Total Lost Items</h4>
          <h2>{totalLost}</h2>
        </div>
        <div className="summary-card">
          <h4>Total Found Items</h4>
          <h2>{totalFound}</h2>
        </div>
        <div className="summary-card">
          <h4>Total Claimed Items</h4>
          <h2>{totalClaimed}</h2>
        </div>
      </div>
      
      <div className="analytics-controls">
        <button onClick={() => setTimeframe('daily')} className={timeframe === 'daily' ? 'active' : ''}>Daily</button>
        <button onClick={() => setTimeframe('weekly')} className={timeframe === 'weekly' ? 'active' : ''}>Weekly</button>
        <button onClick={() => setTimeframe('monthly')} className={timeframe === 'monthly' ? 'active' : ''}>Monthly</button>
        <button onClick={() => setTimeframe('annually')} className={timeframe === 'annually' ? 'active' : ''}>Annually</button>
      </div>

      <div className="analytics-charts">
        <div className="chart-card">
          <h3>Lost and Found Posts Over Time</h3>
          <Line
            data={{
              labels: lostData.labels,
              datasets: [...lostData.datasets, ...foundData.datasets],
            }}
            options={{ ...chartOptions, plugins: { ...chartOptions.plugins, title: { ...chartOptions.plugins.title, text: 'Lost and Found Posts Over Time' } } }}
          />
        </div>
        <div className="chart-card">
          <h3>Claimed Items Over Time</h3>
          <Line
            data={{
              labels: claimedData.labels,
              datasets: claimedData.datasets,
            }}
            options={{ ...chartOptions, plugins: { ...chartOptions.plugins, title: { ...chartOptions.plugins.title, text: 'Claimed Items Over Time' } } }}
          />
        </div>
      </div>
    </div>
  );
}