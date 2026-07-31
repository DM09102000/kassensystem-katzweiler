import React, { useState, useEffect } from 'react';

export default function PosKiosk({ token }) {
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Kassen-Modus: 'sale' (Verkauf) oder 'charge' (Aufladen)
  const [kioskMode, setKioskMode] = useState('sale');

  // Warenkorb
  const [cart, setCart] = useState([]);

  // Identifizierter Benutzer für den Kauf/Aufladung
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Aufladebetrag
  const [chargeAmount, setChargeAmount] = useState('');

  // Status-Meldungen
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  // Produktkategorie Filter für Kacheln
  const [activeCategory, setActiveCategory] = useState('Alle');

  const loadInitialData = async () => {
    try {
      // 1. Produkte laden
      const prodRes = await fetch('http://localhost:5000/api/products');
      const prodData = await prodRes.json();
      if (!prodRes.ok) throw new Error('Fehler beim Laden der Produkte');
      setProducts(prodData);

      // 2. Benutzer laden für die Suche
      const usersRes = await fetch('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const usersData = await usersRes.json();
      if (!usersRes.ok) throw new Error('Fehler beim Laden der Benutzer');
      setUsers(usersData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [token]);

  // Namenssuche
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(
        (u) =>
          u.name.toLowerCase().includes(query) ||
          (u.username && u.username.toLowerCase().includes(query))
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, users]);

  // Warenkorb Aktionen
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing && existing.quantity > 1) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prevCart.filter((item) => item.product.id !== product.id);
    });
  };

  const clearCart = () => setCart([]);

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  // Hardware Simulationen
  const simulateNfcScan = (nfcId) => {
    setError('');
    setSuccess('');
    const user = users.find((u) => u.nfc_id === nfcId);
    if (user) {
      setSelectedUser(user);
      setSuccess(`NFC-Tag gescannt: ${user.name} identifiziert!`);
    } else {
      setError(`NFC-Tag ID "${nfcId}" ist keinem Benutzer zugeordnet.`);
    }
  };

  const simulateFingerprintScan = (fpId) => {
    setError('');
    setSuccess('');
    const user = users.find((u) => u.fingerprint_id === fpId);
    if (user) {
      setSelectedUser(user);
      setSuccess(`Fingerabdruck gescannt: ${user.name} identifiziert!`);
    } else {
      setError(`Fingerabdruck-ID "${fpId}" ist keinem Benutzer zugeordnet.`);
    }
  };

  // Checkout buchen
  const handleCheckout = async () => {
    setError('');
    setSuccess('');

    if (!selectedUser) {
      setError('Bitte wählen Sie zuerst einen Benutzer aus.');
      return;
    }

    if (cart.length === 0) {
      setError('Der Warenkorb ist leer.');
      return;
    }

    const items = cart.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
    }));

    try {
      const response = await fetch('http://localhost:5000/api/transactions/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: selectedUser.id, items }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Fehler beim Kaufvorgang');

      setSuccess(`Kauf erfolgreich gebucht für ${selectedUser.name}! Neues Guthaben: ${data.newBalance.toFixed(2).replace('.', ',')} €`);
      clearCart();
      setSelectedUser(null);
      setSearchQuery('');
      loadInitialData(); // Kontostände aktualisieren
    } catch (err) {
      setError(err.message);
    }
  };

  // Guthaben aufladen
  const handleRecharge = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedUser) {
      setError('Bitte wählen Sie zuerst einen Benutzer aus.');
      return;
    }

    const amount = parseFloat(chargeAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Geben Sie einen gültigen Betrag ein.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/users/${selectedUser.id}/charge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Fehler beim Aufladen');

      setSuccess(`Erfolgreich ${amount.toFixed(2).replace('.', ',')} € auf das Konto von ${selectedUser.name} geladen.`);
      setChargeAmount('');
      setSelectedUser(null);
      setSearchQuery('');
      loadInitialData(); // Kontostände aktualisieren
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Lade Kassen-Terminal...</div>;
  }

  // Kategorien für Kachel-Filter
  const categories = ['Alle', 'Getränk', 'Speise'];
  const filteredProducts = activeCategory === 'Alle' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  return (
    <div className="animated" style={styles.kioskContainer}>
      {/* OBERE NAVI FÜR MODUS */}
      <div style={styles.kioskHeader}>
        <div style={styles.titleArea}>
          <h1>Kassen-Terminal</h1>
          <p>Kassensystem der Spielerkantine</p>
        </div>
        <div style={styles.modeToggleArea}>
          <button
            onClick={() => {
              setKioskMode('sale');
              setError('');
              setSuccess('');
              setSelectedUser(null);
            }}
            className={`btn ${kioskMode === 'sale' ? 'btn-primary' : 'btn-secondary'}`}
          >
            🛒 Verkauf buchen
          </button>
          <button
            onClick={() => {
              setKioskMode('charge');
              setError('');
              setSuccess('');
              setSelectedUser(null);
            }}
            className={`btn ${kioskMode === 'charge' ? 'btn-primary' : 'btn-secondary'}`}
          >
            💶 Guthaben aufladen
          </button>
        </div>
      </div>

      {error && <div style={styles.errorAlert}>{error}</div>}
      {success && <div style={styles.successAlert}>{success}</div>}

      <div style={styles.mainLayout}>
        
        {/* LINKE SPALTE: PRODUKT-GRID (NUR BEI VERKAUFSMODUS) */}
        {kioskMode === 'sale' ? (
          <div style={styles.productPanel}>
            <div style={styles.categoryBar}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    ...styles.categoryBtn,
                    ...(activeCategory === cat ? styles.categoryBtnActive : {}),
                  }}
                >
                  {cat === 'Alle' ? 'Alle Artikel' : cat === 'Getränk' ? '🍹 Getränke' : '🌭 Speisen'}
                </button>
              ))}
            </div>

            <div style={styles.productGrid}>
              {filteredProducts.map((prod) => (
                <button
                  key={prod.id}
                  onClick={() => addToCart(prod)}
                  style={styles.productTile}
                >
                  <div style={styles.tileCategoryBadge}>
                    {prod.category === 'Getränk' ? '🍹' : '🌭'}
                  </div>
                  <div style={styles.tileName}>{prod.name}</div>
                  <div style={styles.tileSize}>{prod.size_info || 'Portion'}</div>
                  <div style={styles.tilePrice}>{prod.price.toFixed(2).replace('.', ',')} €</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* BEI AUFLADE-MODUS: GROSSE INFO */
          <div className="card" style={styles.rechargeIntroPanel}>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <span style={{ fontSize: '4rem' }}>💶</span>
              <h2>Guthaben aufladen</h2>
              <p style={{ maxWidth: '500px', margin: '1rem auto' }}>
                Wähle rechts den Benutzer aus (über Suche, NFC-Simulation oder Fingerabdruck), trage den Bar gezahlten Betrag ein und klicke auf "Guthaben aufladen".
              </p>
            </div>
          </div>
        )}

        {/* RECHTE SPALTE: KUNDENAUSWAHL & WARENKORB */}
        <div style={styles.sidebarPanel}>
          
          {/* SEKTION 1: USER AUSWAHL / SCANNER */}
          <div className="card" style={styles.sidebarCard}>
            <h2 style={styles.cardHeaderTitle}>👤 Spieler identifizieren</h2>
            
            {selectedUser ? (
              <div style={styles.identifiedUserBox}>
                <div style={styles.userAvatar}>
                  {selectedUser.name.charAt(0)}
                </div>
                <div style={styles.userIdentDetails}>
                  <div style={styles.selectedName}>{selectedUser.name}</div>
                  <div style={styles.selectedBalanceLabel}>
                    Aktuelles Guthaben: <strong style={{ color: 'var(--accent)' }}>
                      {selectedUser.balance.toFixed(2).replace('.', ',')} €
                    </strong>
                  </div>
                  {selectedUser.parent_name && (
                    <div style={styles.parentLinkText}>
                      Familie: {selectedUser.parent_name}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setSearchQuery('');
                  }}
                  style={styles.removeUserBtn}
                  title="Auswahl aufheben"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div>
                {/* Suche per Name */}
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Spieler suchen (Name)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchResults.length > 0 && (
                    <div style={styles.searchResultsDropdown}>
                      {searchResults.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            setSelectedUser(u);
                            setSearchResults([]);
                          }}
                          style={styles.dropdownItem}
                        >
                          <div>
                            <strong>{u.name}</strong>
                            {u.parent_name && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}> (Kind von {u.parent_name})</span>}
                          </div>
                          <span>{u.balance.toFixed(2).replace('.', ',')} €</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Hardware Simulatoren */}
                <div style={styles.scannerSimulatorBox}>
                  <div style={styles.scannerLabel}>Simulation Hardware-Scanner:</div>
                  <div style={styles.simBtnGrid}>
                    <button
                      onClick={() => simulateNfcScan('NFC_MORITZ_123')}
                      className="btn btn-secondary"
                      style={styles.simBtn}
                    >
                      📟 Scan NFC (Moritz - Kind)
                    </button>
                    <button
                      onClick={() => simulateNfcScan('NFC_MIA_123')}
                      className="btn btn-secondary"
                      style={styles.simBtn}
                    >
                      📟 Scan NFC (Mia - Kind)
                    </button>
                    <button
                      onClick={() => simulateFingerprintScan('FP_MORITZ_456')}
                      className="btn btn-secondary"
                      style={styles.simBtn}
                    >
                      ☝ Scan Finger (Moritz)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SEKTION 2: WARENKORB ODER AUFLADEBETRAG */}
          {kioskMode === 'sale' ? (
            /* WARENKORB FÜR KAUF */
            <div className="card" style={{ ...styles.sidebarCard, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={styles.cartHeader}>
                <h2 style={styles.cardHeaderTitle}>🛒 Warenkorb</h2>
                {cart.length > 0 && (
                  <button onClick={clearCart} style={styles.clearCartBtn}>Leeren</button>
                )}
              </div>

              {cart.length === 0 ? (
                <div style={styles.emptyCartBox}>Der Warenkorb ist leer. Tippe links auf Artikel.</div>
              ) : (
                <div style={styles.cartList}>
                  {cart.map((item) => (
                    <div key={item.product.id} style={styles.cartItem}>
                      <div style={styles.cartItemDetails}>
                        <div style={styles.cartItemName}>{item.product.name}</div>
                        <div style={styles.cartItemPriceInfo}>
                          {item.product.price.toFixed(2).replace('.', ',')} €
                        </div>
                      </div>
                      <div style={styles.cartQtyControls}>
                        <button onClick={() => removeFromCart(item.product)} style={styles.qtyBtn}>-</button>
                        <span style={styles.qtyVal}>{item.quantity}</span>
                        <button onClick={() => addToCart(item.product)} style={styles.qtyBtn}>+</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cart.length > 0 && (
                <div style={styles.cartFooter}>
                  <div style={styles.cartTotalRow}>
                    <span>Gesamtsumme:</span>
                    <span style={styles.cartTotalValue}>
                      {getCartTotal().toFixed(2).replace('.', ',')} €
                    </span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    className="btn btn-accent"
                    style={styles.checkoutBtn}
                    disabled={!selectedUser}
                  >
                    {!selectedUser 
                      ? 'Spieler wählen zum Buchen' 
                      : `Kauf buchen (${getCartTotal().toFixed(2).replace('.', ',')} €)`}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* AUFLADE-EINGABE */
            <div className="card" style={styles.sidebarCard}>
              <h2 style={styles.cardHeaderTitle}>💶 Betrag einzahlen</h2>
              <form onSubmit={handleRecharge}>
                <div className="form-group">
                  <label className="form-label">Einzahlungs-Betrag (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    placeholder="z.B. 10.00"
                    value={chargeAmount}
                    onChange={(e) => setChargeAmount(e.target.value)}
                    required
                    disabled={!selectedUser}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-accent"
                  style={{ width: '100%', marginTop: '0.5rem' }}
                  disabled={!selectedUser}
                >
                  {!selectedUser 
                    ? 'Spieler wählen zum Aufladen' 
                    : `Guthaben aufladen`}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

const styles = {
  kioskContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  kioskHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '1rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  titleArea: {
    textAlign: 'left',
  },
  modeToggleArea: {
    display: 'flex',
    gap: '0.75rem',
  },
  mainLayout: {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'stretch',
    flexWrap: 'wrap',
  },
  productPanel: {
    flex: 2.2,
    minWidth: '400px',
  },
  categoryBar: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  categoryBtn: {
    background: 'rgba(255, 255, 255, 0.04)',
    color: 'var(--text-muted)',
    border: '1px solid var(--border)',
    padding: '0.6rem 1.2rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.95rem',
    transition: 'var(--transition)',
  },
  categoryBtnActive: {
    background: 'var(--primary)',
    color: '#fff',
    border: '1px solid var(--primary)',
  },
  productGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
    gap: '0.75rem',
    maxHeight: '75vh',
    overflowY: 'auto',
    paddingRight: '0.25rem',
  },
  productTile: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'var(--transition)',
    position: 'relative',
    minHeight: '130px',
    justifyContent: 'center',
  },
  tileCategoryBadge: {
    fontSize: '1.25rem',
    marginBottom: '0.25rem',
  },
  tileName: {
    fontWeight: '600',
    color: '#fff',
    fontSize: '0.85rem',
    textAlign: 'center',
    lineHeight: '1.3',
    maxHeight: '2.6em',
    overflow: 'hidden',
  },
  tileSize: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '0.25rem',
  },
  tilePrice: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: 'var(--accent)',
    marginTop: '0.5rem',
  },
  rechargeIntroPanel: {
    flex: 2.2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
  },
  sidebarPanel: {
    flex: 1.3,
    minWidth: '320px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  sidebarCard: {
    textAlign: 'left',
  },
  cardHeaderTitle: {
    fontSize: '1.1rem',
    marginBottom: '1rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '0.5rem',
  },
  identifiedUserBox: {
    background: 'rgba(212, 175, 55, 0.08)',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    borderRadius: 'var(--radius-sm)',
    padding: '1rem',
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    gap: '0.75rem',
  },
  userAvatar: {
    width: '45px',
    height: '45px',
    borderRadius: '50px',
    background: 'var(--primary)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '1.2rem',
  },
  userIdentDetails: {
    flex: 1,
  },
  selectedName: {
    fontWeight: '700',
    color: '#fff',
    fontSize: '1.05rem',
  },
  selectedBalanceLabel: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    marginTop: '0.15rem',
  },
  parentLinkText: {
    fontSize: '0.75rem',
    color: 'var(--accent)',
    marginTop: '0.1rem',
  },
  removeUserBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '1.1rem',
    padding: '0.25rem',
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem',
  },
  searchResultsDropdown: {
    position: 'absolute',
    width: 'calc(100% - 3rem)',
    background: '#1a1c23',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    boxShadow: 'var(--shadow-lg)',
    zIndex: 50,
    maxHeight: '200px',
    overflowY: 'auto',
    marginTop: '0.25rem',
  },
  dropdownItem: {
    width: '100%',
    padding: '0.65rem 1rem',
    background: 'none',
    border: 'none',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    color: '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    textAlign: 'left',
  },
  scannerSimulatorBox: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px dashed rgba(255, 255, 255, 0.1)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.75rem 1rem',
    marginTop: '1rem',
  },
  scannerLabel: {
    fontSize: '0.75rem',
    color: 'var(--accent)',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: '0.5rem',
  },
  simBtnGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  simBtn: {
    padding: '0.4rem 0.75rem',
    fontSize: '0.8rem',
    textAlign: 'left',
    justifyContent: 'flex-start',
  },
  cartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  clearCartBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--danger)',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '600',
  },
  emptyCartBox: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    minHeight: '120px',
  },
  cartList: {
    flex: 1,
    overflowY: 'auto',
    maxHeight: '30vh',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  cartItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
  },
  cartItemDetails: {
    flex: 1,
  },
  cartItemName: {
    fontWeight: '600',
    fontSize: '0.85rem',
    color: '#fff',
  },
  cartItemPriceInfo: {
    fontSize: '0.75rem',
    color: 'var(--accent)',
    marginTop: '0.1rem',
  },
  cartQtyControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  qtyBtn: {
    width: '26px',
    height: '26px',
    borderRadius: '4px',
    border: '1px solid var(--border)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
  },
  qtyVal: {
    fontSize: '0.9rem',
    fontWeight: '700',
    minWidth: '15px',
    textAlign: 'center',
  },
  cartFooter: {
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    paddingTop: '1rem',
  },
  cartTotalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '1rem',
    fontWeight: '700',
    marginBottom: '1rem',
  },
  cartTotalValue: {
    color: '#fff',
    fontSize: '1.25rem',
  },
  checkoutBtn: {
    width: '100%',
  },
  errorAlert: {
    background: 'rgba(239, 68, 68, 0.15)',
    color: '#fc8181',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
  },
  successAlert: {
    background: 'rgba(16, 185, 129, 0.15)',
    color: '#a7f3d0',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
  },
};
