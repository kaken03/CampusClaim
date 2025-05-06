import React from 'react';
import NavbarHome from '../components/NavbarHome';
import MyPost from '../components/MyPost'; // Import MyPost component

function Timeline() {
  return (
    <div className="timeline-page">
      <NavbarHome />
      <div className="timeline-container">
        {/* Render MyPost component */}
        <MyPost />
      </div>
    </div>
  );
}

export default Timeline;