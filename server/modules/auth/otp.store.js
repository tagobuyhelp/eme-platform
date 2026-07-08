/**
 * In-memory OTP Store
 * -------------------
 * Stores OTPs keyed by phone number with auto-expiry.
 *
 * Each entry: { otp, expiresAt, attempts, sentAt }
 * - OTP is valid for 5 minutes
 * - Max 3 verification attempts per OTP
 * - 60-second cooldown between sends (rate limiting)
 */

const store = new Map();

const OTP_TTL_MS = 5 * 60 * 1000;       // 5 minutes
const RESEND_COOLDOWN_MS = 60 * 1000;    // 60 seconds
const MAX_ATTEMPTS = 3;
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Generate a random 6-digit OTP string.
 */
function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Store a new OTP for the given phone number.
 * Returns { otp } on success.
 * Throws if cooldown period has not elapsed.
 */
export function createOtp(phone) {
  const normalizedPhone = String(phone).trim();
  const existing = store.get(normalizedPhone);

  // Rate-limit: enforce cooldown between sends
  if (existing && Date.now() - existing.sentAt < RESEND_COOLDOWN_MS) {
    const remainingSec = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - existing.sentAt)) / 1000);
    const err = new Error(`Please wait ${remainingSec} seconds before requesting a new OTP`);
    err.statusCode = 429;
    throw err;
  }

  const otp = generateOtp();

  store.set(normalizedPhone, {
    otp,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
    sentAt: Date.now(),
  });

  return { otp };
}

/**
 * Verify the OTP for the given phone number.
 * Returns true if valid, throws on failure.
 */
export function verifyOtp(phone, otp) {
  const normalizedPhone = String(phone).trim();
  const entry = store.get(normalizedPhone);

  if (!entry) {
    const err = new Error("No OTP found for this number. Please request a new OTP.");
    err.statusCode = 400;
    throw err;
  }

  // Check expiry
  if (Date.now() > entry.expiresAt) {
    store.delete(normalizedPhone);
    const err = new Error("OTP has expired. Please request a new one.");
    err.statusCode = 410;
    throw err;
  }

  // Check max attempts
  if (entry.attempts >= MAX_ATTEMPTS) {
    store.delete(normalizedPhone);
    const err = new Error("Too many failed attempts. Please request a new OTP.");
    err.statusCode = 429;
    throw err;
  }

  // Increment attempts
  entry.attempts += 1;

  if (entry.otp !== String(otp).trim()) {
    const remaining = MAX_ATTEMPTS - entry.attempts;
    const err = new Error(`Invalid OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`);
    err.statusCode = 401;
    throw err;
  }

  // OTP is valid — remove from store
  store.delete(normalizedPhone);
  return true;
}

// Periodic cleanup of expired entries
setInterval(() => {
  const now = Date.now();
  for (const [phone, entry] of store) {
    if (now > entry.expiresAt) {
      store.delete(phone);
    }
  }
}, CLEANUP_INTERVAL_MS);

export default { createOtp, verifyOtp };
