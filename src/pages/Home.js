
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavbarHome from '../components/NavbarHome';
import './Home.css';

function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user.school) {
        // Redirect to school-specific homepage
        navigate(`/school/${user.school}/home`);
      }
    }
  }, [navigate]);

  return (
    <div className="redirect-message">
      <NavbarHome />
  <span role="img" aria-label="redirect" style={{ fontSize: '2.2rem' }}>🔄</span>
  <h2 style={{ margin: '20px 0 10px 0' }}>Redirecting to your school's homepage...</h2>
  <div className="loader"></div>
  <p style={{ marginTop: 18, color: '#34495e', fontSize: '1rem' }}>
    Taking you to your school's community. One moment please...
  </p>
</div>
  );
}

export default Home;

