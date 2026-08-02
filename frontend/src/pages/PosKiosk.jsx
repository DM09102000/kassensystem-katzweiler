import React, { useState, useEffect } from 'react';
import { isWebAuthnSupported, registerFingerprintOnTablet, scanFingerprintOnTablet } from '../utils/webauthn';

const DENOMINATIONS = [
  { value: 100.0, label: '100 €', type: 'bill', color: '#889a74', border: '#748660' }, // premium olive green bill
  { value: 50.0, label: '50 €', type: 'bill', color: '#d4883b', border: '#bb742c' },   // orange-amber bill
  { value: 20.0, label: '20 €', type: 'bill', color: '#5b7aa6', border: '#46628c' },   // blue bill
  { value: 10.0, label: '10 €', type: 'bill', color: '#c45a50', border: '#aa463d' },   // red bill
  { value: 5.0, label: '5 €', type: 'bill', color: '#7a8c7d', border: '#647667' },     // grey-green bill
  { value: 2.0, label: '2 €', type: 'coin', color: '#dec68a', border: '#b0b0b0' },
  { value: 1.0, label: '1 €', type: 'coin', color: '#d0d0d0', border: '#bfa468' },
  { value: 0.5, label: '0,50 €', type: 'coin', color: '#bfa468', border: '#a88f55' },
  { value: 0.2, label: '0,20 €', type: 'coin', color: '#bfa468', border: '#a88f55' },
  { value: 0.1, label: '0,10 €', type: 'coin', color: '#bfa468', border: '#a88f55' },
  { value: 0.05, label: '0,05 €', type: 'coin', color: '#a05c30', border: '#8b4b20' }, // copper coin
];

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
  const [checkoutUser, setCheckoutUser] = useState(null);

  // Münz- und Scheinzähler
  const [cashCounts, setCashCounts] = useState({});

  // Status-Meldungen
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  // Produktkategorie Filter für Kacheln
  const [activeCategory, setActiveCategory] = useState('Alle');

  // Modal für Zahlung/Identifikation bei Klick auf "Buchen"
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const loadInitialData = async () => {
    try {
      // 1. Produkte laden
      const prodRes = await fetch('/api/products');
      const prodData = await prodRes.json();
      if (!prodRes.ok) throw new Error('Fehler beim Laden der Produkte');
      setProducts(prodData);

      // 2. Benutzer laden für die Suche
      const usersRes = await fetch('/api/users', {
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

  // Helper für die Buchungsdurchführung
  const performCheckout = async (user) => {
    if (cart.length === 0) {
      setError('Der Warenkorb ist leer.');
      return false;
    }

    const items = cart.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
    }));

    try {
      const response = await fetch('/api/transactions/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user.id, items }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Fehler beim Kaufvorgang');

      setSuccess(`Kauf erfolgreich gebucht für ${user.name}! Neues Guthaben: ${data.newBalance.toFixed(2).replace('.', ',')} €`);
      clearCart();
      setSelectedUser(null);
      setCheckoutUser(null);
      setSearchQuery('');
      setShowCheckoutModal(false);
      loadInitialData(); // Kontostände aktualisieren
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  // Hardware Simulationen
  const simulateNfcScan = async (nfcId) => {
    setError('');
    setSuccess('');
    const user = users.find((u) => u.nfc_id === nfcId);
    if (user) {
      if (showCheckoutModal) {
        setCheckoutUser(user);
      } else {
        setSelectedUser(user);
        setSuccess(`NFC-Tag gescannt: ${user.name} identifiziert!`);
      }
    } else {
      setError(`NFC-Tag ID "${nfcId}" ist keinem Benutzer zugeordnet.`);
    }
  };

  const simulateFingerprintScan = async (fpId) => {
    setError('');
    setSuccess('');
    const user = users.find((u) => u.fingerprint_id === fpId);
    if (user) {
      if (showCheckoutModal) {
        setCheckoutUser(user);
      } else {
        setSelectedUser(user);
        setSuccess(`Fingerabdruck gescannt: ${user.name} identifiziert!`);
      }
    } else {
      setError(`Fingerabdruck-ID "${fpId}" ist keinem Benutzer zugeordnet.`);
    }
  };

  // Live Tablet Fingerprint Sensor Scan (WebAuthn)
  const handleTabletFingerprintScan = async () => {
    setError('');
    setSuccess('');
    try {
      const user = await scanFingerprintOnTablet(users);
      if (user) {
        if (showCheckoutModal) {
          setCheckoutUser(user);
        } else {
          setSelectedUser(user);
          setSuccess(`Eingebauter Sensor: ${user.name} erfolgreich identifiziert!`);
        }
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Live Tablet Fingerprint Sensor Register (WebAuthn)
  const handleTabletFingerprintRegister = async () => {
    if (!selectedUser) return;
    setError('');
    setSuccess('');
    try {
      const fpId = await registerFingerprintOnTablet(selectedUser);
      await handleLinkHardware(undefined, fpId);
      setSuccess(`Fingerabdruck auf Tablet erfolgreich für ${selectedUser.name} registriert!`);
    } catch (err) {
      setError(err.message);
    }
  };

  // Checkout buchen
  const handleCheckout = async () => {
    setError('');
    setSuccess('');

    if (cart.length === 0) {
      setError('Der Warenkorb ist leer.');
      return;
    }

    setShowCheckoutModal(true);
    if (selectedUser) {
      setCheckoutUser(selectedUser);
    }
  };

  // Münz-/Scheinauswahl berechnen und anpassen
  const adjustCashCount = (val, delta) => {
    setCashCounts((prev) => {
      const current = prev[val] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[val];
        return copy;
      }
      return { ...prev, [val]: next };
    });
  };

  const getRechargeTotal = () => {
    return Object.entries(cashCounts).reduce(
      (sum, [val, qty]) => sum + parseFloat(val) * qty,
      0
    );
  };

  // Guthaben aufladen
  const handleRecharge = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedUser) {
      setError('Bitte wählen Sie zuerst einen Benutzer aus.');
      return;
    }

    const amount = getRechargeTotal();
    if (amount <= 0) {
      setError('Bitte wählen Sie Münzen oder Geldscheine aus, um einen Betrag aufzuladen.');
      return;
    }

    try {
      const response = await fetch(`/api/users/${selectedUser.id}/charge`, {
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
      setCashCounts({});
      setSelectedUser(null);
      setSearchQuery('');
      loadInitialData(); // Kontostände aktualisieren
    } catch (err) {
      setError(err.message);
    }
  };

  // Hardware verknüpfen (POS/Admin)
  const handleLinkHardware = async (nfcId, fpId) => {
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/users/${selectedUser.id}/link-hardware`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nfc_id: nfcId,
          fingerprint_id: fpId
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Fehler beim Verknüpfen der Hardware');

      setSuccess('Hardware-Verknüpfung erfolgreich aktualisiert!');
      setSelectedUser(data.user);
      loadInitialData(); // Aktualisiere die lokale Benutzerliste
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
      {error && <div style={{ ...styles.errorAlert, padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>{error}</div>}
      {success && <div style={{ ...styles.successAlert, padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>{success}</div>}

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
                  {prod.image_url ? (
                    <div style={{ width: '100%', aspectRatio: '4 / 3', maxHeight: '75px', borderRadius: '6px', overflow: 'hidden', marginBottom: '0.35rem', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={prod.image_url} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div style={styles.tileCategoryBadge}>
                      {prod.category === 'Getränk' ? '🍹' : '🌭'}
                    </div>
                  )}
                  <div style={styles.tileName}>{prod.name}</div>
                  <div style={styles.tileSize}>{prod.size_info || 'Portion'}</div>
                  <div style={styles.tilePrice}>{prod.price.toFixed(2).replace('.', ',')} €</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* BEI AUFLADE-MODUS: MÜNZEN & SCHEINE AUSWAHL */
          <div style={styles.cashPanel} className="card">
            <div style={styles.cashSectionHeader}>
              <h2 style={{ color: 'var(--accent)', fontSize: '1.25rem' }}>💶 Geldscheine</h2>
              <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>Für +1 Schein tippen, auf minus (-) klicken zum Abziehen</p>
            </div>
            <div style={styles.billsGrid}>
              {DENOMINATIONS.filter(d => d.type === 'bill').map((denom) => {
                const count = cashCounts[denom.value] || 0;
                return (
                  <div 
                    key={denom.value} 
                    style={{
                      ...styles.cashTile,
                      ...styles.billTile,
                      backgroundColor: denom.color,
                      borderColor: denom.border,
                    }}
                  >
                    <button 
                      onClick={() => adjustCashCount(denom.value, 1)}
                      style={styles.cashTileMainBtn}
                    >
                      <span style={styles.billLabelText}>{denom.label}</span>
                      {count > 0 && (
                        <span style={styles.billCountBadge}>{count}</span>
                      )}
                    </button>
                    {count > 0 && (
                      <button 
                        onClick={() => adjustCashCount(denom.value, -1)}
                        style={styles.cashTileMinusBtn}
                      >
                        -
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ ...styles.cashSectionHeader, marginTop: '2rem' }}>
              <h2 style={{ color: 'var(--accent)', fontSize: '1.25rem' }}>🪙 Münzen</h2>
              <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>Für +1 Münze tippen, auf minus (-) klicken zum Abziehen</p>
            </div>
            <div style={styles.coinsGrid}>
              {DENOMINATIONS.filter(d => d.type === 'coin').map((denom) => {
                const count = cashCounts[denom.value] || 0;
                const isTwoEuro = denom.value === 2.0;
                const isOneEuro = denom.value === 1.0;
                
                return (
                  <div 
                    key={denom.value} 
                    style={{
                      ...styles.cashTile,
                      ...styles.coinTile,
                      backgroundColor: denom.color,
                      borderColor: denom.border,
                      backgroundImage: isTwoEuro 
                        ? 'radial-gradient(circle, #dec68a 50%, #d0d0d0 52%)' 
                        : isOneEuro 
                          ? 'radial-gradient(circle, #d0d0d0 50%, #dec68a 52%)' 
                          : 'none',
                    }}
                  >
                    <button 
                      onClick={() => adjustCashCount(denom.value, 1)}
                      style={styles.cashTileMainBtn}
                    >
                      <span style={{
                        ...styles.coinLabelText,
                        color: (isTwoEuro || isOneEuro) ? '#333' : denom.value === 0.05 ? '#fff' : '#222'
                      }}>{denom.label}</span>
                      {count > 0 && (
                        <span style={styles.coinCountBadge}>{count}</span>
                      )}
                    </button>
                    {count > 0 && (
                      <button 
                        onClick={() => adjustCashCount(denom.value, -1)}
                        style={styles.cashTileMinusBtn}
                      >
                        -
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* RECHTE SPALTE: REINER WARENKORB ODER AUFLADEMODUS */}
        <div style={styles.sidebarPanel}>

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
                  >
                    Kauf buchen ({getCartTotal().toFixed(2).replace('.', ',')} €)
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* AUFLADE-EINGABE */
            <div className="card" style={styles.sidebarCard}>
              <h2 style={styles.cardHeaderTitle}>💶 Betrag einzahlen</h2>
              <div style={styles.rechargeSidebarBox}>
                <div style={styles.rechargeTotalDisplay}>
                  <div style={styles.rechargeTotalLabel}>Ausgewählte Einzahlung:</div>
                  <div style={styles.rechargeTotalVal}>
                    {getRechargeTotal().toFixed(2).replace('.', ',')} €
                  </div>
                </div>

                {/* Auflistung der gezählten Scheine/Münzen */}
                {Object.keys(cashCounts).length === 0 ? (
                  <div style={styles.noCashSelectedText}>
                    Bitte Scheine und Münzen auf der linken Seite antippen.
                  </div>
                ) : (
                  <div style={styles.cashBreakdownList}>
                    {Object.entries(cashCounts).map(([val, qty]) => {
                      const value = parseFloat(val);
                      const displayVal = value >= 1.0 
                        ? `${Math.floor(value)} €` 
                        : `${(value * 100).toFixed(0)} ct`;
                      return (
                        <div key={val} style={styles.cashBreakdownItem}>
                          <span>{qty}x {displayVal}</span>
                          <span style={{ fontWeight: '600' }}>{(value * qty).toFixed(2).replace('.', ',')} €</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                  {Object.keys(cashCounts).length > 0 && (
                    <button
                      onClick={() => setCashCounts({})}
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '0.5rem' }}
                    >
                      Leeren
                    </button>
                  )}
                  <button
                    onClick={handleRecharge}
                    className="btn btn-accent"
                    style={{ flex: 2, padding: '0.5rem' }}
                    disabled={!selectedUser || getRechargeTotal() <= 0}
                  >
                    {!selectedUser 
                      ? 'Spieler wählen' 
                      : `Aufladen (${getRechargeTotal().toFixed(2).replace('.', ',')} €)`}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* CHECKOUT MODAL: SPIELER IDENTIFIZIEREN (NFC / FP / SUCHE) */}
      {showCheckoutModal && (
        <div style={styles.modalOverlay}>
          <div className="card" style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h2 style={{ color: 'var(--accent)', fontSize: '1.4rem' }}>🔒 Zahlung autorisieren</h2>
              <button 
                onClick={() => {
                  setShowCheckoutModal(false);
                  setError('');
                }} 
                style={styles.modalCloseBtn}
              >
                ✕
              </button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.modalTotalDisplay}>
                <span>Zu zahlender Betrag:</span>
                <strong style={styles.modalTotalValue}>
                  {getCartTotal().toFixed(2).replace('.', ',')} €
                </strong>
              </div>

              {error && (
                <div style={styles.modalErrorAlert}>
                  ⚠️ {error}
                </div>
              )}

              {checkoutUser ? (
                /* BESTÄTIGUNGS-ANSICHT (AVATAR & INFO) */
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginTop: '1rem', textAlign: 'center' }}>
                  {/* Large Avatar preview */}
                  <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '3px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
                    {checkoutUser.avatar_url ? (
                      <img src={checkoutUser.avatar_url} alt={checkoutUser.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '3.5rem' }}>👤</span>
                    )}
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '0.25rem' }}>{checkoutUser.name}</h3>
                    {checkoutUser.parent_id ? (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        👪 Kind-Account (Gemeinsames Guthaben)
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        👤 Haupt-Account
                      </div>
                    )}
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.75rem 1.25rem', width: '100%', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.9rem', textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Verfügbares Guthaben:</span>
                      <strong style={{ color: 'var(--accent)' }}>{checkoutUser.balance.toFixed(2).replace('.', ',')} €</strong>
                    </div>
                    {checkoutUser.daily_limit !== null && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Tageslimit:</span>
                          <strong>{checkoutUser.daily_limit.toFixed(2).replace('.', ',')} €</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Heute verbraucht:</span>
                          <strong style={{ color: checkoutUser.spent_today >= checkoutUser.daily_limit ? 'var(--danger)' : 'var(--success)' }}>
                            {checkoutUser.spent_today.toFixed(2).replace('.', ',')} €
                          </strong>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Buttons for confirmation */}
                  <div style={{ display: 'flex', gap: '0.75rem', width: '100%', marginTop: '1rem' }}>
                    <button
                      onClick={() => setCheckoutUser(null)}
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '0.75rem' }}
                    >
                      Zurück / Abbrechen
                    </button>
                    <button
                      onClick={() => performCheckout(checkoutUser)}
                      className="btn btn-accent"
                      style={{ flex: 2, padding: '0.75rem', fontSize: '0.95rem', fontWeight: '700' }}
                    >
                      ✓ Kauf buchen
                    </button>
                  </div>
                </div>
              ) : (
                /* IDENTIFIZIERUNGS-ANSICHT (NFC/FP SCAN ODER NAMENSSUCHE) */
                <>
                  <p style={styles.modalInstruction}>
                    Bitte NFC-Chip an das Lesegerät halten oder den Finger auf den Scanner legen.
                  </p>

                  {/* Tablet Live Sensor & Simulation Buttons */}
                  <div style={styles.modalScannerSimBox}>
                    <div style={{ fontSize: '0.85rem', color: '#fff', marginBottom: '0.6rem', fontWeight: '700' }}>
                      FINGERABDRUCK-SENSOR DES TABLETS:
                    </div>
                    <button
                      onClick={handleTabletFingerprintScan}
                      className="btn btn-accent"
                      style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', fontWeight: '800', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(212,175,55,0.3)' }}
                    >
                      ☝️ Fingerabdruck am Tablet scannen
                    </button>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                      Oder Test-Simulationen:
                    </div>
                    <div style={styles.modalSimBtnGrid}>
                      <button
                        onClick={() => simulateNfcScan('NFC_MORITZ_123')}
                        className="btn btn-secondary"
                        style={styles.modalSimBtn}
                      >
                        💳 Scan NFC (Moritz)
                      </button>
                      <button
                        onClick={() => simulateNfcScan('NFC_MIA_456')}
                        className="btn btn-secondary"
                        style={styles.modalSimBtn}
                      >
                        💳 Scan NFC (Mia)
                      </button>
                      <button
                        onClick={() => simulateFingerprintScan('FP_MAX_999')}
                        className="btn btn-secondary"
                        style={styles.modalSimBtn}
                      >
                        👆 Simuliere Finger (Max)
                      </button>
                    </div>
                  </div>

                  <div style={{ margin: '1.5rem 0', height: '1px', background: 'rgba(255,255,255,0.08)' }}></div>

                  <div style={{ textAlign: 'left' }}>
                    <label className="form-label" style={{ fontSize: '0.9rem' }}>Oder Spieler manuell suchen:</label>
                    <div className="form-group" style={{ position: 'relative', marginTop: '0.35rem' }}>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Name eingeben..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchResults.length > 0 && (
                        <div style={styles.searchResultsDropdown}>
                          {searchResults.map((u) => (
                            <button
                              key={u.id}
                              onClick={() => {
                                setSearchResults([]);
                                setCheckoutUser(u);
                              }}
                              style={{ ...styles.dropdownItem, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                              <div style={{ width: '25px', height: '25px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {u.avatar_url ? (
                                  <img src={u.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <span style={{ fontSize: '0.75rem' }}>👤</span>
                                )}
                              </div>
                              <div style={{ flex: 1, textAlign: 'left' }}>
                                <strong>{u.name}</strong>
                                {u.parent_name && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}> (Kind)</span>}
                              </div>
                              <span>{u.balance.toFixed(2).replace('.', ',')} €</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  kioskContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    height: 'calc(100vh - 70px)',
    maxHeight: 'calc(100vh - 70px)',
    overflow: 'hidden',
    boxSizing: 'border-box',
  },
  kioskHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '0.4rem',
    gap: '0.75rem',
    flexShrink: 0,
  },
  titleArea: {
    textAlign: 'left',
  },
  modeToggleArea: {
    display: 'flex',
    gap: '0.5rem',
  },
  mainLayout: {
    flex: 1,
    display: 'flex',
    gap: '1rem',
    alignItems: 'stretch',
    overflow: 'hidden',
  },
  productPanel: {
    flex: 2.2,
    minWidth: '340px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  categoryBar: {
    display: 'flex',
    gap: '0.4rem',
    marginBottom: '0.4rem',
    flexShrink: 0,
  },
  categoryBtn: {
    background: 'rgba(255, 255, 255, 0.04)',
    color: 'var(--text-muted)',
    border: '1px solid var(--border)',
    padding: '0.35rem 0.8rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.85rem',
    transition: 'var(--transition)',
  },
  categoryBtnActive: {
    background: 'var(--primary)',
    color: '#fff',
    border: '1px solid var(--primary)',
  },
  productGrid: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '0.75rem',
    overflowY: 'auto',
    paddingRight: '0.4rem',
    alignContent: 'start',
  },
  productTile: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '0.75rem 0.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'var(--transition)',
    position: 'relative',
    minHeight: '135px',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  tileCategoryBadge: {
    fontSize: '1.5rem',
    marginBottom: '0.25rem',
  },
  tileName: {
    fontWeight: '700',
    color: '#fff',
    fontSize: '0.95rem',
    textAlign: 'center',
    lineHeight: '1.25',
    maxHeight: '2.5em',
    overflow: 'hidden',
  },
  tileSize: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '0.15rem',
  },
  tilePrice: {
    fontSize: '1.05rem',
    fontWeight: '800',
    color: 'var(--accent)',
    marginTop: '0.35rem',
  },
  cashPanel: {
    flex: 2.2,
    minWidth: '340px',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    padding: '0.75rem',
  },
  cashSectionHeader: {
    marginBottom: '0.5rem',
  },
  billsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(95px, 1fr))',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  coinsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
    gap: '0.5rem',
  },
  cashTile: {
    borderRadius: '8px',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    border: '1px solid var(--border)',
    transition: 'var(--transition)',
  },
  billTile: {
    minHeight: '65px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
  },
  coinTile: {
    aspectRatio: '1',
    borderRadius: '100px',
    maxWidth: '65px',
    margin: '0 auto',
    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
  },
  cashTileMainBtn: {
    flex: 1,
    background: 'none',
    border: 'none',
    width: '100%',
    height: '100%',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.5rem',
    position: 'relative',
  },
  cashTileMinusBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    background: 'rgba(239, 68, 68, 0.9)',
    color: '#fff',
    border: 'none',
    borderTopLeftRadius: '6px',
    width: '26px',
    height: '22px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    transition: 'var(--transition)',
  },
  billLabelText: {
    fontWeight: '800',
    fontSize: '1.1rem',
    color: '#fff',
    textShadow: '1px 1px 3px rgba(0,0,0,0.5)',
  },
  billCountBadge: {
    position: 'absolute',
    top: '5px',
    left: '5px',
    background: '#fff',
    color: '#000',
    borderRadius: '50px',
    padding: '0.1rem 0.4rem',
    fontSize: '0.75rem',
    fontWeight: '800',
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
  },
  coinLabelText: {
    fontWeight: '800',
    fontSize: '0.85rem',
    textShadow: '0.5px 0.5px 1px rgba(255,255,255,0.3)',
  },
  coinCountBadge: {
    position: 'absolute',
    top: '3px',
    left: '3px',
    background: 'var(--primary)',
    color: '#fff',
    borderRadius: '50px',
    padding: '0.1rem 0.35rem',
    fontSize: '0.65rem',
    fontWeight: '800',
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
  },
  rechargeSidebarBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  rechargeTotalDisplay: {
    background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%)',
    border: '1px solid rgba(212, 175, 55, 0.25)',
    borderRadius: '8px',
    padding: '1rem',
    textAlign: 'center',
  },
  rechargeTotalLabel: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
    marginBottom: '0.25rem',
  },
  rechargeTotalVal: {
    fontSize: '1.8rem',
    fontWeight: '800',
    color: 'var(--accent)',
  },
  noCashSelectedText: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    textAlign: 'center',
    padding: '1.5rem 0',
    border: '1px dashed var(--border)',
    borderRadius: '6px',
  },
  cashBreakdownList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    maxHeight: '150px',
    overflowY: 'auto',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    padding: '0.5rem 0.75rem',
    background: 'rgba(255,255,255,0.01)',
  },
  cashBreakdownItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
    color: 'var(--text-main)',
    borderBottom: '1px dashed rgba(255,255,255,0.03)',
    paddingBottom: '0.2rem',
  },
  sidebarPanel: {
    flex: 1,
    minWidth: '320px',
    maxWidth: '380px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    height: '100%',
  },
  sidebarCard: {
    flex: 1,
    textAlign: 'left',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  cardHeaderTitle: {
    fontSize: '1.1rem',
    marginBottom: '0.75rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '0.5rem',
  },
  identifiedUserBox: {
    background: 'rgba(212, 175, 55, 0.08)',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.5rem 0.75rem',
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    gap: '0.6rem',
  },
  userAvatar: {
    width: '38px',
    height: '38px',
    borderRadius: '50px',
    background: 'var(--primary)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '1rem',
  },
  userIdentDetails: {
    flex: 1,
  },
  selectedName: {
    fontWeight: '700',
    color: '#fff',
    fontSize: '0.95rem',
  },
  selectedBalanceLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    marginTop: '0.1rem',
  },
  parentLinkText: {
    fontSize: '0.7rem',
    color: 'var(--accent)',
    marginTop: '0.05rem',
  },
  removeUserBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '1rem',
    padding: '0.2rem',
    position: 'absolute',
    top: '0.4rem',
    right: '0.4rem',
  },
  identifiedUserBoxContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  limitInfoText: {
    fontSize: '0.75rem',
    color: '#eee',
    marginTop: '0.2rem',
    lineHeight: '1.3',
  },
  hardwareRegistrationBox: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.5rem 0.75rem',
  },
  hardwareSectionTitle: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--accent)',
    textTransform: 'uppercase',
    marginBottom: '0.35rem',
    letterSpacing: '0.03em',
  },
  hardwareRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.25rem 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
    fontSize: '0.8rem',
  },
  hardwareStatusActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  hardwareIdText: {
    fontSize: '0.75rem',
    color: 'var(--success)',
    fontWeight: '600',
  },
  unlinkBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--danger)',
    fontSize: '0.7rem',
    cursor: 'pointer',
    fontWeight: '600',
  },
  linkBtn: {
    padding: '0.2rem 0.4rem',
    fontSize: '0.75rem',
  },
  searchResultsDropdown: {
    position: 'absolute',
    width: 'calc(100% - 2rem)',
    background: '#1a1c23',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    boxShadow: 'var(--shadow-lg)',
    zIndex: 50,
    maxHeight: '180px',
    overflowY: 'auto',
    marginTop: '0.25rem',
  },
  dropdownItem: {
    width: '100%',
    padding: '0.5rem 0.75rem',
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
    padding: '0.5rem 0.75rem',
    marginTop: '0.5rem',
  },
  scannerLabel: {
    fontSize: '0.7rem',
    color: 'var(--accent)',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: '0.35rem',
  },
  simBtnGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
  },
  simBtn: {
    padding: '0.3rem 0.6rem',
    fontSize: '0.75rem',
    textAlign: 'left',
    justifyContent: 'flex-start',
  },
  cartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.35rem',
  },
  clearCartBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--danger)',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '600',
  },
  emptyCartBox: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
    minHeight: '80px',
  },
  cartList: {
    flex: 1,
    overflowY: 'auto',
    maxHeight: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    marginBottom: '0.5rem',
    paddingRight: '0.2rem',
  },
  cartItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.65rem 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
  },
  cartItemDetails: {
    flex: 1,
    paddingRight: '0.5rem',
  },
  cartItemName: {
    fontWeight: '700',
    fontSize: '0.95rem',
    color: '#fff',
    lineHeight: '1.3',
  },
  cartItemPriceInfo: {
    fontSize: '0.8rem',
    color: 'var(--accent)',
    marginTop: '0.15rem',
    fontWeight: '600',
  },
  cartQtyControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  qtyBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    border: '1px solid var(--border)',
    background: 'rgba(255, 255, 255, 0.08)',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '1.1rem',
  },
  qtyVal: {
    fontSize: '1.05rem',
    fontWeight: '800',
    minWidth: '20px',
    textAlign: 'center',
  },
  cartFooter: {
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    paddingTop: '0.85rem',
    marginTop: 'auto',
  },
  cartTotalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '1.05rem',
    fontWeight: '700',
    marginBottom: '0.85rem',
  },
  cartTotalValue: {
    color: 'var(--accent, #d4af37)',
    fontSize: '1.5rem',
    fontWeight: '800',
  },
  checkoutBtn: {
    width: '100%',
    padding: '0.85rem 1rem',
    fontSize: '1.05rem',
    fontWeight: '800',
    borderRadius: '10px',
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
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalCard: {
    width: '100%',
    maxWidth: '500px',
    background: 'rgba(30, 20, 24, 0.95)',
    border: '1px solid rgba(212, 175, 55, 0.25)',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
    padding: '1.75rem',
    borderRadius: 'var(--radius-md)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '0.75rem',
    marginBottom: '1rem',
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '1.25rem',
    cursor: 'pointer',
  },
  modalBody: {
    textAlign: 'center',
  },
  modalTotalDisplay: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
  },
  modalTotalValue: {
    fontSize: '1.6rem',
    color: 'var(--accent)',
  },
  modalErrorAlert: {
    background: 'rgba(239, 68, 68, 0.15)',
    color: '#fc8181',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    padding: '0.75rem',
    marginBottom: '1rem',
    textAlign: 'left',
    fontSize: '0.9rem',
  },
  modalInstruction: {
    fontSize: '0.95rem',
    lineHeight: '1.4',
    marginBottom: '1.25rem',
    color: '#eee',
  },
  modalScannerSimBox: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px dashed rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '1rem',
    textAlign: 'left',
  },
  modalSimBtnGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  modalSimBtn: {
    padding: '0.5rem 0.75rem',
    fontSize: '0.8rem',
    textAlign: 'left',
  },
};
