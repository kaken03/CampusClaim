import React, { useState } from 'react';
import NavbarHome from '../components/NavbarHome';
import './Home.css';
import PostBox from '../components/PostBox';
import PostFeed from '../components/PostFeed';
import MessengerFloatingButton from '../components/MessengerFloatingButton';
import MessengerBox from '../components/MessengerBox';

function Home() {
  const [showMessenger, setShowMessenger] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleMessengerToggle = () => {
    setShowMessenger(prev => !prev);
  };

  return (
    <div className="home-page">
      <NavbarHome />
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Lost it? Found it? Claim it!</h1>
          <p className="hero-tagline">
            CampusClaim helps you manage lost and found items effortlessly.
          </p>
        </div>
      </section>

      <PostBox />
      <PostFeed />

      <MessengerFloatingButton onClick={handleMessengerToggle} unreadCount={unreadCount} />
      {showMessenger && (
        <MessengerBox onClose={handleMessengerToggle} onUnreadCountChange={setUnreadCount} />
      )}
    </div>
  );
}

export default Home;

