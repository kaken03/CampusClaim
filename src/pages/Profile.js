import React from 'react';
import NavbarHome from '../components/NavbarHome';
import './About.css'; // Reuse existing styles

import { getAuth } from 'firebase/auth';

function Profile() {
  const auth = getAuth();
  const user = auth.currentUser;

  const fullName = user?.displayName || 'No Name Provided';
  const email = user?.email || 'No Email Available';
  const photoURL = user?.photoURL || 'https://via.placeholder.com/150';

  return (
    <div className="about-page">
      <NavbarHome />
      <div className="about-container">
        <h1>Your Profile</h1>
        <div style={styles.profileBox}>
          <img src={photoURL} alt="Profile" style={styles.avatar} />
          <div>
            <p><strong>Full Name:</strong> {fullName}</p>
            <p><strong>Email:</strong> {email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  profileBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginTop: '20px',
    background: '#f9f9f9',
    padding: '20px',
    borderRadius: '10px'
  },
  avatar: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #007bff'
  }
};

export default Profile;
