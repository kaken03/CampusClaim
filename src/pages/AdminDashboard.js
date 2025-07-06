import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase'; // Make sure this is your Firestore instance
import Navbar from '../components/NavbarAdmin';

function AdminDashboard() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserStats = async () => {
      setLoading(true);
      try {
        // Fetch all users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        setTotalUsers(usersSnapshot.size);

        // Fetch active users: assuming 'active' is a boolean field in your user documents
        const activeQuery = query(collection(db, 'users'), where('active', '==', true));
        const activeSnapshot = await getDocs(activeQuery);
        setActiveUsers(activeSnapshot.size);
      } catch (error) {
        console.error('Error fetching user stats:', error);
      }
      setLoading(false);
    };

    fetchUserStats();
  }, []);

  return (
    <div>
      <Navbar />
      <div className="admin-dashboard-container" style={{ padding: '2rem', maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center' }}>Admin Dashboard</h1>
        {loading ? (
          <p>Loading user statistics...</p>
        ) : (
          <div className="dashboard-stats" style={{ display: 'flex', justifyContent: 'space-around', marginTop: 32 }}>
            <div className="stat-card" style={{ background: '#f8f9fa', padding: 24, borderRadius: 8, textAlign: 'center', boxShadow: '0 2px 8px #eee' }}>
              <h2>Total Users</h2>
              <p style={{ fontSize: 32, fontWeight: 'bold', color: '#007bff' }}>{totalUsers}</p>
            </div>
            <div className="stat-card" style={{ background: '#f8f9fa', padding: 24, borderRadius: 8, textAlign: 'center', boxShadow: '0 2px 8px #eee' }}>
              <h2>Active Users</h2>
              <p style={{ fontSize: 32, fontWeight: 'bold', color: '#28a745' }}>{activeUsers}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;