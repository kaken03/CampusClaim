import React from 'react';
import NavbarHome from '../components/NavbarHome';
import PostNotification from '../components/PostNotification'; // Import the PostNotification component
import './Notification.css';

function Notification() {
  return (
    <div>
    <NavbarHome />
    <div className="notification-page">
      <div className="notification-container">
        <h1>Notifications</h1>
        <PostNotification /> {/* Render the PostNotification component */}
      </div>
    </div>
    </div>
  );
}

export default Notification;