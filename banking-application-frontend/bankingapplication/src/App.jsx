import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css'

import { checkAuthOnPageLoad } from './utils/authGuard';
import ProtectedRoute from './utils/ProtectedRoute.jsx';

const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const AboutPage = lazy(() => import('./pages/AboutPage.jsx'));
const SignIn = lazy(() => import('./pages/SignIn'));
const SignUp = lazy(() => import('./pages/SignUp'));
const BrowseBank = lazy(() => import('./pages/BrowseBank'));
const UserPage = lazy(() => import('./pages/UserPage.jsx'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const CreateAccount = lazy(() => import('./pages/CreateAccount'));

function App() {
  // Check authentication on app load
  useEffect(() => {
    checkAuthOnPageLoad();
  }, []);

  return (
    <Router>
      <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route
            path="/signin"
            element={
              <ProtectedRoute requireAuth={false}>
                <SignIn />
              </ProtectedRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <ProtectedRoute requireAuth={false}>
                <SignUp />
              </ProtectedRoute>
            }
          />
          <Route
            path="/browsebank"
            element={
              <ProtectedRoute userOnly={true}>
                <BrowseBank />
              </ProtectedRoute>
            }
          />
          <Route
            path="/userpage"
            element={
              <ProtectedRoute userOnly={true}>
                <UserPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/adminpage"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/createaccount"
            element={
              <ProtectedRoute userOnly={true}>
                <CreateAccount />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
      {/* Removed global RagChatbot overlay. Use ChatBotButton for toggled chat UI. */}
    </Router>
  );
}
 
export default App;