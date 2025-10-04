import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import './AdminAnalytics.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function AdminPostsAnalytics({ posts }) {
  const [timeframe, setTimeframe] = useState('daily');
  const [showType, setShowType] = useState('all'); // 'lost', 'found', 'claimed', 'all'
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });

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

    const datasets = [];
    if (showType === 'lost' || showType === 'all') {
      datasets.push({
        label: 'Lost Items',
        data: allLabels.map(label => lostCounts[label] || 0),
        fill: false,
        backgroundColor: '#ff6384',
        borderColor: '#ff6384',
        tension: 0.3,
      });
    }
    if (showType === 'found' || showType === 'all') {
      datasets.push({
        label: 'Found Items',
        data: allLabels.map(label => foundCounts[label] || 0),
        fill: false,
        backgroundColor: '#36a2eb',
        borderColor: '#36a2eb',
        tension: 0.3,
      });
    }
    if (showType === 'claimed' || showType === 'all') {
      datasets.push({
        label: 'Claimed Items',
        data: allLabels.map(label => claimedCounts[label] || 0),
        fill: false,
        backgroundColor: '#4bc0c0',
        borderColor: '#4bc0c0',
        tension: 0.3,
      });
    }

    setChartData({ labels: allLabels, datasets });
  }, [posts, timeframe, showType]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: false },
    },
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true }
    }
  };

  const totalLost = posts.filter(p => p.collection === 'LostItems').length;
  const totalFound = posts.filter(p => p.collection === 'FoundItems').length;
  const totalClaimed = posts.filter(p => p.claimed).length;

  return (
    <div className="analytics-container">
      <div className="analytics-summary-row">
        <div className="summary-card">
          <div className="summary-label">Total Lost</div>
          <div className="summary-value">{totalLost}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Total Found</div>
          <div className="summary-value">{totalFound}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Total Claimed</div>
          <div className="summary-value">{totalClaimed}</div>
        </div>
      </div>

      <div className="analytics-controls-row">
        <select value={timeframe} onChange={e => setTimeframe(e.target.value)}>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="annually">Annually</option>
        </select>
        <div className="toggle-btn-group">
          <button className={showType === 'all' ? 'active' : ''} onClick={() => setShowType('all')}>All</button>
          <button className={showType === 'lost' ? 'active' : ''} onClick={() => setShowType('lost')}>Lost</button>
          <button className={showType === 'found' ? 'active' : ''} onClick={() => setShowType('found')}>Found</button>
          <button className={showType === 'claimed' ? 'active' : ''} onClick={() => setShowType('claimed')}>Claimed</button>
        </div>
      </div>

      <div className="analytics-chart-card">
        <Line data={chartData} options={chartOptions} height={280} />
      </div>
    </div>
  );
}