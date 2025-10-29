import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useParams } from 'react-router-dom';
import NavbarHome from '../components/NavbarHome';
import PostBox from '../components/PostBox';
import UserLostItemPage from '../components/UserLostItemPage';
import AdminFoundItemPage from '../components/AdminFoundItemPage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faSearch } from '@fortawesome/free-solid-svg-icons';
import './Home.css';
import './SchoolHome.css';

function SchoolHome() {
  const { schoolName } = useParams();
  const [userSchool, setUserSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('lost'); // New state to manage active tab
  const [foundBadge, setFoundBadge] = useState(false);
  const [latestFoundTime, setLatestFoundTime] = useState(null);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserSchool(user.school);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Listen for the latest found item only
    const q = query(
      collection(db, 'schools', schoolName, 'FoundItems'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const latest = snapshot.docs[0].data();
        console.log('Latest found item:', latest);
        const latestTime = latest.createdAt?.toMillis?.() || latest.createdAt;
        setLatestFoundTime(latestTime);

        // Compare with last seen
        const lastSeen = localStorage.getItem(`found_last_seen_${schoolName}`);
        if (!lastSeen || latestTime > Number(lastSeen)) {
          setFoundBadge(true);
        }
      }
    });
    return () => unsubscribe();
  }, [schoolName]);

  // When user clicks Found tab, reset badge
  const handleFoundClick = () => {
    setActiveTab('found');
    if (latestFoundTime) {
      localStorage.setItem(`found_last_seen_${schoolName}`, latestFoundTime);
      setFoundBadge(false);
    }
  };

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
      <div className="school-header-card">
        <h1 className="school-header-title">{schoolName}</h1>
        <p className="school-header-desc">lost and found community</p>
      </div>

      <div className="tab-buttons-container" style={{ textAlign: 'center', margin: '20px auto', maxWidth: '600px', display: 'flex', gap: '10px' }}>
        {/* Found Item Button with Badge */}
        <button 
          onClick={handleFoundClick}
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
          {foundBadge && (
            <span className="notif-badge"></span>
          )}
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
          <AdminFoundItemPage schoolName={schoolName} postType="found"/>
        </>
      )}
    </div>
  );
}

export default SchoolHome;
