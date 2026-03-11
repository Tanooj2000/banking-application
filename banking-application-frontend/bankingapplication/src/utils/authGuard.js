// Global Authentication Guard
export const AuthGuard = {
  // Check if user is authenticated with JWT token
  isAuthenticated: () => {
    const token = localStorage.getItem('authToken');
    const currentUser = localStorage.getItem('currentUser');
    
    if (!token || !currentUser) {
      return false;
    }
    
    // Optional: Check if token is expired (requires JWT parsing or backend validation)
    // For now, we rely on backend 401/403 responses to handle expired tokens
    try {
      JSON.parse(currentUser); // Validate user data format
      return true;
    } catch (error) {
      AuthGuard.logout();
      return false;
    }
  },

  // Check if user is admin (legacy admin session check)
  isAdminAuthenticated: () => {
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
        AuthGuard.logoutAdmin();
        return false;
      }
      
      return true;
    } catch (error) {
      AuthGuard.logoutAdmin();
      return false;
    }
  },

  // Get current user data
  getCurrentUser: () => {
    if (!AuthGuard.isAuthenticated()) {
      return null;
    }
    
    try {
      return JSON.parse(localStorage.getItem('currentUser'));
    } catch (error) {
      AuthGuard.logout();
      return null;
    }
  },

  // Get JWT token
  getToken: () => {
    return localStorage.getItem('authToken');
  },

  // Get user type
  getUserType: () => {
    return localStorage.getItem('userType');
  },

  // JWT-based logout function
  logout: async () => {
    try {
      // Call logout API to blacklist token
      const { logoutUser } = await import('../api/userApi');
      await logoutUser();
    } catch (error) {
      console.error('Logout API call failed:', error);
    }
    
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userType');
    
    // Broadcast storage change
    window.dispatchEvent(new Event('storage'));
    
    // Apply no-cache headers
    AuthGuard.applyNoCacheHeaders();
    
    // Navigate to home
    try {
      if (window.history.pushState) {
        window.history.pushState(null, '', '/');
        window.history.replaceState(null, '', '/');
      }
      window.location.href = '/';
    } catch (e) {
      window.location.href = '/';
    }
  },
  // Admin logout function (legacy)
  logoutAdmin: () => {
    try {
      // Mark logged out first so any async/react re-render sees it immediately
      sessionStorage.setItem('loggedOut', 'true');

      // Clear sensitive keys (keep loggedOut flag)
      sessionStorage.removeItem('adminData');
      sessionStorage.removeItem('userToken');
      sessionStorage.removeItem('userType');
      sessionStorage.removeItem('adminId');

      // Defensive: also clear potential legacy/local storage
      ['adminData','userToken','userType','adminId'].forEach(k=>localStorage.removeItem(k));

      // Broadcast
      window.dispatchEvent(new Event('storage'));

      // Insert no-cache headers meta (best-effort)
      AuthGuard.applyNoCacheHeaders();

      // Push a clean state then replace to break back chain
      if (window.history.pushState) {
        window.history.pushState(null, '', '/');
        window.history.replaceState(null, '', '/');
      }

      // Force a hard navigation (prevents bfcache restore in most browsers)
      window.location.href = '/';
    } catch (e) {
      // Fallback
      window.location.href = '/';
    }
  },

  // Legacy user logout - now delegates to main logout
  logoutUser: () => {
    AuthGuard.logout();
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
    const blockIfLoggedOut = () => {
      if (sessionStorage.getItem('loggedOut') === 'true' || !AuthGuard.isAuthenticated()) {
        AuthGuard.logout();
      }
    };

    const handlePopState = () => {
      blockIfLoggedOut();
      // If still authenticated, push another state so back keeps cycling inside app
      if (AuthGuard.isAuthenticated()) {
        window.history.pushState(null, '', window.location.pathname + window.location.search);
      }
    };

    const handlePageShow = (e) => {
      // If coming from bfcache (persisted), re-check
      if (e.persisted) {
        blockIfLoggedOut();
      }
    };

    window.addEventListener('popstate', handlePopState, { passive: true });
    window.addEventListener('pageshow', handlePageShow, { passive: true });
    // Seed an extra history entry so the first back stays inside
    if (window.history.pushState) {
      window.history.pushState(null, '', window.location.pathname + window.location.search);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('pageshow', handlePageShow);
    };
  },

  // Apply aggressive no-cache directives dynamically
  applyNoCacheHeaders: () => {
    const ensure = (name, content) => {
      let tag = document.querySelector(`meta[http-equiv="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('http-equiv', name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };
    ensure('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    ensure('Pragma', 'no-cache');
    ensure('Expires', '0');
  }
};

// Global function to check authentication on page load
export const checkAuthOnPageLoad = () => {
  // Clear logout flag when starting fresh session
  if (sessionStorage.getItem('loggedOut') === 'true' && 
      window.location.pathname.includes('/admin')) {
    AuthGuard.logout();
  }
  // Always apply no-cache headers at boot
  AuthGuard.applyNoCacheHeaders();
};