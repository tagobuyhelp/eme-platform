/**
 * SMS Service — MSG91 OTP Widget Integration
 * -------------------------------------------
 * OTP generation, DLT template management, and SMS delivery are handled
 * directly via MSG91 OTP Widget on the client side (no DLT Registration required).
 * 
 * Server side verifies the generated access token via `verifyMsg91WidgetToken`.
 * In development mode (without Widget ID), test OTPs are logged to console.
 */

/**
 * Send an OTP SMS to the given phone number (Development/Fallback helper).
 * @param {string} phone  — 10-digit Indian mobile number
 * @param {string} otp    — The 6-digit OTP to send
 */
export async function sendOtpSms(phone, otp) {
  const cleanPhone = String(phone).replace(/\D/g, "").slice(-10);

  // Log to console for dev testing
  console.log(`\n📱 [DEV OTP] Mobile: ${cleanPhone} | OTP Code: ${otp}\n`);

  const authKey = process.env.MSG91_AUTH_KEY;

  if (!authKey || authKey === "your_auth_key_here") {
    console.warn("⚠️  MSG91_AUTH_KEY not configured. OTP logged to console only.");
    return { success: true, dev: true };
  }

  // Development mode fallback indicator
  return { success: true, dev: true };
}

export default { sendOtpSms };
