/**
 * WebAuthn Helper for Tablet built-in Fingerprint Sensor
 */

export function isWebAuthnSupported() {
  return typeof window !== 'undefined' && !!window.PublicKeyCredential;
}

/**
 * Register a user's fingerprint using the tablet's built-in biometric sensor.
 * Returns a unique credential ID string.
 */
export async function registerFingerprintOnTablet(user) {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn (Fingerabdruck-Sensor) wird von diesem Browser/Tablet nicht unterstützt.');
  }

  const userIdBuffer = new Uint8Array(8);
  crypto.getRandomValues(userIdBuffer);

  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);

  const options = {
    publicKey: {
      challenge,
      rp: { name: 'FLB Kantine' },
      user: {
        id: userIdBuffer,
        name: user.username || `user_${user.id}`,
        displayName: user.name,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },  // ES256
        { type: 'public-key', alg: -257 } // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Built-in tablet fingerprint sensor
        userVerification: 'preferred',
      },
      timeout: 60000,
    }
  };

  const credential = await navigator.credentials.create(options);
  if (!credential) throw new Error('Fingerabdruck-Scan abgebrochen');

  return credential.id;
}

/**
 * Scan a fingerprint using the tablet's built-in sensor to identify a user.
 * Prompts the native Android/Windows/iOS biometric dialog.
 */
export async function scanFingerprintOnTablet(users) {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn (Fingerabdruck-Sensor) wird von diesem Browser/Tablet nicht unterstützt.');
  }

  const registeredUsers = users.filter((u) => u.fingerprint_id);
  if (registeredUsers.length === 0) {
    throw new Error('Es sind noch keine Fingerabdrücke im System verknüpft.');
  }

  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);

  try {
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge,
        userVerification: 'preferred',
        timeout: 60000,
      }
    });

    if (!credential) return null;

    const matchedUser = registeredUsers.find(
      (u) => u.fingerprint_id === credential.id || credential.id.includes(u.fingerprint_id) || u.fingerprint_id.includes(credential.id)
    );

    if (!matchedUser) {
      throw new Error(`Erkannter Fingerabdruck (${credential.id.slice(0, 8)}...) ist keinem Spieler zugeordnet.`);
    }

    return matchedUser;
  } catch (err) {
    if (err.name === 'NotAllowedError') {
      throw new Error('Fingerabdruck-Scan vom Benutzer abgebrochen.');
    }
    throw err;
  }
}
