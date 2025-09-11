import Header from '../components/Header';
import './HomePage.css';
const HomePage = () => {
  return (
    <div>
  {/* Navbar */}
  <Header />

      {/* Body Content */}
      <div className="homepage-body">
        <h2>Welcome to Your Banking Dashboard</h2>
        <p>Manage your finances with ease and security.</p>
      </div>
    </div>
  );
};


export default HomePage;