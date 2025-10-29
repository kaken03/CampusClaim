import React, { useState, useEffect } from 'react';
import AdminNavbar from '../components/AdminNavbar';
import UserTimeline from '../components/UserTimeline'; // Import MyPost component
import AdminTimelineFoundItem from '../components/AdminTimelineFoundItem';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faSearch } from '@fortawesome/free-solid-svg-icons';

function Timeline() {
  const [userSchool, setUserSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('found');
  const [schoolName, setSchoolName] = useState(null);
  useEffect(() => {
      // Get admin's school from localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.school) {
        setSchoolName(user.school);
      }
    }, []);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserSchool(user.school);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!userSchool) {
    return <div>Error: School information not found. Please log in again.</div>;
  }

  return (
    <div className="timeline-page">
      <AdminNavbar />
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
                    {activeTab === 'lost' && (
                                          <>
                    <UserTimeline schoolName={userSchool} />
                                          </>
                                        )}
                                  
                                        {/* For the Found tab, we only need to show the AdminPostFeed */}
                      {activeTab === 'found' && (
                      <>
                        <AdminTimelineFoundItem schoolName={schoolName} />
                      </>
                    )}
    </div>
  );
}

export default Timeline;