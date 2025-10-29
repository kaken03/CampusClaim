import React, { useState, useEffect, useMemo } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
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
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Center text plugin for Doughnut (shows total users in the middle)
const centerTextPlugin = {
  id: 'centerText',
  beforeDraw: (chart) => {
    const { ctx, data } = chart;
    const total = data.datasets?.[0]?.data?.reduce((a, b) => a + (b || 0), 0) || 0;
    const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
    const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;

    ctx.save();
    ctx.font = '600 20px Inter, system-ui, -apple-system, "Segoe UI", Roboto';
    ctx.fillStyle = '#222';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total.toString(), centerX, centerY - 10);

    ctx.font = '400 12px Inter, system-ui, -apple-system, "Segoe UI", Roboto';
    ctx.fillStyle = '#666';
    ctx.fillText('Total', centerX, centerY + 12);
    ctx.restore();
  },
};

export default function AdminUserAnalytics({ users }) {
  const [timeframe, setTimeframe] = useState('monthly');
  const [showType, setShowType] = useState('both'); // 'registered', 'verified', 'both'
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [totalUsers, setTotalUsers] = useState(0);
  const [verifiedUsers, setVerifiedUsers] = useState(0);

  useEffect(() => {
    if (!users || users.length === 0) {
      setTotalUsers(0);
      setVerifiedUsers(0);
      setChartData({ labels: [], datasets: [] });
      return;
    }

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

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: false },
      tooltip: { mode: 'index', intersect: false },
    },
    maintainAspectRatio: false,
  };

  // Pie/Doughnut data
  const unverifiedUsers = Math.max(totalUsers - verifiedUsers, 0);
  const pieData = useMemo(() => ({
    datasets: [
      {
        data: [verifiedUsers, unverifiedUsers],
        backgroundColor: ['#36a2eb', '#ff9f40'],
        borderColor: ['#ffffff', '#ffffff'],
        hoverOffset: 6,
      },
    ],
  }), [verifiedUsers, unverifiedUsers]);

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12 } },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const percent = totalUsers ? ((value / totalUsers) * 100).toFixed(1) : '0.0';
            return `${label}: ${value} (${percent}%)`;
          },
        },
      },
    },
    maintainAspectRatio: false,
    cutout: '68%',
  };

  return (
    <div>
      <div className="analytics-summary-row">
        <div className="pie-card">
          <div className="pie-chart-wrapper">
            <Doughnut
              data={pieData}
              options={pieOptions}
              plugins={[centerTextPlugin]}
            />
          </div>

          <div className="pie-stats">
            <div className="pie-breakdown">
              <div className="pie-breakdown-item">
                <span className="swatch verified" /> <span>Verified</span>
                <strong>{verifiedUsers}</strong>
              </div>
              <div className="pie-breakdown-item">
                <span className="swatch unverified" /> <span>Unverified</span>
                <strong>{unverifiedUsers}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Optionally you can keep small metric cards here if needed */}
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
        <Line data={chartData} options={lineOptions} height={280} />
      </div>
    </div>
  );
}