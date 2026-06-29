import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { logout } from './utils/api';
import { getDefaultRouteForRole } from './utils/roleRoutes';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Dashboard from './components/Dashboard';
import SubmissionForm from './components/SubmissionForm';
import AdminPanel from './components/AdminPanel';
import ViewSubmission from './components/ViewSubmission';
import PublicationFundingForm from './components/publicationFunding/PublicationFundingForm';
import ViewPublicationFunding from './components/ViewPublicationFunding';
import ChangePassword from './components/ChangePassword';
import { Toaster } from '@/components/ui/sonner';

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');
    if (savedUser && accessToken) {
      return JSON.parse(savedUser);
    }
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    return null;
  });

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      /* best-effort logout */
    }
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  const homeRoute = user ? getDefaultRouteForRole(user.role) : '/login';

  return (
    <Router>
      <Toaster />
      <div className="app">
        <Routes>
          <Route
            path="/login"
            element={user ? <Navigate to={homeRoute} replace /> : <Login onLogin={handleLogin} />}
          />
          <Route
            path="/forgot-password"
            element={user ? <Navigate to={homeRoute} replace /> : <ForgotPassword />}
          />
          <Route
            path="/reset-password"
            element={user ? <Navigate to={homeRoute} replace /> : <ResetPassword />}
          />
          <Route
            path="/dashboard"
            element={
              !user ? (
                <Navigate to="/login" />
              ) : user.role === 'admin' ? (
                <Navigate to="/admin" replace />
              ) : (
                <Dashboard user={user} onLogout={handleLogout} />
              )
            }
          />
          <Route
            path="/submission/new"
            element={
              !user ? (
                <Navigate to="/login" />
              ) : user.role !== 'researcher' ? (
                <Navigate to={getDefaultRouteForRole(user.role)} replace />
              ) : (
                <SubmissionForm user={user} onLogout={handleLogout} />
              )
            }
          />
          <Route
            path="/submission/:id"
            element={user ? <ViewSubmission user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
          />
          <Route
            path="/submission/:id/edit"
            element={
              !user ? (
                <Navigate to="/login" />
              ) : user.role !== 'researcher' ? (
                <Navigate to={getDefaultRouteForRole(user.role)} replace />
              ) : (
                <SubmissionForm user={user} onLogout={handleLogout} />
              )
            }
          />
          <Route
            path="/admin"
            element={
              user && user.role === 'admin' ? (
                <AdminPanel user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to={user ? homeRoute : '/login'} replace />
              )
            }
          />
          <Route
            path="/publication-funding/new"
            element={
              !user ? (
                <Navigate to="/login" />
              ) : user.role !== 'researcher' ? (
                <Navigate to={getDefaultRouteForRole(user.role)} replace />
              ) : (
                <PublicationFundingForm user={user} onLogout={handleLogout} />
              )
            }
          />
          <Route
            path="/publication-funding/:id"
            element={user ? <ViewPublicationFunding user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
          />
          <Route
            path="/publication-funding/:id/edit"
            element={
              !user ? (
                <Navigate to="/login" />
              ) : user.role !== 'researcher' ? (
                <Navigate to={getDefaultRouteForRole(user.role)} replace />
              ) : (
                <PublicationFundingForm user={user} onLogout={handleLogout} />
              )
            }
          />
          <Route
            path="/change-password"
            element={user ? <ChangePassword user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
          />
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
