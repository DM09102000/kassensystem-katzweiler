import React, { useState, useEffect } from 'react';
import ImageCropper from '../components/ImageCropper';

export default function AdminDashboard({ token }) {
  const [users, setUsers] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [settlementData, setSettlementData] = useState({ drinks: [], food: [], total: 0 });
  const [transactions, setTransactions] = useState([]);
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
    email: '',
    password: '',
    role: 'user',
    nfc_id: '',
    fingerprint_id: '',
    parent_id: '',
    daily_limit: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [generalToken, setGeneralToken] = useState('');

  // Produkte verwalten States
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'products'
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [productCropperSrc, setProductCropperSrc] = useState(null);

  // Suche, Filter, Sortierung States
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [filterType, setFilterType] = useState('all');

  // 1. Benutzer laden
  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users', {
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
      const prodRes = await fetch('/api/products');
      const products = await prodRes.json();
      if (!prodRes.ok) throw new Error('Fehler beim Laden der Produkte');

      const txRes = await fetch('/api/transactions', {
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
      setTransactions(transactions);
    } catch (err) {
      console.error(err);
      setError('Abrechnungsvorschau konnte nicht geladen werden.');
    } finally {
      setLoadingSettlement(false);
    }
  };

  useEffect(() => {
    loadUsers();
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/config');
        const data = await res.json();
        setGeneralToken(data.generalInviteToken);
      } catch (err) {
        console.error('Fehler beim Laden des Konfigurations-Tokens:', err);
      }
    };
    loadConfig();
  }, [token]);

  useEffect(() => {
    loadSettlement();
  }, [selectedDate, token]);

  useEffect(() => {
    if (activeTab === 'products') {
      loadProducts();
    }
  }, [activeTab, token]);

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch('/api/products?all=true', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProducts(data);
    } catch (err) {
      setError(err.message || 'Fehler beim Laden der Produkte');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleProductImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setProductCropperSrc(reader.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleProductCropConfirm = (croppedBase64) => {
    setEditProduct(prev => ({ ...prev, image_url: croppedBase64 }));
    setProductCropperSrc(null);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const url = editProduct.id ? `/api/products/${editProduct.id}` : '/api/products';
      const method = editProduct.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editProduct)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler beim Speichern des Produkts');

      setSuccess(`Produkt "${data.name}" erfolgreich gespeichert.`);
      setIsEditingProduct(false);
      setEditProduct(null);
      loadProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  // CSV Export starten
  const handleExport = () => {
    window.open(
      `/api/export/settlement?date=${selectedDate}&authorization=Bearer ${token}`,
      '_blank'
    );
  };

  // Buchung stornieren (Kauf oder Aufladung)
  const handleDeleteTransaction = async (txId) => {
    if (!window.confirm('Möchten Sie diese Buchung wirklich unwiderruflich stornieren? Das Guthaben des Benutzers wird zurückberechnet.')) {
      return;
    }

    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/transactions/${txId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler beim Stornieren');

      setSuccess('Buchung erfolgreich storniert!');
      loadUsers();
      loadSettlement();
    } catch (err) {
      setError(err.message);
    }
  };

  // Einladungslink generieren
  const handleGenerateInvite = async (user) => {
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/users/${user.id}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler beim Generieren des Einladungslinks');

      setGeneratedLink(data.inviteLink);
    } catch (err) {
      setError(err.message);
    }
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
      const res = await fetch(`/api/users/${chargeUser.id}/charge`, {
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
        ? `/api/users/${editUser.id}`
        : '/api/users';

      const method = editUser.id ? 'PUT' : 'POST';

      const body = {
        name: editUser.name,
        username: editUser.username || null,
        email: editUser.email || null,
        role: editUser.role,
        nfc_id: editUser.nfc_id || null,
        fingerprint_id: editUser.fingerprint_id || null,
        parent_id: editUser.parent_id ? parseInt(editUser.parent_id, 10) : null,
        daily_limit: editUser.daily_limit === '' || editUser.daily_limit === null ? null : parseFloat(editUser.daily_limit),
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
        email: '',
        password: '',
        role: 'user',
        nfc_id: '',
        fingerprint_id: '',
        parent_id: '',
        daily_limit: '',
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
      email: user.email || '',
      password: '',
      role: user.role,
      nfc_id: user.nfc_id || '',
      fingerprint_id: user.fingerprint_id || '',
      parent_id: user.parent_id || '',
      daily_limit: user.daily_limit !== null ? user.daily_limit.toString() : '',
    });
    setIsEditing(true);
  };

  // Gruppiere Spieler (Eltern + Kinder) und filtere Kassenpersonal/Admins
  const playerParents = users.filter((u) => !u.parent_id && u.role === 'user');
  const playerChildren = users.filter((u) => u.parent_id && u.role === 'user');
  const staffUsers = users.filter((u) => u.role === 'admin' || u.role === 'pos');
  const parents = playerParents;

  // Suchen, Filtern und Sortieren der Spielerliste
  const getFilteredPlayers = () => {
    let filtered = playerParents.filter((parent) => {
      const myChildren = playerChildren.filter((c) => c.parent_id === parent.id);
      const term = searchTerm.toLowerCase().trim();
      if (!term) return true;

      // Prüfe Elternteil
      const parentMatches =
        parent.name.toLowerCase().includes(term) ||
        (parent.username && parent.username.toLowerCase().includes(term)) ||
        (parent.nfc_id && parent.nfc_id.toLowerCase().includes(term)) ||
        (parent.fingerprint_id && parent.fingerprint_id.toLowerCase().includes(term));

      if (parentMatches) return true;

      // Prüfe Kinder
      const childMatches = myChildren.some(
        (child) =>
          child.name.toLowerCase().includes(term) ||
          (child.nfc_id && child.nfc_id.toLowerCase().includes(term)) ||
          (child.fingerprint_id && child.fingerprint_id.toLowerCase().includes(term))
      );

      return childMatches;
    });

    // Filter-Typ anwenden
    if (filterType === 'no-hardware') {
      filtered = filtered.filter((parent) => {
        const myChildren = playerChildren.filter((c) => c.parent_id === parent.id);
        const parentNoHardware = !parent.nfc_id && !parent.fingerprint_id;
        const anyChildNoHardware = myChildren.some(c => !c.nfc_id && !c.fingerprint_id);
        return parentNoHardware || anyChildNoHardware;
      });
    } else if (filterType === 'negative-balance') {
      filtered = filtered.filter((parent) => parent.balance < 0);
    }

    // Sortierung anwenden
    filtered.sort((a, b) => {
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'name-desc') {
        return b.name.localeCompare(a.name);
      } else if (sortBy === 'balance-desc') {
        return b.balance - a.balance;
      } else if (sortBy === 'balance-asc') {
        return a.balance - b.balance;
      } else if (sortBy === 'date-desc') {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      return 0;
    });

    return filtered;
  };

  const getFilteredStaff = () => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return staffUsers;
    return staffUsers.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        (s.username && s.username.toLowerCase().includes(term))
    );
  };

  return (
    <div className="animated">
      {/* Image Cropper Modal (Produktbild) */}
      {productCropperSrc && (
        <ImageCropper
          imageSrc={productCropperSrc}
          onConfirm={handleProductCropConfirm}
          onCancel={() => setProductCropperSrc(null)}
          aspectRatio={3}
          circular={false}
        />
      )}

      <div style={styles.header}>
        <h1>Admin-Bereich</h1>
        <p>Tagesabrechnungen einsehen und Benutzerkonten verwalten.</p>
      </div>

      {error && <div style={styles.errorAlert}>{error}</div>}
      {success && <div style={styles.successAlert}>{success}</div>}

      {/* Tab Buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}
        >
          📊 Dashboard (Abrechnung & Benutzer)
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`btn ${activeTab === 'products' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}
        >
          📦 Waren verwalten (Produkte)
        </button>
      </div>

      {activeTab === 'dashboard' ? (
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

              {/* TRANSAKTIONS-HISTORIE UND STORNIERUNG */}
              <div style={{ ...styles.tableTitle, marginTop: '2.5rem' }}>Buchungs-Historie (Stornierbar)</div>
              {transactions.filter(tx => new Date(tx.created_at).toISOString().split('T')[0] === selectedDate).length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '1rem 0' }}>Keine Buchungen an diesem Tag.</p>
              ) : (
                <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Zeit</th>
                        <th>Nutzer</th>
                        <th>Typ</th>
                        <th>Details</th>
                        <th style={{ textAlign: 'right' }}>Betrag</th>
                        <th style={{ textAlign: 'center' }}>Aktion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions
                        .filter(tx => new Date(tx.created_at).toISOString().split('T')[0] === selectedDate)
                        .map((tx) => {
                          const isKauf = tx.type === 'kauf';
                          const timeStr = new Date(tx.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
                          
                          let details = 'Direktaufladung';
                          if (isKauf && tx.items) {
                            details = tx.items.map(item => `${item.productName} (x${item.quantity})`).join(', ');
                          }

                          return (
                            <tr key={tx.id}>
                              <td>{timeStr} Uhr</td>
                              <td>{tx.user_name}</td>
                              <td>
                                <span className={isKauf ? 'badge badge-user' : 'badge badge-pos'} style={{ fontSize: '0.7rem' }}>
                                  {isKauf ? 'Kauf' : 'Aufladung'}
                                </span>
                              </td>
                              <td style={{ fontSize: '0.8rem', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={details}>
                                {details}
                              </td>
                              <td
                                style={{
                                  textAlign: 'right',
                                  fontWeight: '700',
                                  color: isKauf ? 'var(--danger)' : 'var(--success)',
                                }}
                              >
                                {isKauf ? '' : '+'}
                                {tx.amount.toFixed(2).replace('.', ',')} €
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <button
                                  onClick={() => handleDeleteTransaction(tx.id)}
                                  style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' }}
                                  className="btn btn-secondary"
                                  title="Buchung stornieren"
                                >
                                  🗑️ Storno
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
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
                  daily_limit: '',
                });
                setIsEditing(true);
              }}
              className="btn btn-accent"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            >
              ➕ Neu
            </button>
          </div>

          {/* SEARCH, FILTER & SORT CONTROLS */}
          <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', marginBottom: '1.25rem', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: '600' }}>Suchen</label>
              <input
                type="text"
                placeholder="Name, NFC, FP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field"
                style={{ fontSize: '0.85rem', padding: '0.35rem 0.6rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: '600' }}>Filter</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="input-field"
                style={{ fontSize: '0.85rem', padding: '0.35rem 0.6rem' }}
              >
                <option value="all">Alle Spieler</option>
                <option value="negative-balance">Kontostand &lt; 0 €</option>
                <option value="no-hardware">Hardware fehlt</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: '600' }}>Sortieren</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-field"
                style={{ fontSize: '0.85rem', padding: '0.35rem 0.6rem' }}
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="balance-desc">Guthaben (hoch-tief)</option>
                <option value="balance-asc">Guthaben (tief-hoch)</option>
                <option value="date-desc">Neu registriert</option>
              </select>
            </div>
          </div>

          {/* GENERAL INVITE LINK INFO BOX */}
          <div style={{ padding: '0.6rem 0.8rem', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.8rem', textAlign: 'left' }}>
            <span style={{ fontWeight: '700', color: '#60a5fa', display: 'block', marginBottom: '0.2rem' }}>📢 Allgemeiner Registrierungs-Link (QR-Code):</span>
            <code style={{ background: 'rgba(0,0,0,0.2)', padding: '0.2rem 0.4rem', borderRadius: '4px', display: 'inline-block', color: 'var(--accent)', wordBreak: 'break-all', cursor: 'pointer' }} onClick={(e) => {
              navigator.clipboard.writeText(`${window.location.origin}/register?token=${generalToken || 'FK-KANTINE-2026-INVITE'}`);
              alert('Allgemeiner Registrierungs-Link in Zwischenablage kopiert!');
            }}>
              {window.location.origin}/register?token={generalToken || 'FK-KANTINE-2026-INVITE'}
            </code>
            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Anklicken zum Kopieren. Diesen Link als QR-Code ausdrucken.</span>
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

                  {editUser.role === 'user' && (
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
                        <label className="form-label">E-Mail-Adresse (Für Einladungen)</label>
                        <input
                          type="email"
                          className="input-field"
                          value={editUser.email}
                          onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                          placeholder="z.B. name@beispiel.de"
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

                  {editUser.parent_id && (
                    <div className="form-group">
                      <label className="form-label">Tageslimit in € (Optional)</label>
                      <input
                        type="number"
                        step="0.50"
                        min="0"
                        className="input-field"
                        placeholder="z.B. 5,00 (leer für unbegrenzt)"
                        value={editUser.daily_limit}
                        onChange={(e) => setEditUser({ ...editUser, daily_limit: e.target.value })}
                      />
                    </div>
                  )}

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

          {/* Einladungslink Overlay */}
          {generatedLink && (
            <div style={styles.chargeOverlay}>
              <div className="card" style={{ ...styles.chargeCard, maxWidth: '400px' }}>
                <h3>Einladungslink generiert</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.5rem 0 1rem 0' }}>
                  Kopiere diesen Link und sende ihn dem Mitglied, um die Registrierung abzuschließen.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <input
                    type="text"
                    readOnly
                    value={generatedLink}
                    className="input-field"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                    onClick={(e) => e.target.select()}
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedLink);
                      alert('Link in Zwischenablage kopiert!');
                    }}
                    className="btn btn-accent"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                  >
                    📋 Kopieren
                  </button>
                </div>
                <button
                  onClick={() => setGeneratedLink('')}
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                >
                  Schließen
                </button>
              </div>
            </div>
          )}

          {loadingUsers ? (
            <p>Lade Benutzerliste...</p>
          ) : (
            <div style={styles.userListScroll}>
              {/* Sektion 1: Spieler & Familien */}
              <div style={{ ...styles.tableTitle, fontSize: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.4rem', marginBottom: '0.8rem' }}>
                Spieler & Familien
              </div>
              {getFilteredPlayers().map((parent) => {
                const myChildren = playerChildren.filter((c) => c.parent_id === parent.id);

                return (
                  <div key={parent.id} style={styles.userGroup}>
                    {/* Eltern-Zeile */}
                    <div style={styles.parentRow}>
                      <div style={styles.userInfoCol}>
                        <span style={styles.mainUserName}>{parent.name}</span>
                        <div style={styles.subInfoLabel}>
                          {parent.username && <span>@{parent.username} </span>}
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
                        {!parent.username && (
                          <button
                            onClick={() => handleGenerateInvite(parent)}
                            className="btn btn-secondary"
                            style={{ ...styles.actionIconBtn, background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)' }}
                            title="Einladungslink erstellen"
                          >
                            ✉️
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Kinder-Zeilen (falls vorhanden) */}
                    {myChildren.length > 0 && (
                      <div style={styles.childrenContainer}>
                        {myChildren.map((child) => (
                          <div key={child.id} style={styles.childRow}>
                            <div style={styles.userInfoCol}>
                              <span style={styles.childUserName}>↳ {child.name}</span>
                              <div style={{ ...styles.subInfoLabel, marginLeft: '1rem', fontSize: '0.75rem' }}>
                                <span>Limit: {child.daily_limit !== null ? `${child.daily_limit.toFixed(2).replace('.', ',')} €` : 'Unbegrenzt'} (Heute: {child.spent_today.toFixed(2).replace('.', ',')} €)</span>
                                {child.nfc_id && <span style={styles.idBadge}>NFC</span>}
                                {child.fingerprint_id && <span style={styles.idBadge}>FP</span>}
                              </div>
                            </div>
                            <div style={styles.actionCol}>
                              <span style={styles.childUserBalance}>
                                {parent.balance.toFixed(2).replace('.', ',')} €
                              </span>
                              <button
                                onClick={() => {
                                  setChargeUser(child);
                                  setChargeAmount('');
                                }}
                                className="btn btn-accent"
                                style={styles.actionIconBtn}
                                title="Eltern-Guthaben aufladen"
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

              {/* Sektion 2: Personal & Kassen-Accounts */}
              <div style={{ ...styles.tableTitle, fontSize: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.4rem', marginTop: '2rem', marginBottom: '0.8rem' }}>
                Personal & Kassen-Accounts
              </div>
              {getFilteredStaff().length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Kein Personal angelegt.</p>
              ) : (
                getFilteredStaff().map((staff) => (
                  <div key={staff.id} style={{ ...styles.parentRow, padding: '0.6rem 0.8rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', marginBottom: '0.5rem' }}>
                    <div style={styles.userInfoCol}>
                      <span style={styles.mainUserName}>{staff.name}</span>
                      <div style={styles.subInfoLabel}>
                        {staff.username && <span>@{staff.username} </span>}
                        {staff.role === 'admin' && <span className="badge badge-admin">Admin</span>}
                        {staff.role === 'pos' && <span className="badge badge-pos">Kasse</span>}
                      </div>
                    </div>
                    <div style={styles.actionCol}>
                      <button
                        onClick={() => startEdit(staff)}
                        className="btn btn-secondary"
                        style={styles.actionIconBtn}
                        title="Bearbeiten"
                      >
                        ⚙️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        </div>
      ) : (
        <div className="card" style={{ ...styles.card, padding: '2rem' }}>
          <div style={styles.cardHeaderFlex}>
            <h2 style={styles.cardTitle}>Warenverwaltung (Produkte)</h2>
            <button
              onClick={() => {
                setEditProduct({
                  id: null,
                  name: '',
                  size_info: '',
                  price: '',
                  category: 'Getränk',
                  active: true,
                  image_url: ''
                });
                setIsEditingProduct(true);
              }}
              className="btn btn-accent"
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              ➕ Neues Produkt
            </button>
          </div>

          {loadingProducts ? (
            <p>Lade Produkte...</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
              {products.map((product) => (
                <div key={product.id} className="card" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative', opacity: product.active ? 1 : 0.6 }}>
                  {/* Product Image */}
                  <div style={{ width: '100%', height: '150px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '3rem', opacity: 0.3 }}>
                        {product.category === 'Getränk' ? '🍹' : '🍔'}
                      </span>
                    )}
                  </div>
                  
                  {/* Product Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <span style={{ fontWeight: '700', fontSize: '1.1rem', color: '#fff' }}>{product.name}</span>
                      <span style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)', fontSize: '0.75rem', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                        {product.category}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{product.size_info || 'Keine Angabe'}</span>
                    <span style={{ fontWeight: '800', color: 'var(--accent)', fontSize: '1.15rem', marginTop: '0.25rem' }}>
                      {product.price.toFixed(2).replace('.', ',')} €
                    </span>
                  </div>

                  {/* Badges and Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: product.active ? '#4ade80' : '#f87171', fontSize: '0.8rem', fontWeight: '700' }}>
                      {product.active ? '● Aktiv' : '● Inaktiv'}
                    </span>
                    <button
                      onClick={() => {
                        setEditProduct({ ...product });
                        setIsEditingProduct(true);
                      }}
                      className="btn btn-secondary"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                    >
                      ⚙️ Bearbeiten
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Produkt anlegen/bearbeiten Overlay */}
      {isEditingProduct && editProduct && (
        <div style={styles.chargeOverlay}>
          <div className="card" style={{ ...styles.chargeCard, maxWidth: '450px' }}>
            <h3>{editProduct.id ? 'Produkt bearbeiten' : 'Produkt erstellen'}</h3>
            <form onSubmit={handleSaveProduct} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={editProduct.name}
                  onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Kategorie</label>
                  <select
                    className="input-field"
                    value={editProduct.category}
                    onChange={(e) => setEditProduct({ ...editProduct, category: e.target.value })}
                  >
                    <option value="Getränk">Getränk</option>
                    <option value="Speise">Speise</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Größe/Einheit (z.B. 0,5L)</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editProduct.size_info || ''}
                    onChange={(e) => setEditProduct({ ...editProduct, size_info: e.target.value })}
                    placeholder="z.B. 0,5L, Portion"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Preis in €</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input-field"
                    value={editProduct.price}
                    onChange={(e) => setEditProduct({ ...editProduct, price: parseFloat(e.target.value) || '' })}
                    required
                    placeholder="z.B. 2,50"
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '1.25rem' }}>
                    <input
                      type="checkbox"
                      checked={editProduct.active}
                      onChange={(e) => setEditProduct({ ...editProduct, active: e.target.checked })}
                      style={{ width: '1.2rem', height: '1.2rem' }}
                    />
                    <span>Aktiv zum Verkauf</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Produktbild (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProductImageChange}
                  className="input-field"
                  style={{ fontSize: '0.8rem', padding: '0.4rem' }}
                />
                {editProduct.image_url && (
                  <div style={{ marginTop: '0.75rem', width: '100%', height: '120px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={editProduct.image_url} alt="Vorschau" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
              </div>

              <div style={styles.overlayButtons}>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingProduct(false);
                    setEditProduct(null);
                  }}
                  className="btn btn-secondary"
                >
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
