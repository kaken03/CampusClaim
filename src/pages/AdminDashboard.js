import React, { useState, useEffect } from 'react';
import Navbar from '../components/AdminNavbar';
import AdminPostBox from '../components/AdminPostBox';
import AdminFoundItemPage from '../components/AdminFoundItemPage';
import UserLostItemPage from '../components/UserLostItemPage';
import PostBox from '../components/PostBox';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faSearch } from '@fortawesome/free-solid-svg-icons';
import './AdminDashboard.css';

function AdminDashboard() {
  const [schoolName, setSchoolName] = useState(null);
  const [activeTab, setActiveTab] = useState('found'); // New state to manage active tab
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
          <h1 className='school-header-title' >
            {schoolName || "Admin Dashboard"}
          </h1>
          <p className="school-header-desc">
            lost and found community
          </p>
        </div>
        <div className="tab-buttons-container" style={{ textAlign: 'center', margin: '20px auto', maxWidth: '600px', display: 'flex', gap: '10px' }}>
                {/* Found Item Button with Badge */}
                <button 
                  onClick={() => setActiveTab('found')} 
                  className={`tab-btn ${activeTab === 'found' ? 'active-found' : ''}`}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    color: activeTab === 'found' ? '#fff' : '#34495e',
                    backgroundColor: activeTab === 'found' ? '#2ecc71' : '#ecf0f1',
                    border: 'none',
                    borderRadius: '25px',
                    cursor: 'pointer',
                    boxShadow: activeTab === 'found' ? '0 4px 8px rgba(46, 204, 113, 0.4)' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <FontAwesomeIcon icon={faSearch} style={{ marginRight: '10px' }} />
                  Found Items
                </button>
                {/* Lost Item Button */}
                <button 
                  onClick={() => setActiveTab('lost')} 
                  className={`tab-btn ${activeTab === 'lost' ? 'active-lost' : ''}`}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    color: activeTab === 'lost' ? '#fff' : '#34495e',
                    backgroundColor: activeTab === 'lost' ? '#e74c3c' : '#ecf0f1',
                    border: 'none',
                    borderRadius: '25px',
                    cursor: 'pointer',
                    boxShadow: activeTab === 'lost' ? '0 4px 8px rgba(231, 76, 60, 0.4)' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <FontAwesomeIcon icon={faPlusCircle} style={{ marginRight: '10px' }} />
                  Lost Items
                </button>
              </div>
              {/* Render PostBox and PostFeed only for the Lost tab */}
                    {activeTab === 'lost' && (
                      <>
                        <PostBox schoolName={schoolName} postType="lost" />
                        <UserLostItemPage schoolName={schoolName} postType="lost" />
                      </>
                    )}
              
                    {/* For the Found tab, we only need to show the AdminPostFeed */}
                    {activeTab === 'found' && (
                      <>
                        <AdminPostBox schoolName={schoolName} />
                        <AdminFoundItemPage schoolName={schoolName} />
                      </>
                    )}

        {/* <main className="dashboard-content">
          <section className="posts-section">
            <AdminPostBox schoolName={schoolName} />
            <AdminPostFeed schoolName={schoolName} />
          </section>
        </main> */}
      </div>
    </div>
  );
}

export default AdminDashboard;
