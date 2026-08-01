import React, { useState, useEffect } from 'react';

export default function UserDashboard({ token }) {
  const [users, setUsers] = useState([]); // Eigener Account + Kinder
  const [transactions, setTransactions] = useState([]);
  const [newChildName, setNewChildName] = useState('');
  const [newChildLimit, setNewChildLimit] = useState('');
  const [editingChildId, setEditingChildId] = useState(null);
  const [editingChildLimit, setEditingChildLimit] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  // Daten laden
  const loadData = async () => {
    try {
      // 1. Benutzer laden (enthält self + Kinder)
      const usersRes = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const usersData = await usersRes.json();
      if (!usersRes.ok) throw new Error(usersData.error || 'Fehler beim Laden der Benutzer');

      // 2. Transaktionen laden (enthält eigene + Kinder)
      const txRes = await fetch('/api/transactions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const txData = await txRes.json();
      if (!txRes.ok) throw new Error(txData.error || 'Fehler beim Laden der Transaktionen');

      setUsers(usersData);
      setTransactions(txData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Kind-Account anlegen
  const handleAddChild = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newChildName.trim()) {
      setError('Name des Kindes ist erforderlich');
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newChildName,
          daily_limit: newChildLimit === '' ? null : parseFloat(newChildLimit),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Fehler beim Anlegen des Kinder-Accounts');

      setSuccess(`Kinder-Account für ${data.name} erfolgreich angelegt.`);
      setNewChildName('');
      setNewChildLimit('');
      loadData(); // Neu laden
    } catch (err) {
      setError(err.message);
    }
  };

  // Tageslimit eines Kindes ändern
  const handleUpdateLimit = async (e, childId) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/users/${childId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          daily_limit: editingChildLimit === '' ? null : parseFloat(editingChildLimit),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Fehler beim Speichern des Tageslimits');

      setSuccess(`Tageslimit für ${data.name} erfolgreich aktualisiert.`);
      setEditingChildId(null);
      setEditingChildLimit('');
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Avatar hochladen
  const handleAvatarChange = async (e, userId) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 200 * 1024) {
      alert('Das Profilbild ist zu groß! Bitte wählen Sie ein Bild unter 200 KB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      setError('');
      setSuccess('');
      try {
        const res = await fetch(`/api/users/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ avatar_url: reader.result })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Fehler beim Speichern des Profilbilds');

        setSuccess(`Profilbild für ${data.name} erfolgreich aktualisiert.`);
        loadData();
      } catch (err) {
        setError(err.message);
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Lade Dashboard...</div>;
  }

  const mainUser = users.find((u) => !u.parent_id);
  const children = users.filter((u) => u.parent_id);

  return (
    <div className="animated">
      <div style={styles.header}>
        <h1>Mein Prepaid-Konto</h1>
        <p>Verwalte dein Guthaben, deine Einkäufe und die Accounts deiner Kinder.</p>
      </div>

      {error && <div style={styles.errorAlert}>{error}</div>}
      {success && <div style={styles.successAlert}>{success}</div>}

      <div className="grid-3" style={styles.dashboardGrid}>
        {/* Kontostand-Card */}
        <div className="card" style={styles.card}>
          <h2 style={styles.cardTitle}>Mein Guthaben</h2>
          {mainUser && (
            <div style={styles.balanceContainer}>
              {/* Avatar Vorschau & Upload */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem' }}>
                <div 
                  style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.1)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}
                  onClick={() => document.getElementById('avatar-input-self').click()}
                  title="Profilbild ändern"
                >
                  {mainUser.avatar_url ? (
                    <img src={mainUser.avatar_url} alt="Mein Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '2.5rem' }}>👤</span>
                  )}
                  <div style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.65rem', padding: '2px 0', textAlign: 'center' }}>
                    Ändern
                  </div>
                </div>
                <input
                  type="file"
                  id="avatar-input-self"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleAvatarChange(e, mainUser.id)}
                />
              </div>

              <div style={styles.balanceValue}>
                {mainUser.balance.toFixed(2).replace('.', ',')} €
              </div>
              <div style={styles.userNameLabel}>{mainUser.name}</div>
            </div>
          )}
          <p style={styles.infoText}>
            Zum Aufladen des Kontos bitte an einen Admin oder die Kasse in der Kantine wenden.
          </p>
        </div>

        {/* Kinder-Verwaltung Card */}
        <div className="card" style={styles.card}>
          <h2 style={styles.cardTitle}>Kinder-Accounts</h2>
          <p style={{ ...styles.infoText, marginBottom: '1rem', marginTop: '-0.75rem' }}>
            Kinder greifen auf das Guthaben des Elternkontos zu. NFC-Chips und Fingerabdrücke können nur an der Kasse registriert werden.
          </p>

          {children.length === 0 ? (
            <p style={{ marginBottom: '1.5rem' }}>Keine Kinder-Accounts angelegt.</p>
          ) : (
            <div style={styles.childrenList}>
              {children.map((child) => (
                <div key={child.id} style={{ ...styles.childItem, display: 'flex', gap: '0.75rem', alignItems: 'start' }}>
                  {/* Child Avatar Upload */}
                  <div 
                    style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', cursor: 'pointer', flexShrink: 0 }}
                    onClick={() => document.getElementById(`avatar-input-${child.id}`).click()}
                    title="Kinderbild ändern"
                  >
                    {child.avatar_url ? (
                      <img src={child.avatar_url} alt="Child Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '1.25rem' }}>👶</span>
                    )}
                    <div style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.5rem', padding: '1px 0', textAlign: 'center' }}>
                      +
                    </div>
                  </div>
                  <input
                    type="file"
                    id={`avatar-input-${child.id}`}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleAvatarChange(e, child.id)}
                  />

                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={styles.childName}>{child.name}</span>
                      <button
                        onClick={() => {
                          setEditingChildId(child.id);
                          setEditingChildLimit(child.daily_limit !== null ? child.daily_limit.toString() : '');
                        }}
                        style={styles.inlineEditBtn}
                      >
                        ✏️ Limit ändern
                      </button>
                    </div>

                    <div style={styles.childDetails}>
                      {child.nfc_id && <span style={styles.idBadge}>NFC</span>}
                      {child.fingerprint_id && <span style={styles.idBadge}>Fingerprint</span>}
                      {!child.nfc_id && !child.fingerprint_id && <span style={{ color: 'var(--text-muted)' }}>Keine Hardware verknüpft</span>}
                    </div>

                    {editingChildId === child.id ? (
                      <form onSubmit={(e) => handleUpdateLimit(e, child.id)} style={styles.inlineLimitForm}>
                        <input
                          type="number"
                          step="0.10"
                          min="0"
                          className="input-field"
                          style={styles.inlineLimitInput}
                          placeholder="z.B. 5,00"
                          value={editingChildLimit}
                          onChange={(e) => setEditingChildLimit(e.target.value)}
                        />
                        <button type="submit" className="btn btn-accent" style={styles.inlineLimitSubmit}>
                          Speichern
                        </button>
                        <button type="button" onClick={() => setEditingChildId(null)} className="btn btn-secondary" style={styles.inlineLimitCancel}>
                          X
                        </button>
                      </form>
                    ) : (
                      <div style={styles.limitStatusBox}>
                        <span>Tageslimit: <strong>{child.daily_limit !== null ? `${child.daily_limit.toFixed(2).replace('.', ',')} €` : 'Unbegrenzt'}</strong></span>
                        <br />
                        <span>Heute verbraucht: <strong style={{ color: child.spent_today >= (child.daily_limit || Infinity) ? 'var(--danger)' : 'var(--success)' }}>
                          {child.spent_today.toFixed(2).replace('.', ',')} €
                        </strong></span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={styles.divider}></div>

          <h3 style={styles.subTitle}>Kind hinzufügen</h3>
          <form onSubmit={handleAddChild}>
            <div className="form-group">
              <label className="form-label">Name des Kindes</label>
              <input
                type="text"
                className="input-field"
                placeholder="z.B. Moritz Mustermann"
                value={newChildName}
                onChange={(e) => setNewChildName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tageslimit in € (Optional)</label>
              <input
                type="number"
                step="0.50"
                min="0"
                className="input-field"
                placeholder="z.B. 5,00 (leer für unbegrenzt)"
                value={newChildLimit}
                onChange={(e) => setNewChildLimit(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-accent" style={{ width: '100%' }}>
              Kind-Account erstellen
            </button>
          </form>
        </div>

        {/* Transaktionsverlauf Card */}
        <div className="card" style={{ ...styles.card, gridColumn: 'span 2' }}>
          <h2 style={styles.cardTitle}>Kauf- & Aufladeverlauf</h2>
          {transactions.length === 0 ? (
            <p>Es liegen noch keine Transaktionen vor.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Datum</th>
                    <th>Person</th>
                    <th>Typ</th>
                    <th>Details / Produkte</th>
                    <th style={{ textAlign: 'right' }}>Betrag</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const txDate = new Date(tx.created_at).toLocaleString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    const isCharge = tx.type === 'aufladung';

                    return (
                      <tr key={tx.id}>
                        <td>{txDate}</td>
                        <td style={{ fontWeight: '500' }}>{tx.user_name}</td>
                        <td>
                          <span
                            style={{
                              color: isCharge ? 'var(--success)' : '#c3c3c3',
                              fontWeight: '600',
                            }}
                          >
                            {isCharge ? 'Aufladung' : 'Einkauf'}
                          </span>
                        </td>
                        <td>
                          {isCharge ? (
                            'Guthaben aufgeladen'
                          ) : (
                            <div style={styles.productsList}>
                              {tx.items && tx.items.map((item, idx) => (
                                <span key={idx} style={styles.productTag}>
                                  {item.quantity}x {item.productName} ({item.sizeInfo || 'Stk.'})
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td
                          style={{
                            textAlign: 'right',
                            fontWeight: '700',
                            color: isCharge ? 'var(--success)' : 'var(--danger)',
                          }}
                        >
                          {isCharge ? '+' : ''}
                          {tx.amount.toFixed(2).replace('.', ',')} €
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  header: {
    marginBottom: '2rem',
  },
  dashboardGrid: {
    alignItems: 'start',
  },
  card: {
    height: '100%',
  },
  cardTitle: {
    marginBottom: '1.5rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '0.75rem',
    fontSize: '1.25rem',
  },
  subTitle: {
    fontSize: '1.05rem',
    marginBottom: '1rem',
    color: '#fff',
  },
  balanceContainer: {
    background: 'linear-gradient(135deg, var(--primary) 0%, rgba(128, 24, 36, 0.5) 100%)',
    borderRadius: 'var(--radius-md)',
    padding: '2rem 1.5rem',
    textAlign: 'center',
    marginBottom: '1.5rem',
    boxShadow: 'inset 0 0 10px rgba(255, 255, 255, 0.1)',
  },
  balanceValue: {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: '#fff',
    letterSpacing: '-0.02em',
  },
  userNameLabel: {
    color: 'var(--accent)',
    fontWeight: '600',
    marginTop: '0.25rem',
    fontSize: '0.95rem',
    textTransform: 'uppercase',
  },
  infoText: {
    fontSize: '0.85rem',
    lineHeight: '1.4',
  },
  childrenList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  childItem: {
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.75rem 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  childName: {
    fontWeight: '600',
    color: '#fff',
  },
  childDetails: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '0.15rem',
    display: 'flex',
    gap: '0.4rem',
    alignItems: 'center',
    marginBottom: '0.4rem',
  },
  idBadge: {
    background: 'rgba(255, 255, 255, 0.08)',
    padding: '0.1rem 0.35rem',
    borderRadius: '4px',
    fontSize: '0.65rem',
    color: '#ccc',
    fontWeight: '600',
  },
  inlineEditBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--accent)',
    fontSize: '0.75rem',
    cursor: 'pointer',
    fontWeight: '600',
    padding: '0.2rem 0',
  },
  inlineLimitForm: {
    display: 'flex',
    gap: '0.4rem',
    marginTop: '0.5rem',
    alignItems: 'center',
  },
  inlineLimitInput: {
    padding: '0.35rem 0.6rem',
    fontSize: '0.85rem',
    width: '100px',
  },
  inlineLimitSubmit: {
    padding: '0.35rem 0.75rem',
    fontSize: '0.85rem',
  },
  inlineLimitCancel: {
    padding: '0.35rem 0.5rem',
    fontSize: '0.85rem',
    background: 'none',
    border: 'none',
  },
  limitStatusBox: {
    fontSize: '0.85rem',
    color: '#eee',
    lineHeight: '1.4',
    marginTop: '0.25rem',
  },
  divider: {
    height: '1px',
    background: 'rgba(255, 255, 255, 0.08)',
    margin: '1.5rem 0',
  },
  errorAlert: {
    background: 'rgba(239, 68, 68, 0.15)',
    color: '#fc8181',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    marginBottom: '1.5rem',
  },
  successAlert: {
    background: 'rgba(16, 185, 129, 0.15)',
    color: '#a7f3d0',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    marginBottom: '1.5rem',
  },
  productsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.35rem',
  },
  productTag: {
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '4px',
    padding: '0.15rem 0.4rem',
    fontSize: '0.8rem',
    color: 'var(--text-main)',
  },
};
