import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import NavbarHome from '../components/NavbarHome';
import PostBox from '../components/PostBox';
import PostFeed from '../components/PostFeed';
import UserPostFeed from '../components/UserPostFeed';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faSearch } from '@fortawesome/free-solid-svg-icons';
import './Home.css';

function SchoolHome() {
  const { schoolName } = useParams();
  const [userSchool, setUserSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('lost'); // New state to manage active tab

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserSchool(user.school);
    }
    setLoading(false);
  }, []);

  // Show loading while checking user data
  if (loading) {
    return <div>Loading...</div>;
  }

  // Redirect if user is not from this school
  if (userSchool && userSchool !== schoolName) {
    return <div>Access denied. You can only access your school's homepage. (You are from {userSchool}, trying to access {schoolName})</div>;
  }

  return (
    <div className="home-page">
      <NavbarHome />
      <div style={{
        textAlign: 'center',
        marginBottom: '30px',
        padding: '20px',
        boxShadow: '0 4px 16px rgba(29,53,87,0.2)',
        backgroundColor: '#fff',
        borderRadius: '12px'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '2.5rem', fontWeight: 'bold', color: '#2c3e50' }}>
          {schoolName}
        </h1>
        <p style={{ margin: '0', fontSize: '1.2rem', opacity: '0.9', color: '#7f8c8d' }}>
          lost and found community
        </p>
      </div>

      <div style={{ textAlign: 'center', margin: '20px auto', maxWidth: '600px', display: 'flex', gap: '10px' }}>
        {/* Found Item Button */}
        <button 
          onClick={() => setActiveTab('found')} 
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
          <PostFeed schoolName={schoolName} postType="lost" />
        </>
      )}

      {/* For the Found tab, we only need to show the AdminPostFeed */}
      {activeTab === 'found' && (
        <>
          <UserPostFeed schoolName={schoolName} postType="found"/>
        </>
      )}
    </div>
  );
}

export default SchoolHome;
