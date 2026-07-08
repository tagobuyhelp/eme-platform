/**
 * SMS Service — Fast2SMS Integration
 * ------------------------------------
 * Sends OTP via Fast2SMS HTTP API.
 * In development mode, OTP is also logged to console.
 */

/**
 * Send an OTP SMS to the given phone number.
 * @param {string} phone  — 10-digit Indian mobile number (without country code)
 * @param {string} otp    — The 6-digit OTP to send
 */
export async function sendOtpSms(phone, otp) {
  const cleanPhone = String(phone).replace(/\D/g, "").slice(-10);

  // Always log in development for easy testing
  console.log(`\n📱 [OTP] Sending OTP to ${cleanPhone}: ${otp}\n`);

  const apiKey = process.env.SMS_API_KEY;

  if (!apiKey || apiKey === "your_api_key_here") {
    console.warn("⚠️  SMS_API_KEY not configured. OTP logged to console only.");
    return { success: true, dev: true };
  }

  try {
    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        "authorization": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "otp",
        variables_values: otp,
        numbers: cleanPhone,
        flash: 0,
      }),
    });

    const data = await response.json();

    if (!data.return) {
      console.error("❌ Fast2SMS error:", data.message || data);
      // Don't throw — OTP is still valid, just not delivered via SMS
      // In production you'd want to throw here
      return { success: false, error: data.message };
    }

    console.log(`✅ OTP SMS sent to ${cleanPhone}`);
    return { success: true };
  } catch (err) {
    console.error("❌ SMS sending failed:", err.message);
    // Don't throw — allow dev testing without SMS
    return { success: false, error: err.message };
  }
}

export default { sendOtpSms };
