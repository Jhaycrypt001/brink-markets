/**
 * Biometric App Lock — a device-local unlock gate built on WebAuthn's platform
 * authenticator (Touch ID / Windows Hello / Android fingerprint / Face ID).
 *
 * What it is: an optional lock screen that requires the device's biometric
 * before the Brink terminal is revealed on THIS device+browser. The credential
 * is created with `authenticatorAttachment: "platform"` and
 * `userVerification: "required"`, so unlocking always demands the fingerprint/
 * face, never a silent pass.
 *
 * What it is NOT: it does not sign blockchain transactions and does not replace
 * the wallet. Non-custodial signing stays with the connected wallet — this is a
 * convenience lock on the UI, remembered per device in localStorage.
 */

const CRED_KEY = "brink.biometric.credId";
const ENABLED_KEY = "brink.biometric.enabled";

function bufToB64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToBuf(b64url: string): ArrayBuffer {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((b64url.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

/** True only when a credential is registered AND the lock is switched on. */
export function biometricEnabled(): boolean {
  try {
    return localStorage.getItem(ENABLED_KEY) === "true" && Boolean(localStorage.getItem(CRED_KEY));
  } catch {
    return false;
  }
}

/** Does this device have a usable platform authenticator (fingerprint/face)? */
export async function biometricSupported(): Promise<boolean> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) return false;
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/**
 * Enroll the device biometric. Opens the platform's fingerprint/face prompt and,
 * on success, stores the credential id so future unlocks can reference it.
 * Throws if the user cancels or the device has no platform authenticator.
 */
export async function registerBiometric(label: string): Promise<void> {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = crypto.getRandomValues(new Uint8Array(16));
  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: "Brink Markets", id: location.hostname },
      user: {
        id: userId,
        name: label || "brink-user",
        displayName: label || "Brink user"
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 }, // ES256
        { type: "public-key", alg: -257 } // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred"
      },
      timeout: 60_000,
      attestation: "none"
    }
  })) as PublicKeyCredential | null;

  if (!credential) throw new Error("Biometric enrolment was cancelled.");
  try {
    localStorage.setItem(CRED_KEY, bufToB64url(credential.rawId));
    localStorage.setItem(ENABLED_KEY, "true");
  } catch {
    throw new Error("Could not save the biometric lock on this device.");
  }
}

/**
 * Prompt for the biometric and resolve true only when the platform verifies the
 * user against the enrolled credential. Rejects/returns false on cancel or when
 * nothing is enrolled.
 */
export async function verifyBiometric(): Promise<boolean> {
  let credB64: string | null = null;
  try {
    credB64 = localStorage.getItem(CRED_KEY);
  } catch {
    return false;
  }
  if (!credB64) return false;

  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: [{ type: "public-key", id: b64urlToBuf(credB64), transports: ["internal"] }],
      userVerification: "required",
      rpId: location.hostname,
      timeout: 60_000
    }
  });
  return Boolean(assertion);
}

/** Turn the lock off and forget the credential on this device. */
export function disableBiometric(): void {
  try {
    localStorage.removeItem(CRED_KEY);
    localStorage.removeItem(ENABLED_KEY);
  } catch {
    /* ignore */
  }
}
