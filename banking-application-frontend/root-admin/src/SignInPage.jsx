import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignInPage.css';
import { adminSignIn } from './services/adminAuthAPI';

const SignInPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Call the backend API to sign in
      const result = await adminSignIn(username, password);
      
      if (result.success) {
        // Success - token and user data are already stored by the API method
        console.log('Sign-in successful:', result.data);
        
        // Navigate to admin dashboard using React Router
        navigate('/admin/dashboard');
        
      } else {
        // Handle error response
        console.error('Sign-in failed:', result.error);
        alert(result.error || 'Invalid credentials. Please try again.');
      }
      
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signin-container">
      <div className="signin-background">
        <div className="geometric-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
        </div>
      </div>
      
      <div className="signin-content">
        <div className="signin-card">
          <div className="signin-header">
            <div className="logo-container">
              <h1>Root Admin Portal</h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="signin-form">
            <div className="form-group">
              <label htmlFor="username">Root Admin Username</label>
              <div className="input-container">
                <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your admin username"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Root Admin Password</label>
              <div className="input-container">
                <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="16" r="1" stroke="currentColor" strokeWidth="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your admin password"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className={`signin-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  Signing In...
                </>
              ) : (
                'Sign In to Admin Panel'
              )}
            </button>
          </form>

          <div className="signin-footer">
            <div className="security-notice">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Secured with enterprise-grade encryption</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;