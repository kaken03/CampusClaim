import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './AdminAnalytics.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function AdminUserAnalytics({ users }) {
  const [timeframe, setTimeframe] = useState('monthly');
  const [showType, setShowType] = useState('both'); // 'registered', 'verified', 'both'
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [totalUsers, setTotalUsers] = useState(0);
  const [verifiedUsers, setVerifiedUsers] = useState(0);

  useEffect(() => {
    if (!users || users.length === 0) return;

    const registeredUsers = users.filter(user => user.createdAt?.seconds);
    const verifiedUsersList = users.filter(user => user.verificationStatus === 'verified' && user.createdAt?.seconds);

    setTotalUsers(users.length);
    setVerifiedUsers(verifiedUsersList.length);

    const groupDataByTimeframe = (data) => {
      const counts = {};
      data.forEach(user => {
        const date = new Date(user.createdAt.seconds * 1000);
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

    const registeredCounts = groupDataByTimeframe(registeredUsers);
    const verifiedCounts = groupDataByTimeframe(verifiedUsersList);

    const labels = Object.keys({ ...registeredCounts, ...verifiedCounts }).sort();
    const registeredDataset = labels.map(label => registeredCounts[label] || 0);
    const verifiedDataset = labels.map(label => verifiedCounts[label] || 0);

    const datasets = [];
    if (showType === 'registered' || showType === 'both') {
      datasets.push({
        label: 'Registered',
        data: registeredDataset,
        fill: false,
        backgroundColor: '#4bc0c0',
        borderColor: '#4bc0c0',
        tension: 0.3,
      });
    }
    if (showType === 'verified' || showType === 'both') {
      datasets.push({
        label: 'Verified',
        data: verifiedDataset,
        fill: false,
        backgroundColor: '#36a2eb',
        borderColor: '#36a2eb',
        tension: 0.3,
      });
    }

    setChartData({ labels, datasets });
  }, [users, timeframe, showType]);

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: false },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="analytics-container">
      <div className="analytics-summary-row">
        <div className="summary-card">
          <div className="summary-label">Total Users</div>
          <div className="summary-value">{totalUsers}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Verified</div>
          <div className="summary-value">{verifiedUsers}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Unverified</div>
          <div className="summary-value">{totalUsers - verifiedUsers}</div>
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
          <button
            className={showType === 'both' ? 'active' : ''}
            onClick={() => setShowType('both')}
          >Both</button>
          <button
            className={showType === 'registered' ? 'active' : ''}
            onClick={() => setShowType('registered')}
          >Registered</button>
          <button
            className={showType === 'verified' ? 'active' : ''}
            onClick={() => setShowType('verified')}
          >Verified</button>
        </div>
      </div>

      <div className="analytics-chart-card">
        <Line data={chartData} options={options} height={280} />
      </div>
    </div>
  );
}