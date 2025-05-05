import React from 'react';
import NavbarHome from '../components/NavbarHome';
import './Home.css';
import PostBox from '../components/PostBox';                                                                    
import PostFeed from '../components/PostFeed';


function Home() {
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
      

      
    </div>
  );
}

export default Home;

