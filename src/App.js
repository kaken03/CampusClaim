import React, { useState } from "react";
import "./App.css";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import campusClaimLogo from "./assets/images/CAMPUSCLAIM.png"; // <-- your logo path

function App() {
  const [showSignup, setShowSignup] = useState(false);

  return (
    <>
      <div className="landing-container">
        {/* Left Branding Section */}
        <div className="branding-section">
          <div className="branding-logo-row">
            <img
              src={campusClaimLogo}
              alt="CampusClaim Logo"
              className="branding-logo"
            />
            <span className="branding-title">CampusClaim</span>
          </div>
          <h2 className="branding-headline">
            Lost it? Found it? <span className="highlight">Claim it!</span>
          </h2>
          {/* <p className="branding-tagline">
            A secure and school-specific lost & found system designed to keep your
            campus connected.
          </p> */}
        </div>

        {/* Right Form Section */}
        <div className="login-section">
            {showSignup ? (
              <Signup onSwitchToLogin={() => setShowSignup(false)} />
            ) : (
              <Login onSwitchToSignup={() => setShowSignup(true)} />
            )}
          </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        © {new Date().getFullYear()} CampusClaim
      </footer>
    </>
  );
}

export default App;
