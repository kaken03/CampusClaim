import React, { useState, useEffect, useMemo } from 'react';
import { Line, Doughnut } from 'react-chartjs-2'; // Import Doughnut
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement, // Import ArcElement for Doughnut
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
  ArcElement, // Register ArcElement
  Title,
  Tooltip,
  Legend
);

// Center text plugin for Doughnut (shows total users in the middle) - ADAPTED FOR POSTS
const centerTextPlugin = {
  id: 'centerTextPosts',
  beforeDraw: (chart) => {
    const { ctx, data } = chart;
    const total = data.datasets?.[0]?.data?.reduce((a, b) => a + (b || 0), 0) || 0;
    const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
    const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;

    ctx.save();
    // Use the same font styles as the original
    ctx.font = '600 20px Inter, system-ui, -apple-system, "Segoe UI", Roboto';
    ctx.fillStyle = '#222';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total.toString(), centerX, centerY - 10);

    ctx.font = '400 12px Inter, system-ui, -apple-system, "Segoe UI", Roboto';
    ctx.fillStyle = '#666';
    ctx.fillText('Total Posts', centerX, centerY + 12); // Adjusted label
    ctx.restore();
  },
};

export default function AdminPostsAnalytics({ posts }) {
  const [timeframe, setTimeframe] = useState('daily');
  const [showType, setShowType] = useState('all'); // 'lost', 'found', 'claimed', 'all'
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });

  // Summary counts
  const totalPosts = posts ? posts.length : 0;
  const totalLost = posts ? posts.filter(p => p.collection === 'LostItems').length : 0;
  const totalFound = posts ? posts.filter(p => p.collection === 'FoundItems').length : 0;
  const totalClaimed = posts ? posts.filter(p => p.claimed).length : 0;

  useEffect(() => {
    if (!posts || posts.length === 0) {
      setChartData({ labels: [], datasets: [] });
      return;
    }

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

  // Pie/Doughnut data and options
  const unClaimedPosts = Math.max(totalFound - totalClaimed, 0); // Total found - total claimed = currently found/unclaimed.
  const pieData = useMemo(() => ({
    
    datasets: [
      {
        data: [totalClaimed, unClaimedPosts, totalLost],
        backgroundColor: ['#4bc0c0', '#ff9f40', '#ff6384'],
        borderColor: ['#ffffff', '#ffffff', '#ffffff'],
        hoverOffset: 6,
      },
    ],
  }), [totalClaimed, unClaimedPosts, totalLost]);

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12 } },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const percent = totalPosts ? ((value / totalPosts) * 100).toFixed(1) : '0.0';
            return `${label}: ${value} (${percent}%)`;
          },
        },
      },
    },
    maintainAspectRatio: false,
    cutout: '68%',
  };


  return (
    <div className="analytics-container">
      <div className="analytics-summary-row">
        {/* Pie Chart Card - Copied from AdminUserAnalytics, adapted for posts */}
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
                <span className="swatch verified" style={{ backgroundColor: '#4bc0c0' }} />
                <span>Claimed</span>
                <strong>{totalClaimed}</strong>
              </div>
              <div className="pie-breakdown-item">
                <span className="swatch unverified" style={{ backgroundColor: '#ff9f40' }} />
                <span>Unclaimed</span>
                <strong>{unClaimedPosts}</strong>
              </div>
              <div className="pie-breakdown-item">
                <span className="swatch lost" style={{ backgroundColor: '#ff6384' }} />
                <span>Lost</span>
                <strong>{totalLost}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Small Metric Cards - Removed to match the single card layout from the User Analytics, but keeping the calculations above in case they are needed for separate cards. */}
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