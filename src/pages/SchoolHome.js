import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import NavbarHome from '../components/NavbarHome';
import PostBox from '../components/PostBox';
import PostFeed from '../components/PostFeed';
import './Home.css';

function SchoolHome() {
  const { schoolName } = useParams();
  const [userSchool, setUserSchool] = useState(null);
  const [loading, setLoading] = useState(true);

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
        boxShadow: '0 4px 16px rgba(29,53,87,0.2)'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '2.5rem', fontWeight: 'bold' }}>
        {schoolName}
        </h1>
        <p style={{ margin: '0', fontSize: '1.2rem', opacity: '0.9' }}>
         lost and found community
        </p>
      </div>
      <PostBox schoolName={schoolName} />
      <PostFeed schoolName={schoolName} />
    </div>
  );
}

export default SchoolHome; 