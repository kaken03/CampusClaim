import React, { useState, useEffect } from 'react';
import Navbar from '../components/AdminNavbar';
import AdminPostBox from '../components/AdminPostBox';
import AdminPostFeed from '../components/AdminPostFeed';
import './AdminDashboard.css';

function AdminDashboard() {
  const [schoolName, setSchoolName] = useState(null);

  useEffect(() => {
    // Get admin's school from localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.school) {
      setSchoolName(user.school);
    }
  }, []);

  // This component assumes authentication and permissions are handled upstream.
  // It focuses only on displaying the AdminPostBox.
  return (
    <div>
      <Navbar /> 
      <div className="admin-dashboard-container">
        <div style={{
          textAlign: 'center',
          marginBottom: '30px',
          padding: '20px',
          boxShadow: '0 4px 16px rgba(29,53,87,0.2)'
        }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '2.5rem', fontWeight: 'bold' }}>
            {schoolName || "Admin Dashboard"}
          </h1>
          <p style={{ margin: '0', fontSize: '1.2rem', opacity: '0.9' }}>
            lost and found community
          </p>
        </div>

        <main className="dashboard-content">
          <section className="posts-section">
            <AdminPostBox schoolName={schoolName} />
            <AdminPostFeed schoolName={schoolName} />
          </section>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
