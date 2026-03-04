import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { logout } from './utils/api';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Dashboard from './components/Dashboard';
import SubmissionForm from './components/SubmissionForm';
import AdminPanel from './components/AdminPanel';
import ViewSubmission from './components/ViewSubmission';
import ChangePassword from './components/ChangePassword';
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {}
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} 
          />
          <Route 
            path="/forgot-password" 
            element={user ? <Navigate to="/dashboard" /> : <ForgotPassword />} 
          />
          <Route 
            path="/reset-password" 
            element={user ? <Navigate to="/dashboard" /> : <ResetPassword />} 
          />
          <Route 
            path="/dashboard" 
            element={user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/submission/new" 
            element={user ? <SubmissionForm user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/submission/:id" 
            element={user ? <ViewSubmission user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/submission/:id/edit" 
            element={user ? <SubmissionForm user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/admin" 
            element={user && user.role === 'admin' ? <AdminPanel user={user} onLogout={handleLogout} /> : <Navigate to="/dashboard" />} 
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
