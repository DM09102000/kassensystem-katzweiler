import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Login from './pages/Login.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import UserDashboard from './pages/UserDashboard.jsx';
import PosKiosk from './pages/PosKiosk.jsx';
import Register from './pages/Register.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data);
        } else {
          // Token abgelaufen oder ungültig
          localStorage.removeItem('token');
          setToken('');
          setUser(null);
        }
      } catch (err) {
        console.error('Fehler beim Laden des Profils:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const handleLogin = (loggedInUser, userToken) => {
    localStorage.setItem('token', userToken);
    setToken(userToken);
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#fff' }}>
        <h2>Lade Kassensystem...</h2>
      </div>
    );
  }

  // Hilfs-Komponenten für Route Guards
  const AdminRoute = ({ children }) => {
    return user && user.role === 'admin' ? children : <Navigate to="/login" replace />;
  };

  const PosRoute = ({ children }) => {
    return user && (user.role === 'pos' || user.role === 'admin') ? children : <Navigate to="/login" replace />;
  };

  const UserRoute = ({ children }) => {
    return user && (user.role === 'user' || user.role === 'admin') ? children : <Navigate to="/login" replace />;
  };

  // Root Weiterleitung basierend auf Rolle
  const RootRedirect = () => {
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'pos') return <Navigate to="/kasse" replace />;
    return <Navigate to="/dashboard" replace />;
  };

  return (
    <Router>
      <div className="app-container">
        <Navbar user={user} onLogout={handleLogout} />
        
        <main>
          <Routes>
            <Route path="/login" element={user ? <RootRedirect /> : <Login onLoginSuccess={handleLogin} />} />
            
            <Route 
              path="/admin" 
              element={
                <AdminRoute>
                  <AdminDashboard token={token} />
                </AdminRoute>
              } 
            />
            
            <Route 
              path="/kasse" 
              element={
                <PosRoute>
                  <PosKiosk token={token} />
                </PosRoute>
              } 
            />
            
            <Route 
              path="/dashboard" 
              element={
                <UserRoute>
                  <UserDashboard token={token} />
                </UserRoute>
              } 
            />
            
            <Route 
              path="/register" 
              element={<Register onLoginSuccess={handleLogin} />} 
            />

            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
