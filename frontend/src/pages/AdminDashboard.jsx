import React, { useState, useEffect } from 'react';

export default function AdminDashboard({ token }) {
  const [users, setUsers] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [settlementData, setSettlementData] = useState({ drinks: [], food: [], total: 0 });
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingSettlement, setLoadingSettlement] = useState(false);

  // Aufladen-State
  const [chargeUser, setChargeUser] = useState(null);
  const [chargeAmount, setChargeAmount] = useState('');

  // Benutzer anlegen/bearbeiten State
  const [isEditing, setIsEditing] = useState(false);
  const [editUser, setEditUser] = useState({
    id: null,
    name: '',
    username: '',
    password: '',
    role: 'user',
    nfc_id: '',
    fingerprint_id: '',
    parent_id: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 1. Benutzer laden
  const loadUsers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler beim Laden der Benutzer');
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  // 2. Abrechnungsdaten laden (für die UI-Vorschau)
  const loadSettlement = async () => {
    setLoadingSettlement(true);
    try {
      // Wir holen alle Produkte und Transaktionen für das Datum und bauen die Tabelle in der UI nach
      const prodRes = await fetch('http://localhost:5000/api/products');
      const products = await prodRes.json();
      if (!prodRes.ok) throw new Error('Fehler beim Laden der Produkte');

      const txRes = await fetch('http://localhost:5000/api/transactions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const transactions = await txRes.json();
      if (!txRes.ok) throw new Error('Fehler beim Laden der Transaktionen');

      // Filtere Verkäufe für das ausgewählte Datum
      const dailySales = transactions.filter(
        (tx) =>
          tx.type === 'kauf' &&
          new Date(tx.created_at).toISOString().split('T')[0] === selectedDate
      );

      // Berechne verkaufte Mengen pro Produkt-ID
      const soldQtyMap = {};
      dailySales.forEach((tx) => {
        if (tx.items) {
          tx.items.forEach((item) => {
            const pid = products.find((p) => p.name === item.productName)?.id;
            if (pid) {
              soldQtyMap[pid] = (soldQtyMap[pid] || 0) + item.quantity;
            }
          });
        }
      });

      // Getränke & Speisen aggregieren
      const drinks = products
        .filter((p) => p.category === 'Getränk')
        .map((p) => {
          const sold = soldQtyMap[p.id] || 0;
          return { ...p, sold, total: sold * p.price };
        });

      const food = products
        .filter((p) => p.category === 'Speise')
        .map((p) => {
          const sold = soldQtyMap[p.id] || 0;
          return { ...p, sold, total: sold * p.price };
        });

      const totalDrinks = drinks.reduce((sum, item) => sum + item.total, 0);
      const totalFood = food.reduce((sum, item) => sum + item.total, 0);

      setSettlementData({
        drinks,
        food,
        totalDrinks,
        totalFood,
        total: totalDrinks + totalFood,
      });
    } catch (err) {
      console.error(err);
      setError('Abrechnungsvorschau konnte nicht geladen werden.');
    } finally {
      setLoadingSettlement(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [token]);

  useEffect(() => {
    loadSettlement();
  }, [selectedDate, token]);

  // CSV Export starten
  const handleExport = () => {
    window.open(
      `http://localhost:5000/api/export/settlement?date=${selectedDate}&authorization=Bearer ${token}`,
      '_blank'
    );
  };

  // Guthaben aufladen
  const handleChargeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!chargeAmount || isNaN(parseFloat(chargeAmount)) || parseFloat(chargeAmount) <= 0) {
      setError('Bitte geben Sie einen gültigen Betrag ein.');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/users/${chargeUser.id}/charge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: parseFloat(chargeAmount) }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler beim Aufladen');

      setSuccess(`Erfolgreich ${parseFloat(chargeAmount).toFixed(2)} € auf das Konto von ${chargeUser.name} geladen.`);
      setChargeUser(null);
      setChargeAmount('');
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  // Benutzer erstellen / bearbeiten
  const handleSaveUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const url = editUser.id
        ? `http://localhost:5000/api/users/${editUser.id}`
        : 'http://localhost:5000/api/users';

      const method = editUser.id ? 'PUT' : 'POST';

      const body = {
        name: editUser.name,
        username: editUser.username || null,
        role: editUser.role,
        nfc_id: editUser.nfc_id || null,
        fingerprint_id: editUser.fingerprint_id || null,
        parent_id: editUser.parent_id ? parseInt(editUser.parent_id, 10) : null,
      };

      if (editUser.password) {
        body.password = editUser.password;
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler beim Speichern');

      setSuccess(`Benutzer ${data.name} erfolgreich gespeichert.`);
      setIsEditing(false);
      setEditUser({
        id: null,
        name: '',
        username: '',
        password: '',
        role: 'user',
        nfc_id: '',
        fingerprint_id: '',
        parent_id: '',
      });
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (user) => {
    setEditUser({
      id: user.id,
      name: user.name,
      username: user.username || '',
      password: '',
      role: user.role,
      nfc_id: user.nfc_id || '',
      fingerprint_id: user.fingerprint_id || '',
      parent_id: user.parent_id || '',
    });
    setIsEditing(true);
  };

  // Gruppiere Kinder unter Eltern
  const parents = users.filter((u) => !u.parent_id);
  const children = users.filter((u) => u.parent_id);

  return (
    <div className="animated">
      <div style={styles.header}>
        <h1>Admin-Bereich</h1>
        <p>Tagesabrechnungen einsehen und Benutzerkonten verwalten.</p>
      </div>

      {error && <div style={styles.errorAlert}>{error}</div>}
      {success && <div style={styles.successAlert}>{success}</div>}

      <div style={styles.tabGrid}>
        {/* LINKS: ABRECHNUNGS-TABELLE & EXPORT */}
        <div className="card" style={{ ...styles.card, flex: 2 }}>
          <div style={styles.cardHeaderFlex}>
            <h2 style={styles.cardTitle}>Tagesabrechnung</h2>
            <div style={styles.dateSelectorArea}>
              <input
                type="date"
                className="input-field"
                style={{ width: 'auto' }}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              <button onClick={handleExport} className="btn btn-primary" style={styles.exportBtn}>
                📥 Exportieren (CSV)
              </button>
            </div>
          </div>

          {loadingSettlement ? (
            <p>Lade Abrechnungsdaten...</p>
          ) : (
            <div style={styles.settlementTableContainer}>
              <div style={styles.tableTitle}>Getränke</div>
              <div className="table-container" style={{ marginBottom: '1.5rem' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Getränk</th>
                      <th>Menge</th>
                      <th style={{ textAlign: 'right' }}>Preis</th>
                      <th style={{ textAlign: 'center' }}>Verkauft</th>
                      <th style={{ textAlign: 'right' }}>Einnahmen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlementData.drinks && settlementData.drinks.map((p) => (
                      <tr key={p.id}>
                        <td>{p.name}</td>
                        <td>{p.size_info || '-'}</td>
                        <td style={{ textAlign: 'right' }}>{p.price.toFixed(2).replace('.', ',')} €</td>
                        <td style={{ textAlign: 'center', fontWeight: p.sold > 0 ? '700' : 'normal' }}>{p.sold}</td>
                        <td style={{ textAlign: 'right' }}>{p.total.toFixed(2).replace('.', ',')} €</td>
                      </tr>
                    ))}
                    <tr style={styles.totalRow}>
                      <td colSpan={4}>Tageseinnahmen Getränke:</td>
                      <td style={{ textAlign: 'right' }}>
                        {settlementData.totalDrinks?.toFixed(2).replace('.', ',')} €
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={styles.tableTitle}>Speisen</div>
              <div className="table-container" style={{ marginBottom: '1.5rem' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Speise</th>
                      <th style={{ textAlign: 'right' }}>Preis</th>
                      <th style={{ textAlign: 'center' }}>Verkauft</th>
                      <th style={{ textAlign: 'right' }}>Einnahmen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlementData.food && settlementData.food.map((p) => (
                      <tr key={p.id}>
                        <td>{p.name}</td>
                        <td style={{ textAlign: 'right' }}>{p.price.toFixed(2).replace('.', ',')} €</td>
                        <td style={{ textAlign: 'center', fontWeight: p.sold > 0 ? '700' : 'normal' }}>{p.sold}</td>
                        <td style={{ textAlign: 'right' }}>{p.total.toFixed(2).replace('.', ',')} €</td>
                      </tr>
                    ))}
                    <tr style={styles.totalRow}>
                      <td colSpan={3}>Tageseinnahmen Essen:</td>
                      <td style={{ textAlign: 'right' }}>
                        {settlementData.totalFood?.toFixed(2).replace('.', ',')} €
                      </td>
                    </tr>
                    <tr style={{ ...styles.totalRow, ...styles.grandTotalRow }}>
                      <td colSpan={3}>Tageseinnahmen gesamt:</td>
                      <td style={{ textAlign: 'right' }}>
                        {settlementData.total?.toFixed(2).replace('.', ',')} €
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* RECHTS: BENUTZER-VERWALTUNG */}
        <div className="card" style={{ ...styles.card, flex: 1.5 }}>
          <div style={styles.cardHeaderFlex}>
            <h2 style={styles.cardTitle}>Benutzer & Guthaben</h2>
            <button
              onClick={() => {
                setEditUser({
                  id: null,
                  name: '',
                  username: '',
                  password: '',
                  role: 'user',
                  nfc_id: '',
                  fingerprint_id: '',
                  parent_id: '',
                });
                setIsEditing(true);
              }}
              className="btn btn-accent"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            >
              ➕ Neu
            </button>
          </div>

          {/* Auflade-Formular Overlay/Card */}
          {chargeUser && (
            <div style={styles.chargeOverlay}>
              <div className="card" style={styles.chargeCard}>
                <h3>Guthaben aufladen</h3>
                <p>Nutzer: <strong>{chargeUser.name}</strong></p>
                <form onSubmit={handleChargeSubmit}>
                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label className="form-label">Aufladebetrag (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input-field"
                      placeholder="z.B. 20,00"
                      value={chargeAmount}
                      onChange={(e) => setChargeAmount(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <div style={styles.overlayButtons}>
                    <button type="button" onClick={() => setChargeUser(null)} className="btn btn-secondary">
                      Abbrechen
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Aufladen
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Benutzer anlegen/bearbeiten Overlay */}
          {isEditing && (
            <div style={styles.chargeOverlay}>
              <div className="card" style={styles.chargeCard}>
                <h3>{editUser.id ? 'Benutzer bearbeiten' : 'Benutzer anlegen'}</h3>
                <form onSubmit={handleSaveUser} style={{ marginTop: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      className="input-field"
                      value={editUser.name}
                      onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Rolle</label>
                    <select
                      className="input-field"
                      value={editUser.role}
                      onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                    >
                      <option value="user">Spieler / Familie</option>
                      <option value="pos">Kassenterminal</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  {editUser.role !== 'pos' && (
                    <div className="form-group">
                      <label className="form-label">Eltern-Account (Für Kinder-Accounts)</label>
                      <select
                        className="input-field"
                        value={editUser.parent_id}
                        onChange={(e) => setEditUser({ ...editUser, parent_id: e.target.value })}
                      >
                        <option value="">-- Kein Eltern-Account (Hauptaccount) --</option>
                        {parents
                          .filter((p) => p.id !== editUser.id)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  {/* Login-Daten nur, wenn es kein Kind ist */}
                  {!editUser.parent_id && (
                    <>
                      <div className="form-group">
                        <label className="form-label">Benutzername (Login)</label>
                        <input
                          type="text"
                          className="input-field"
                          value={editUser.username}
                          onChange={(e) => setEditUser({ ...editUser, username: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">
                          Passwort {editUser.id ? '(Leer lassen für keine Änderung)' : ''}
                        </label>
                        <input
                          type="password"
                          className="input-field"
                          value={editUser.password}
                          onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                          required={!editUser.id}
                        />
                      </div>
                    </>
                  )}

                  <div className="form-group">
                    <label className="form-label">NFC-ID</label>
                    <input
                      type="text"
                      className="input-field"
                      value={editUser.nfc_id}
                      onChange={(e) => setEditUser({ ...editUser, nfc_id: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Fingerprint-ID</label>
                    <input
                      type="text"
                      className="input-field"
                      value={editUser.fingerprint_id}
                      onChange={(e) => setEditUser({ ...editUser, fingerprint_id: e.target.value })}
                    />
                  </div>

                  <div style={styles.overlayButtons}>
                    <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary">
                      Abbrechen
                    </button>
                    <button type="submit" className="btn btn-accent">
                      Speichern
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {loadingUsers ? (
            <p>Lade Benutzerliste...</p>
          ) : (
            <div style={styles.userListScroll}>
              {parents.map((parent) => {
                const myChildren = children.filter((c) => c.parent_id === parent.id);

                return (
                  <div key={parent.id} style={styles.userGroup}>
                    {/* Eltern-Zeile */}
                    <div style={styles.parentRow}>
                      <div style={styles.userInfoCol}>
                        <span style={styles.mainUserName}>{parent.name}</span>
                        <div style={styles.subInfoLabel}>
                          {parent.username && <span>@{parent.username} </span>}
                          {parent.role === 'admin' && <span className="badge badge-admin">Admin</span>}
                          {parent.role === 'pos' && <span className="badge badge-pos">Kasse</span>}
                          {parent.nfc_id && <span style={styles.idBadge}>NFC</span>}
                          {parent.fingerprint_id && <span style={styles.idBadge}>FP</span>}
                        </div>
                      </div>
                      <div style={styles.actionCol}>
                        <span style={styles.userBalance}>
                          {parent.balance.toFixed(2).replace('.', ',')} €
                        </span>
                        <button
                          onClick={() => {
                            setChargeUser(parent);
                            setChargeAmount('');
                          }}
                          className="btn btn-accent"
                          style={styles.actionIconBtn}
                          title="Guthaben aufladen"
                        >
                          💶
                        </button>
                        <button
                          onClick={() => startEdit(parent)}
                          className="btn btn-secondary"
                          style={styles.actionIconBtn}
                          title="Bearbeiten"
                        >
                          ⚙️
                        </button>
                      </div>
                    </div>

                    {/* Kinder-Zeilen (falls vorhanden) */}
                    {myChildren.length > 0 && (
                      <div style={styles.childrenContainer}>
                        {myChildren.map((child) => (
                          <div key={child.id} style={styles.childRow}>
                            <div style={styles.userInfoCol}>
                              <span style={styles.childUserName}>↳ {child.name}</span>
                              <div style={styles.subInfoLabel} style={{ marginLeft: '1rem', fontSize: '0.75rem' }}>
                                <span>Verknüpft mit {parent.name}</span>
                                {child.nfc_id && <span style={styles.idBadge}>NFC</span>}
                                {child.fingerprint_id && <span style={styles.idBadge}>FP</span>}
                              </div>
                            </div>
                            <div style={styles.actionCol}>
                              <span style={styles.childUserBalance}>
                                {child.balance.toFixed(2).replace('.', ',')} €
                              </span>
                              <button
                                onClick={() => {
                                  setChargeUser(child);
                                  setChargeAmount('');
                                }}
                                className="btn btn-accent"
                                style={styles.actionIconBtn}
                                title="Guthaben aufladen"
                              >
                                💶
                              </button>
                              <button
                                onClick={() => startEdit(child)}
                                className="btn btn-secondary"
                                style={styles.actionIconBtn}
                                title="Bearbeiten"
                              >
                                ⚙️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
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
  tabGrid: {
    display: 'flex',
    gap: '2rem',
    alignItems: 'start',
    flexWrap: 'wrap',
  },
  card: {
    minWidth: '320px',
  },
  cardHeaderFlex: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '0.75rem',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  cardTitle: {
    marginBottom: 0,
    fontSize: '1.25rem',
  },
  dateSelectorArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  exportBtn: {
    padding: '0.6rem 1rem',
    fontSize: '0.85rem',
  },
  settlementTableContainer: {
    maxHeight: '70vh',
    overflowY: 'auto',
  },
  tableTitle: {
    fontSize: '1.05rem',
    fontWeight: '700',
    marginBottom: '0.75rem',
    color: 'var(--accent)',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  totalRow: {
    background: 'rgba(255, 255, 255, 0.04)',
    fontWeight: '700',
    color: '#fff',
  },
  grandTotalRow: {
    background: 'rgba(212, 175, 55, 0.15)',
    color: 'var(--accent)',
    fontSize: '1.05rem',
  },
  userListScroll: {
    maxHeight: '75vh',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    paddingRight: '0.25rem',
  },
  userGroup: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.25rem 0',
  },
  parentRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 1rem',
  },
  childrenContainer: {
    borderTop: '1px dashed var(--border)',
    background: 'rgba(0, 0, 0, 0.15)',
  },
  childRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 1rem 0.5rem 2rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.02)',
  },
  childRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 1rem 0.5rem 2rem',
  },
  userInfoCol: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
  },
  mainUserName: {
    fontWeight: '600',
    color: '#fff',
  },
  childUserName: {
    fontWeight: '500',
    color: 'var(--text-main)',
    fontSize: '0.9rem',
  },
  subInfoLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    marginTop: '0.15rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  idBadge: {
    background: 'rgba(255, 255, 255, 0.08)',
    padding: '0.05rem 0.3rem',
    borderRadius: '4px',
    fontSize: '0.65rem',
    color: '#ccc',
  },
  actionCol: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  userBalance: {
    fontWeight: '700',
    color: '#fff',
    minWidth: '70px',
    textAlign: 'right',
  },
  childUserBalance: {
    fontWeight: '600',
    color: 'var(--text-muted)',
    minWidth: '70px',
    textAlign: 'right',
    fontSize: '0.9rem',
  },
  actionIconBtn: {
    padding: '0.35rem 0.6rem',
    fontSize: '0.9rem',
    borderRadius: '6px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--border)',
  },
  chargeOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
    padding: '1rem',
  },
  chargeCard: {
    width: '100%',
    maxWidth: '450px',
    background: '#16181e',
    boxShadow: 'var(--shadow-lg)',
  },
  overlayButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    marginTop: '1.5rem',
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
};
