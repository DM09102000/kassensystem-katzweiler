import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');
  const navigate = useNavigate();

  // Google Config laden
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/config');
        const data = await res.json();
        setGoogleClientId(data.googleClientId);
      } catch (err) {
        console.error('Fehler beim Laden der Google-Konfiguration:', err);
      }
    };
    fetchConfig();
  }, []);

  // Google Login initialisieren
  useEffect(() => {
    if (googleClientId && window.google) {
      /* global google */
      google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleLogin,
      });
      google.accounts.id.renderButton(
        document.getElementById('google-login-button'),
        { theme: 'outline', size: 'large', width: '100%' }
      );
    }
  }, [googleClientId]);

  const handleGoogleLogin = async (response) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Google-Login fehlgeschlagen');

      onLoginSuccess(data.user, data.token);

      if (data.user.role === 'admin') {
        navigate('/admin');
      } else if (data.user.role === 'pos') {
        navigate('/kasse');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login fehlgeschlagen');
      }

      onLoginSuccess(data.user, data.token);

      // Redirect depending on role
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else if (data.user.role === 'pos') {
        navigate('/kasse');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container} className="animated">
      <div className="card" style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoBadge}>FK</div>
          <h1>Spielerkantine</h1>
          <p>Freilichtspiele Katzweiler e.V.</p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {/* GOOGLE LOGIN */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div id="google-login-button"></div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }}></div>
          <span style={{ padding: '0 0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>oder</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }}></div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Benutzername
            </label>
            <input
              id="username"
              type="text"
              className="input-field"
              placeholder="z.B. admin oder max"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Passwort
            </label>
            <input
              id="password"
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="btn btn-primary"
            style={styles.submitBtn}
            disabled={loading}
          >
            {loading ? 'Anmeldung...' : 'Einloggen'}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Noch kein Konto? <Link to="/register" style={{ color: 'var(--accent)', fontWeight: '600', textDecoration: 'underline' }}>Mit Einladungslink registrieren</Link>
        </p>

        <div style={styles.demoCredentials}>
          <p style={styles.demoTitle}>Demo-Zugangsdaten:</p>
          <div style={styles.demoGrid}>
            <div>
              <strong>Admin:</strong> admin / admin123
            </div>
            <div>
              <strong>Kasse:</strong> kasse / kasse123
            </div>
            <div>
              <strong>Spieler:</strong> max / spieler123
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '80vh',
    padding: '1rem',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    padding: '2.5rem 2rem',
    textAlign: 'center',
  },
  header: {
    marginBottom: '2rem',
  },
  logoBadge: {
    background: 'var(--primary)',
    color: '#fff',
    fontWeight: '800',
    fontSize: '1.5rem',
    width: '60px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '14px',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    margin: '0 auto 1rem auto',
    boxShadow: 'var(--shadow-md)',
  },
  submitBtn: {
    width: '100%',
    marginTop: '0.5rem',
  },
  error: {
    background: 'rgba(239, 68, 68, 0.15)',
    color: '#fc8181',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    padding: '0.75rem',
    marginBottom: '1.5rem',
    fontSize: '0.9rem',
    textAlign: 'left',
  },
  demoCredentials: {
    marginTop: '2rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    textAlign: 'left',
    fontSize: '0.8rem',
  },
  demoTitle: {
    color: 'var(--accent)',
    fontWeight: '600',
    marginBottom: '0.5rem',
  },
  demoGrid: {
    display: 'grid',
    gap: '0.25rem',
    color: 'var(--text-muted)',
  },
};
