import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Register({ onLoginSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Token aus URL extrahieren
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');

  const [googleClientId, setGoogleClientId] = useState('');
  const [generalToken, setGeneralToken] = useState('');
  const [tokenType, setTokenType] = useState(''); // 'general' or 'specific'
  const [loading, setLoading] = useState(true);
  const [verifyingToken, setVerifyingToken] = useState(true);
  const [tokenError, setTokenError] = useState('');
  const [codeField, setCodeField] = useState('');

  // Formularfelder
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 1. Lade Konfiguration vom Server
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/config');
        const data = await res.json();
        setGoogleClientId(data.googleClientId);
        setGeneralToken(data.generalInviteToken);
      } catch (err) {
        console.error('Fehler beim Laden der Google-Konfiguration:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  // 2. Verifiziere das Token
  useEffect(() => {
    if (!token) {
      setTokenError('Kein Einladungs-Token angegeben. Registrierungen sind nur über einen gültigen Einladungslink möglich.');
      setVerifyingToken(false);
      return;
    }

    const verifyInvite = async () => {
      try {
        const res = await fetch(`/api/auth/verify-invite?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (!res.ok || !data.valid) {
          throw new Error(data.error || 'Ungültiger oder abgelaufener Einladungslink.');
        }

        setTokenType(data.type);
        if (data.type === 'specific' && data.user) {
          setName(data.user.name || '');
          setEmail(data.user.email || '');
        }
      } catch (err) {
        setTokenError(err.message);
      } finally {
        setVerifyingToken(false);
      }
    };

    verifyInvite();
  }, [token]);

  // 3. Initialisiere Google Sign-In Button
  useEffect(() => {
    if (!loading && !verifyingToken && !tokenError && googleClientId && window.google) {
      /* global google */
      google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredentialResponse,
      });
      google.accounts.id.renderButton(
        document.getElementById('google-signup-button'),
        { theme: 'outline', size: 'large', width: '100%' }
      );
    }
  }, [loading, verifyingToken, tokenError, googleClientId]);

  // Google Callback
  const handleGoogleCredentialResponse = async (response) => {
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential: response.credential,
          inviteToken: token,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Google-Registrierung fehlgeschlagen');

      setSuccess('Registrierung erfolgreich abgeschlossen! Weiterleitung...');
      setTimeout(() => {
        onLoginSuccess(data.user, data.token);
        navigate('/');
      }, 1500);
    } catch (err) {
      setError(err.message);
    }
  };

  // Klassisches Formular abschicken
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !username || !password) {
      setError('Bitte alle Pflichtfelder ausfüllen.');
      return;
    }

    if (tokenType === 'general' && !email) {
      setError('Eine E-Mail-Adresse ist für die Registrierung erforderlich.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name,
          username,
          email: email || undefined,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler bei der Registrierung');

      setSuccess('Konto erfolgreich erstellt! Weiterleitung...');
      setTimeout(() => {
        onLoginSuccess(data.user, data.token);
        navigate('/');
      }, 1500);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading || verifyingToken) {
    return (
      <div style={styles.container}>
        <div className="card" style={styles.card}>
          <div style={styles.loadingSpinner}></div>
          <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-muted)' }}>
            Einladungslink wird verifiziert...
          </p>
        </div>
      </div>
    );
  }

  if (tokenError) {
    const isMissingToken = tokenError.includes('Kein Einladungs-Token angegeben');

    const handleManualCodeSubmit = (e) => {
      e.preventDefault();
      if (codeField.trim()) {
        setTokenError('');
        setVerifyingToken(true);
        navigate(`/register?token=${encodeURIComponent(codeField.trim())}`);
      }
    };

    return (
      <div style={styles.container}>
        <div className="card" style={styles.card}>
          <div style={styles.errorIcon}>⚠️</div>
          <h2 style={{ textAlign: 'center', color: '#fff', marginBottom: '1rem' }}>
            {isMissingToken ? 'Einladungscode benötigt' : 'Zugriff verweigert'}
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--danger)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
            {tokenError}
          </p>

          {isMissingToken ? (
            <form onSubmit={handleManualCodeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Einladungscode eingeben (z.B. FK-KANTINE...)"
                  className="input-field"
                  value={codeField}
                  onChange={(e) => setCodeField(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-accent" style={{ width: '100%' }}>
                Code überprüfen
              </button>
            </form>
          ) : null}

          <button
            onClick={() => navigate('/login')}
            className="btn btn-secondary"
            style={{ width: '100%', marginTop: '1rem' }}
          >
            Zurück zum Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container} className="animated">
      <div className="card" style={styles.card}>
        <h2 style={styles.title}>Konto aktivieren</h2>
        <p style={styles.subtitle}>
          {tokenType === 'specific'
            ? 'Vervollständige die Registrierung für deinen vorbereiteten Account.'
            : 'Erstelle dein neues persönliche Benutzerkonto für die Spielerkantine.'}
        </p>

        {error && <div style={styles.errorAlert}>{error}</div>}
        {success && <div style={styles.successAlert}>{success}</div>}

        {/* GOOGLE SIGNUP */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div id="google-signup-button"></div>
        </div>

        <div style={styles.divider}>
          <span style={styles.dividerText}>oder klassisch registrieren</span>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <label className="form-label">Dein Name</label>
            <input
              type="text"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Vorname Nachname"
            />
          </div>

          <div className="form-group">
            <label className="form-label">E-Mail-Adresse</label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required={tokenType === 'general'}
              disabled={tokenType === 'specific' && email !== ''}
              placeholder="max@beispiel.de"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Benutzername (für den Login)</label>
            <input
              type="text"
              className="input-field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="z.B. max_mustermann"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Passwort festlegen</label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Mindestens 6 Zeichen"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Passwort wiederholen</label>
            <input
              type="password"
              className="input-field"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Passwort erneut eingeben"
            />
          </div>

          <button type="submit" className="btn btn-accent" style={styles.submitBtn}>
            Konto registrieren
          </button>
        </form>

        <p style={styles.loginHint}>
          Bereits ein Konto? <span onClick={() => navigate('/login')} style={styles.loginLink}>Hier anmelden</span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 'calc(100vh - 120px)',
    padding: '2rem 1.5rem',
  },
  card: {
    width: '100%',
    maxWidth: '480px',
    padding: '2.5rem',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    textAlign: 'center',
    marginBottom: '2rem',
    lineHeight: '1.4',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginTop: '1rem',
  },
  submitBtn: {
    marginTop: '1rem',
    padding: '0.75rem',
    fontSize: '1rem',
    fontWeight: '700',
  },
  loginHint: {
    textAlign: 'center',
    marginTop: '1.5rem',
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
  loginLink: {
    color: 'var(--accent)',
    cursor: 'pointer',
    fontWeight: '600',
    textDecoration: 'underline',
  },
  errorAlert: {
    background: 'rgba(239, 68, 68, 0.15)',
    color: 'var(--danger)',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    marginBottom: '1.5rem',
    fontSize: '0.85rem',
  },
  successAlert: {
    background: 'rgba(34, 197, 94, 0.15)',
    color: 'var(--success)',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    marginBottom: '1.5rem',
    fontSize: '0.85rem',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    textAlign: 'center',
    margin: '1.5rem 0',
  },
  dividerText: {
    padding: '0 0.75rem',
    color: 'var(--text-muted)',
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    width: '100%',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px'
  },
  errorIcon: {
    fontSize: '3rem',
    textAlign: 'center',
    marginBottom: '1rem',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(255, 255, 255, 0.1)',
    borderTop: '3px solid var(--accent)',
    borderRadius: '50%',
    margin: '0 auto',
  }
};
