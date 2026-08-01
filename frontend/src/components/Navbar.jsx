import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={styles.nav}>
      <div style={styles.navContainer}>
        <Link to="/" style={styles.logo}>
          <div style={styles.logoBadge}>FK</div>
          <div style={styles.logoText}>
            <span style={styles.logoTitle}>Freilichtspiele Katzweiler</span>
            <span style={styles.logoSubtitle}>Spielerkantine</span>
          </div>
        </Link>

        {user ? (
          <div style={styles.navLinks}>
            {user.role === 'admin' && (
              <>
                <Link
                  to="/admin"
                  style={{
                    ...styles.navLink,
                    ...(isActive('/admin') ? styles.navLinkActive : {}),
                  }}
                >
                  Admin-Bereich
                </Link>
                <Link
                  to="/kasse"
                  style={{
                    ...styles.navLink,
                    ...(isActive('/kasse') ? styles.navLinkActive : {}),
                  }}
                >
                  Kassen-Terminal
                </Link>
              </>
            )}

            {user.role === 'pos' && (
              <Link
                to="/kasse"
                style={{
                  ...styles.navLink,
                  ...(isActive('/kasse') ? styles.navLinkActive : {}),
                }}
              >
                Kassen-Terminal
              </Link>
            )}

            user.role === 'user' && (
              <Link
                to="/dashboard"
                style={{
                  ...styles.navLink,
                  ...(isActive('/dashboard') ? styles.navLinkActive : {}),
                }}
              >
                Mein Konto
              </Link>
            )

            <div style={styles.userInfo}>
              <span style={styles.userName}>{user.name}</span>
              {user.role === 'admin' && <span className="badge badge-admin">Admin</span>}
              {user.role === 'pos' && <span className="badge badge-pos">Kasse</span>}
              {user.role === 'user' && <span className="badge badge-user">Spieler</span>}
              {user.role === 'user' && (
                <span style={styles.userBalance}>
                  {user.balance.toFixed(2).replace('.', ',')} €
                </span>
              )}
              <button onClick={handleLogout} style={styles.logoutBtn}>
                Abmelden
              </button>
            </div>
          </div>
        ) : (
          <div style={styles.navLinks}>
            <Link to="/login" style={styles.loginBtn}>
              Anmelden
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    background: 'rgba(13, 14, 18, 0.8)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    padding: '0.75rem 1.5rem',
  },
  navContainer: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none',
    gap: '0.75rem',
  },
  logoBadge: {
    background: 'var(--primary)',
    color: '#fff',
    fontWeight: '800',
    fontSize: '1.2rem',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.15)',
  },
  logoText: {
    display: 'flex',
    flexDirection: 'column',
  },
  logoTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: '1.05rem',
    lineHeight: '1.2',
  },
  logoSubtitle: {
    color: 'var(--accent)',
    fontSize: '0.8rem',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  navLink: {
    color: 'var(--text-muted)',
    textDecoration: 'none',
    fontSize: '0.95rem',
    fontWeight: '600',
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    transition: 'var(--transition)',
  },
  navLinkActive: {
    color: '#fff',
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    paddingLeft: '1rem',
    borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
  },
  userName: {
    color: '#fff',
    fontWeight: '600',
    fontSize: '0.95rem',
  },
  userBalance: {
    background: 'rgba(212, 175, 55, 0.15)',
    color: 'var(--accent)',
    padding: '0.25rem 0.6rem',
    borderRadius: '6px',
    fontWeight: '700',
    fontSize: '0.85rem',
  },
  logoutBtn: {
    background: 'rgba(239, 68, 68, 0.15)',
    color: 'var(--danger)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    padding: '0.4rem 0.8rem',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
  loginBtn: {
    background: 'var(--primary)',
    color: '#fff',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '0.95rem',
    transition: 'var(--transition)',
  },
};
