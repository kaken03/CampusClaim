
import { Link } from 'react-router-dom';
import './NavbarHome.css';
import logo from '../assets/images/CAMPUSCLAIM.png';

const Navbar = () => {

  return (
    <nav className="navbar">
            <div className="logo-container">
          <div className="logo">
      <Link to="/" className="logo-link">
        <img src={logo} alt="CampusClaim Logo" className="logo-image" />
        <span className="logo-text">CampusClaim</span>
      </Link>
    </div>
    </div>
          </nav>
  );
};

export default Navbar;