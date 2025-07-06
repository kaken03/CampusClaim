import React, { useEffect, useState } from 'react';
import NavbarAdmin from '../components/NavbarAdmin';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './AdminAnalytics.css';

function groupByPeriod(data, period, getDate) {
  const groups = {};
  data.forEach(item => {
    const date = getDate(item);
    let key = '';
    if (period === 'day') key = date.toISOString().slice(0, 10);
    if (period === 'week') key = `${date.getFullYear()}-W${getWeek(date)}`;
    if (period === 'month') key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    if (period === 'year') key = `${date.getFullYear()}`;
    groups[key] = (groups[key] || 0) + 1;
  });
  return Object.entries(groups)
    .map(([period, count]) => ({ period, count }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

function getWeek(date) {
  const onejan = new Date(date.getFullYear(), 0, 1);
  return Math.ceil((((date - onejan) / 86400000) + onejan.getDay() + 1) / 7);
}

export default function AdminAnalytics() {
  const [userCounts, setUserCounts] = useState({ day: [], week: [], month: [], year: [] });
  const [foundItemsCounts, setFoundItemsCounts] = useState({ day: [], week: [], month: [], year: [] });
  const [lostItemsCounts, setLostItemsCounts] = useState({ day: [], week: [], month: [], year: [] });
  const [loading, setLoading] = useState(true);
  const [userPeriod, setUserPeriod] = useState('day');
  const [postPeriod, setPostPeriod] = useState('day');
  const [postType, setPostType] = useState('All'); // All, FoundItem, LostItem

  useEffect(() => {
    async function fetchData() {
      // Users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt
          ? new Date(doc.data().createdAt.seconds ? doc.data().createdAt.seconds * 1000 : doc.data().createdAt)
          : new Date()
      }));

      // FoundItems
      const foundSnapshot = await getDocs(collection(db, 'FoundItems'));
      const foundItems = foundSnapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt
          ? new Date(doc.data().createdAt.seconds ? doc.data().createdAt.seconds * 1000 : doc.data().createdAt)
          : new Date()
      }));

      // LostItems
      const lostSnapshot = await getDocs(collection(db, 'LostItems'));
      const lostItems = lostSnapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt
          ? new Date(doc.data().createdAt.seconds ? doc.data().createdAt.seconds * 1000 : doc.data().createdAt)
          : new Date()
      }));

      setUserCounts({
        day: groupByPeriod(users, 'day', u => u.createdAt),
        week: groupByPeriod(users, 'week', u => u.createdAt),
        month: groupByPeriod(users, 'month', u => u.createdAt),
        year: groupByPeriod(users, 'year', u => u.createdAt),
      });

      setFoundItemsCounts({
        day: groupByPeriod(foundItems, 'day', p => p.createdAt),
        week: groupByPeriod(foundItems, 'week', p => p.createdAt),
        month: groupByPeriod(foundItems, 'month', p => p.createdAt),
        year: groupByPeriod(foundItems, 'year', p => p.createdAt),
      });

      setLostItemsCounts({
        day: groupByPeriod(lostItems, 'day', p => p.createdAt),
        week: groupByPeriod(lostItems, 'week', p => p.createdAt),
        month: groupByPeriod(lostItems, 'month', p => p.createdAt),
        year: groupByPeriod(lostItems, 'year', p => p.createdAt),
      });

      setLoading(false);
    }
    fetchData();
  }, []);

  const periodLabels = {
    day: "Daily",
    week: "Weekly",
    month: "Monthly",
    year: "Annually"
  };

  // Compute "All" posts by merging arrays and regrouping
  function getAllPostsByPeriod(period) {
    // Merge counts from both found and lost items
    const merged = {};
    [...foundItemsCounts[period], ...lostItemsCounts[period]].forEach(({ period, count }) => {
      merged[period] = (merged[period] || 0) + count;
    });
    return Object.entries(merged)
      .map(([period, count]) => ({ period, count }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  // Determine which data to show
  let postChartData = [];
  if (postType === 'All') {
    postChartData = getAllPostsByPeriod(postPeriod);
  } else if (postType === 'FoundItem') {
    postChartData = foundItemsCounts[postPeriod];
  } else if (postType === 'LostItem') {
    postChartData = lostItemsCounts[postPeriod];
  }

  return (
    <>
      <NavbarAdmin />
      <div className="admin-analytics-container">
        <h2>Analytics Overview</h2>
        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '60px', fontSize: '1.2rem' }}>
            Loading analytics...
          </div>
        ) : (
          <>
            <div className="analytics-section">
              <div className="analytics-header">
                <h3>Users Registered</h3>
                <select value={userPeriod} onChange={e => setUserPeriod(e.target.value)}>
                  {Object.entries(periodLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={userCounts[userPeriod]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#0088FE" name="Users Registered" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="analytics-section">
              <div className="analytics-header">
                <h3>Posts Created</h3>
                <div>
                  <select value={postType} onChange={e => setPostType(e.target.value)}>
                    <option value="All">All</option>
                    <option value="FoundItem">Found Item</option>
                    <option value="LostItem">Lost Item</option>
                  </select>
                  <select value={postPeriod} onChange={e => setPostPeriod(e.target.value)} style={{ marginLeft: '12px' }}>
                    {Object.entries(periodLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={postChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#FF8042" name="Posts Created" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </>
  );
}