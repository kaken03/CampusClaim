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
  const [timeframe, setTimeframe] = useState('daily');
  const [registeredData, setRegisteredData] = useState({ labels: [], datasets: [] });
  const [verifiedData, setVerifiedData] = useState({ labels: [], datasets: [] });
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

    setRegisteredData({
      labels: labels,
      datasets: [{
        label: 'Registered Users',
        data: registeredDataset,
        fill: false,
        backgroundColor: 'rgb(75, 192, 192)',
        borderColor: 'rgba(75, 192, 192, 0.2)',
      }],
    });
    
    setVerifiedData({
      labels: labels,
      datasets: [{
        label: 'Verified Users',
        data: verifiedDataset,
        fill: false,
        backgroundColor: 'rgb(54, 162, 235)',
        borderColor: 'rgba(54, 162, 235, 0.2)',
      }],
    });

  }, [users, timeframe]);

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: `User Statistics (${timeframe})` },
    },
  };

  return (
    <div className="analytics-container">
      <div className="analytics-summary">
        <div className="summary-card">
          <h4>Total Users</h4>
          <h2>{totalUsers}</h2>
        </div>
        <div className="summary-card">
          <h4>Verified Users</h4>
          <h2>{verifiedUsers}</h2>
        </div>
        <div className="summary-card">
          <h4>Unverified Users</h4>
          <h2>{totalUsers - verifiedUsers}</h2>
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
          <h3>Registered Users Over Time</h3>
          <Line data={registeredData} options={{ ...options, plugins: { ...options.plugins, title: { ...options.plugins.title, text: 'Registered Users Over Time' } } }} />
        </div>
        <div className="chart-card">
          <h3>Verified Users Over Time</h3>
          <Line data={verifiedData} options={{ ...options, plugins: { ...options.plugins, title: { ...options.plugins.title, text: 'Verified Users Over Time' } } }} />
        </div>
      </div>
    </div>
  );
}