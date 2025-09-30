// Global Authentication Guard
export const AuthGuard = {
  // Check if user is authenticated
  isAuthenticated: () => {
    const adminData = sessionStorage.getItem('adminData');
    const loggedOut = sessionStorage.getItem('loggedOut');
    
    if (loggedOut === 'true' || !adminData) {
      return false;
    }
    
    // Check session validity (24 hours)
    try {
      const admin = JSON.parse(adminData);
      const currentTime = new Date().getTime();
      const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
      
      if (currentTime - admin.loginTime > sessionDuration) {
        AuthGuard.logout();
        return false;
      }
      
      return true;
    } catch (error) {
      AuthGuard.logout();
      return false;
    }
  },

  // Global logout function
  logout: () => {
    sessionStorage.removeItem('adminData');
    sessionStorage.removeItem('userToken');
    sessionStorage.removeItem('userType');  
    sessionStorage.removeItem('adminId');
    sessionStorage.setItem('loggedOut', 'true');
    
    // Dispatch storage event for cross-component sync
    window.dispatchEvent(new Event('storage'));
    
    // Clear browser history and redirect to home
    window.history.pushState(null, '', '/');
    window.location.replace('/');
  },

  // Get admin data
  getAdminData: () => {
    if (!AuthGuard.isAuthenticated()) {
      return null;
    }
    
    try {
      return JSON.parse(sessionStorage.getItem('adminData'));
    } catch (error) {
      AuthGuard.logout();
      return null;
    }
  },

  // Set admin data on login
  setAdminData: (adminData) => {
    const adminWithTimestamp = {
      ...adminData,
      loginTime: new Date().getTime()
    };
    sessionStorage.setItem('adminData', JSON.stringify(adminWithTimestamp));
    sessionStorage.removeItem('loggedOut');
  },

  // Prevent back navigation to protected pages
  preventBackNavigation: () => {
    const handlePopState = (event) => {
      if (!AuthGuard.isAuthenticated()) {
        event.preventDefault();
        window.history.pushState(null, '', '/');
        window.location.replace('/');
        return false;
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.history.pushState(null, '', window.location.pathname);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }
};

// Global function to check authentication on page load
export const checkAuthOnPageLoad = () => {
  // Clear logout flag when starting fresh session
  if (sessionStorage.getItem('loggedOut') === 'true' && 
      window.location.pathname.includes('/admin')) {
    AuthGuard.logout();
  }
};