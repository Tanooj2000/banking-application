// Global Authentication Guard
export const AuthGuard = {
  LEAVE_GUARD_BYPASS_KEY: 'leaveGuardBypass',

  // Check if regular user is authenticated (JWT in localStorage)
  isAuthenticated: () => {
    const token = localStorage.getItem('authToken');
    const currentUser = AuthGuard.getCurrentUser();
    
    // More thorough check - need both token and valid user data
    if (!token || !currentUser) {
      return false;
    }
    
    // Validate that user has essential data
    if (!currentUser.id && !currentUser.userId) {
      console.warn('User data missing ID, clearing authentication');
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('userType');
      return false;
    }
    
    return true;
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
    localStorage.setItem(AuthGuard.LEAVE_GUARD_BYPASS_KEY, 'true');
    sessionStorage.setItem(AuthGuard.LEAVE_GUARD_BYPASS_KEY, 'true');
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
      // Clear ALL possible authentication data
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('userType');
      localStorage.removeItem('userId');
      localStorage.removeItem('userToken');
      
      // Also clear any session storage data that might interfere
      sessionStorage.removeItem('userId');
      sessionStorage.removeItem('userToken');
      sessionStorage.removeItem('userType');
      sessionStorage.removeItem('adminData');
      sessionStorage.removeItem('loggedOut');
      
      window.dispatchEvent(new Event('storage'));
      window.location.href = '/';
    }
  },

  // Admin logout — clears sessionStorage
  logoutAdmin: () => {
    localStorage.setItem(AuthGuard.LEAVE_GUARD_BYPASS_KEY, 'true');
    sessionStorage.setItem(AuthGuard.LEAVE_GUARD_BYPASS_KEY, 'true');
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
    localStorage.removeItem(AuthGuard.LEAVE_GUARD_BYPASS_KEY);
    sessionStorage.removeItem(AuthGuard.LEAVE_GUARD_BYPASS_KEY);
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
  },

  // Show a logout confirmation when the user navigates away via browser
  // back/forward buttons. Reload is intentionally excluded — it must never
  // trigger the prompt or clear auth data.
  registerLeavePromptAndAutoLogout: ({ isAdmin = false } = {}) => {
    const protectedUrl = window.location.pathname + window.location.search;

    const hasActiveSession = () => {
      return isAdmin ? AuthGuard.isAdminAuthenticated() : AuthGuard.isAuthenticated();
    };

    const forceLogoutRedirect = () => {
      localStorage.setItem(AuthGuard.LEAVE_GUARD_BYPASS_KEY, 'true');
      sessionStorage.setItem(AuthGuard.LEAVE_GUARD_BYPASS_KEY, 'true');

      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('userType');
      localStorage.removeItem('userId');
      localStorage.removeItem('userToken');

      sessionStorage.setItem('loggedOut', 'true');
      sessionStorage.removeItem('adminData');
      sessionStorage.removeItem('userToken');
      sessionStorage.removeItem('userType');
      sessionStorage.removeItem('adminId');
      sessionStorage.removeItem('userId');

      window.dispatchEvent(new Event('storage'));
      window.location.href = '/';
    };

    // Push a sentinel history entry so pressing back fires popstate
    // instead of silently leaving. Without this, popstate never fires.
    window.history.pushState({ leaveGuard: true }, '', protectedUrl);

    // popstate fires on back/forward navigation — NOT on reload or address-bar changes.
    const handlePopState = (event) => {
      if (!hasActiveSession()) return;

      const confirmed = window.confirm(
        'Do you want to logout?\n\nLeaving this page will end your session.'
      );

      if (confirmed) {
        forceLogoutRedirect();
      } else {
        // Re-push the sentinel so the guard is re-armed for next back press.
        window.history.pushState({ leaveGuard: true }, '', protectedUrl);
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }
};

// Global function to check authentication on page load
export const checkAuthOnPageLoad = () => {
  localStorage.removeItem(AuthGuard.LEAVE_GUARD_BYPASS_KEY);
  sessionStorage.removeItem(AuthGuard.LEAVE_GUARD_BYPASS_KEY);

  if (sessionStorage.getItem('loggedOut') === 'true' &&
      window.location.pathname.includes('/admin')) {
    AuthGuard.logoutAdmin();
  }
  AuthGuard.applyNoCacheHeaders();
};