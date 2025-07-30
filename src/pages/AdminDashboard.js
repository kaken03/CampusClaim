import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import Navbar from '../components/NavbarAdmin';
import './AdminDashboard.css';

function AdminDashboard() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [totalLost, setTotalLost] = useState(0);
  const [totalFound, setTotalFound] = useState(0);
  const [totalLostClaimed, setTotalLostClaimed] = useState(0);
  const [totalLostUnclaimed, setTotalLostUnclaimed] = useState(0);
  const [totalFoundClaimed, setTotalFoundClaimed] = useState(0);
  const [totalFoundUnclaimed, setTotalFoundUnclaimed] = useState(0);
  const [loading, setLoading] = useState(true);

  // Get admin's school from localStorage
  const user = JSON.parse(localStorage.getItem('user'));
  const schoolName = user?.school;

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Users for this school
        const usersSnapshot = await getDocs(collection(db, 'schools', schoolName, 'users'));
        setTotalUsers(usersSnapshot.size);

        const activeQuery = query(collection(db, 'schools', schoolName, 'users'), where('active', '==', true));
        const activeSnapshot = await getDocs(activeQuery);
        setActiveUsers(activeSnapshot.size);

        // Lost Items for this school
        const lostSnapshot = await getDocs(collection(db, 'schools', schoolName, 'LostItems'));
        const lostDocs = lostSnapshot.docs;
        setTotalLost(lostDocs.length);
        setTotalLostClaimed(lostDocs.filter(doc => doc.data().claimed === true).length);
        setTotalLostUnclaimed(lostDocs.filter(doc => !doc.data().claimed).length);

        // Found Items for this school
        const foundSnapshot = await getDocs(collection(db, 'schools', schoolName, 'FoundItems'));
        const foundDocs = foundSnapshot.docs;
        setTotalFound(foundDocs.length);
        setTotalFoundClaimed(foundDocs.filter(doc => doc.data().claimed === true).length);
        setTotalFoundUnclaimed(foundDocs.filter(doc => !doc.data().claimed).length);

      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
      setLoading(false);
    };

    if (schoolName) {
      fetchStats();
    }
  }, [schoolName]);

  return (
    <div>
      <Navbar />
      <div className="admin-dashboard-container">
        <h1 className="dashboard-title">Admin Dashboard</h1>
        {loading ? (
          <p className="dashboard-loading">Loading statistics...</p>
        ) : (
          <>
            <div className="dashboard-stats">
              <div className="stat-card total-users">
                <h2>Total Users</h2>
                <p className="stat-number">{totalUsers}</p>
              </div>
              <div className="stat-card active-users">
                <h2>Active Users</h2>
                <p className="stat-number">{activeUsers}</p>
              </div>
            </div>
            <div className="dashboard-post-stats">
              <div className="stat-card category lost">
                <h3>Lost Items</h3>
                <p className="stat-number">{totalLost}</p>
                <div className="stat-sub">
                  <span>Claimed: <b>{totalLostClaimed}</b></span>
                  <span>Unclaimed: <b>{totalLostUnclaimed}</b></span>
                </div>
              </div>
              <div className="stat-card category found">
                <h3>Found Items</h3>
                <p className="stat-number">{totalFound}</p>
                <div className="stat-sub">
                  <span>Claimed: <b>{totalFoundClaimed}</b></span>
                  <span>Unclaimed: <b>{totalFoundUnclaimed}</b></span>
                </div>
              </div>
            </div>
            <div className="dashboard-post-summary">
              <h4>Total Posts (All Lost &amp; Found): <span className="stat-number">{totalLost + totalFound}</span></h4>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;