import React, { useState, useEffect } from 'react';

export default function UserDashboard({ token }) {
  const [users, setUsers] = useState([]); // Eigener Account + Kinder
  const [transactions, setTransactions] = useState([]);
  const [newChildName, setNewChildName] = useState('');
  const [newChildNfc, setNewChildNfc] = useState('');
  const [newChildFp, setNewChildFp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  // Daten laden
  const loadData = async () => {
    try {
      // 1. Benutzer laden (enthält self + Kinder)
      const usersRes = await fetch('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const usersData = await usersRes.json();
      if (!usersRes.ok) throw new Error(usersData.error || 'Fehler beim Laden der Benutzer');

      // 2. Transaktionen laden (enthält eigene + Kinder)
      const txRes = await fetch('http://localhost:5000/api/transactions', {
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
      const response = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newChildName,
          nfc_id: newChildNfc || null,
          fingerprint_id: newChildFp || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Fehler beim Anlegen des Kinder-Accounts');

      setSuccess(`Kinder-Account für ${data.name} erfolgreich angelegt.`);
      setNewChildName('');
      setNewChildNfc('');
      setNewChildFp('');
      loadData(); // Neu laden
    } catch (err) {
      setError(err.message);
    }
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
          {children.length === 0 ? (
            <p style={{ marginBottom: '1.5rem' }}>Keine Kinder-Accounts angelegt.</p>
          ) : (
            <div style={styles.childrenList}>
              {children.map((child) => (
                <div key={child.id} style={styles.childItem}>
                  <div>
                    <span style={styles.childName}>{child.name}</span>
                    <div style={styles.childDetails}>
                      {child.nfc_id && <span>NFC: Ja </span>}
                      {child.fingerprint_id && <span>Fingerprint: Ja </span>}
                    </div>
                  </div>
                  <span style={styles.childBalance}>
                    {child.balance.toFixed(2).replace('.', ',')} €
                  </span>
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
              <label className="form-label">NFC Chip-ID (Optional)</label>
              <input
                type="text"
                className="input-field"
                placeholder="ID einscannen oder eingeben"
                value={newChildNfc}
                onChange={(e) => setNewChildNfc(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Fingerprint-ID (Optional)</label>
              <input
                type="text"
                className="input-field"
                placeholder="Scanner-ID eintragen"
                value={newChildFp}
                onChange={(e) => setNewChildFp(e.target.value)}
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
  },
  childBalance: {
    fontWeight: '700',
    color: 'var(--accent)',
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
