import { Link } from 'react-router-dom';
import './HomePage.css';
const HomePage = () => {
  return (
    <div>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-logo">BankingApplication</div>
        <div className="navbar-links">
          <Link to="/signin">Sign In</Link>
          <Link to="/signup">Sign Up</Link>
        </div>
      </nav>

      {/* Body Content */}
      <div className="homepage-body">
        <h2>Welcome to Your Banking Dashboard</h2>
        <p>Manage your finances with ease and security.</p>
      </div>
    </div>
  );
};


export default HomePage;