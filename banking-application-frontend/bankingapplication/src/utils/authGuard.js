// Global Authentication Guard
export const AuthGuard = {
  // Check if regular user is authenticated (JWT in localStorage)
  isAuthenticated: () => {
    const token = localStorage.getItem('authToken');
    return !!token;
  },

  // Check if admin is authenticated (sessionStorage)
  isAdminAuthenticated: () => {
    const adminData = sessionStorage.getItem('adminData');
    const loggedOut = sessionStorage.getItem('loggedOut');

    if (loggedOut === 'true' || !adminData) {
      return false;
    }

    try {
      const admin = JSON.parse(adminData);
      const currentTime = new Date().getTime();
      const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
      if (currentTime - (admin.loginTime || 0) > sessionDuration) {
        AuthGuard.logoutAdmin();
        return false;
      }
      return true;
    } catch (error) {
      AuthGuard.logoutAdmin();
      return false;
    }
  },

  // Get current user object from localStorage JWT data
  getCurrentUser: () => {
    try {
      const raw = localStorage.getItem('currentUser');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  // Get JWT token
  getToken: () => localStorage.getItem('authToken'),

  // Get user type ('user' or 'admin')
  getUserType: () => localStorage.getItem('userType'),

  // Async user logout — calls backend to blacklist token, then clears localStorage
  logout: async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        await fetch('http://localhost:8081/api/user/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
      }
    } catch (e) {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('userType');
      window.dispatchEvent(new Event('storage'));
      window.location.href = '/';
    }
  },

  // Admin logout — clears sessionStorage
  logoutAdmin: () => {
    sessionStorage.setItem('loggedOut', 'true');
    sessionStorage.removeItem('adminData');
    sessionStorage.removeItem('userToken');
    sessionStorage.removeItem('userType');
    sessionStorage.removeItem('adminId');
    window.dispatchEvent(new Event('storage'));
    AuthGuard.applyNoCacheHeaders();
    if (window.history.pushState) {
      window.history.pushState(null, '', '/');
      window.history.replaceState(null, '', '/');
    }
    window.location.href = '/';
  },

  // Legacy alias
  logoutUser: async () => AuthGuard.logout(),

  // Get admin data
  getAdminData: () => {
    if (!AuthGuard.isAdminAuthenticated()) {
      return null;
    }
    try {
      return JSON.parse(sessionStorage.getItem('adminData'));
    } catch (error) {
      AuthGuard.logoutAdmin();
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
      if (!AuthGuard.isAuthenticated() && !AuthGuard.isAdminAuthenticated()) {
        window.location.href = '/signin';
      }
    };

    const handlePopState = () => {
      blockIfLoggedOut();
    };

    const handlePageShow = (e) => {
      if (e.persisted) {
        blockIfLoggedOut();
      }
    };

    window.addEventListener('popstate', handlePopState, { passive: true });
    window.addEventListener('pageshow', handlePageShow, { passive: true });

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
  if (sessionStorage.getItem('loggedOut') === 'true' &&
      window.location.pathname.includes('/admin')) {
    AuthGuard.logoutAdmin();
  }
  AuthGuard.applyNoCacheHeaders();
};