import React, { useState, useEffect } from 'react';
import NavbarHome from '../components/NavbarHome';
import MyPost from '../components/MyPost'; // Import MyPost component
import PostBox from '../components/PostBox';

function Timeline() {
  const [userSchool, setUserSchool] = useState(null);
  const [loading, setLoading] = useState(true);

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
      <NavbarHome />
      <div className="timeline-container">
        {/* Render MyPost component with schoolName prop */}
        <PostBox schoolName={userSchool} />
        <MyPost schoolName={userSchool} />
      </div>
    </div>
  );
}

export default Timeline;