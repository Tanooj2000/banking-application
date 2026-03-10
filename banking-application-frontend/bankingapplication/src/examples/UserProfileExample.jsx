// Example component showing JWT authentication usage
import React, { useState, useEffect } from 'react';
import { AuthGuard } from '../utils/authGuard';
import { getUserById } from '../api/userApi';

const UserProfileExample = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        // Check if user is authenticated
        if (!AuthGuard.isAuthenticated()) {
          setError('User not authenticated');
          return;
        }

        // Get current user from localStorage
        const currentUser = AuthGuard.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }

        // Optionally, fetch fresh user data from API
        // This will automatically include the Authorization header
        const freshUserData = await getUserById(currentUser.id);
        setUser(freshUserData);

      } catch (err) {
        console.error('Failed to load user profile:', err);
        setError(err.message);
        
        // If it's an auth error, the API will have already handled logout
        // and redirected the user
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await AuthGuard.logout(); // This calls the backend and clears localStorage
    } catch (error) {
      console.error('Logout failed:', error);
      // AuthGuard.logout() handles cleanup even if API fails
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>User Profile</h2>
      {user && (
        <div>
          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Token Present:</strong> {AuthGuard.getToken() ? 'Yes' : 'No'}</p>
          <p><strong>User Type:</strong> {AuthGuard.getUserType()}</p>
          
          <button onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfileExample;