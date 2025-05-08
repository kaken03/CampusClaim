import React from 'react';
import NavbarHome from '../components/NavbarHome';
import PostNotification from '../components/PostNotification'; // Import the PostNotification component
import './Notification.css';

function Notification() {
  return (
    <div className="notification-page">
      <NavbarHome />
      <div className="notification-container">
        <PostNotification /> {/* Render the PostNotification component */}
      </div>
    </div>
  );
}

export default Notification;