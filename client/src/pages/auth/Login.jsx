import { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { useLocation, useNavigate } from "react-router-dom";

import api, { setStoredAuth } from "../../services/api";
import Logo from "../../components/Logo";
import InputField from "../../components/InputField";
import Button from "../../components/Button";

// ─── OTP Input Component ─────────────────────────────────────────────
function OtpInput({ length = 6, value, onChange, disabled }) {
  const inputsRef = useRef([]);

  const handleChange = (e, idx) => {
    const val = e.target.value.replace(/\D/g, "");
    if (!val) return;
    const newOtp = value.split("");
    newOtp[idx] = val.slice(-1);
    onChange(newOtp.join(""));
    if (idx < length - 1) inputsRef.current[idx + 1]?.focus();
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newOtp = value.split("");
      if (newOtp[idx]) {
        newOtp[idx] = "";
        onChange(newOtp.join(""));
      } else if (idx > 0) {
        newOtp[idx - 1] = "";
        onChange(newOtp.join(""));
        inputsRef.current[idx - 1]?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(pasted.padEnd(length, "").slice(0, length));
    const nextIdx = Math.min(pasted.length, length - 1);
    inputsRef.current[nextIdx]?.focus();
  };

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          value={value[i] || ""}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={i === 0 ? handlePaste : undefined}
          className={`
            w-12 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all duration-200
            bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-white
            focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:scale-110
            ${value[i] ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30" : "border-slate-200 dark:border-slate-700"}
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
}
OtpInput.propTypes = { length: PropTypes.number, value: PropTypes.string, onChange: PropTypes.func, disabled: PropTypes.bool };

// ─── Main Login Component ────────────────────────────────────────────
function Login({ defaultRole = "student" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const requestedRole = new URLSearchParams(location.search).get("role") || location.state?.from?.role || defaultRole;
  const isAdmin = requestedRole === "admin";

  // Admin state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Student OTP state
  const [step, setStep] = useState("phone"); // "phone" | "otp"
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // ─── Admin Login ───────────────────────────────
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      const res = await api.post("/auth/login", { email, password });
      setStoredAuth({ token: res.data.token, user: res.data.user });
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // ─── Student: Send OTP ─────────────────────────
  const handleSendOtp = useCallback(async (e) => {
    if (e) e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await api.post("/auth/send-otp", { phone: cleanPhone });
      setStep("otp");
      setOtp("");
      setCooldown(60);
      setSuccess("OTP sent to +91 " + cleanPhone);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }, [phone]);

  // ─── Student: Verify OTP ──────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const cleanOtp = otp.replace(/\D/g, "");
    if (cleanOtp.length !== 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await api.post("/auth/verify-otp", {
        phone: phone.replace(/\D/g, ""),
        otp: cleanOtp,
        name: fullName.trim() || undefined,
      });
      setStoredAuth({ token: res.data.token, user: res.data.user });
      navigate("/student/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  // ─── Left Panel (shared) ──────────────────────
  const leftPanel = (
    <div
      className="hidden lg:flex lg:w-[45%] flex-col items-center justify-center p-12 text-white relative overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: "url('/asset/images/eme-students-in-class.webp')" }}
    >
      <div className="absolute inset-0 bg-indigo-950/75 backdrop-blur-[2px]"></div>
      <div className="absolute top-[-5%] left-[-10%] w-72 h-72 rounded-full bg-white/10 blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[10%] right-[-5%] w-96 h-96 rounded-full bg-[#26C1D3]/30 blur-3xl"></div>

      <div className="relative z-10 w-full max-w-md">
        <Logo variant="full" className="h-20 w-auto mb-10 brightness-0 invert drop-shadow-md" />

        <h2 className="font-heading text-5xl font-extrabold mb-6 tracking-tight leading-tight drop-shadow-md">
          {isAdmin ? "Administrator Portal" : "Unlock your academic potential."}
        </h2>
        <p className="text-lg text-white/90 font-medium mb-12 drop-shadow-sm">
          {isAdmin
            ? "Secure access for platform administrators."
            : "Join thousands of scholars. Access a world-class curriculum, expert mentorship, and industry-recognized certifications."}
        </p>

        {!isAdmin && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20 shadow-xl">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <span className="material-icons text-white">phone_android</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white">Quick OTP Login</p>
                <p className="text-xs text-indigo-100">No password needed — just your phone</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20 translate-x-4 shadow-xl">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <span className="material-icons text-white">workspace_premium</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white">Accredited Programs</p>
                <p className="text-xs text-indigo-100">Earn verifiable digital credentials</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ─── Render ────────────────────────────────────
  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-slate-50 dark:bg-dark-bg">
      {leftPanel}

      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 lg:p-20 relative">
        <div className="lg:hidden flex justify-center mb-8 w-full">
          <Logo variant="full" className="h-16 w-auto" />
        </div>

        <div className="w-full max-w-md">
          {/* ─── ADMIN FORM ─── */}
          {isAdmin && (
            <div className="bg-white dark:bg-dark-card rounded-3xl shadow-2xl shadow-indigo-500/5 p-8 md:p-10 border border-slate-100 dark:border-gray-800 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-accent"></div>
              <div className="mb-8 text-center lg:text-left">
                <h1 className="font-heading text-3xl font-extrabold text-slate-900 dark:text-white">Admin Access</h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-gray-400 font-medium">Secure login for administrators</p>
              </div>
              <form onSubmit={handleAdminLogin} className="space-y-5">
                <InputField label="Email Address" icon="alternate_email" type="email" placeholder="admin@eme.local" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                <InputField label="Password" icon="lock_outline" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
                {error && (
                  <div className="rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700 border border-rose-100 flex items-center gap-3 animate-slide-up">
                    <span className="material-icons text-[20px]">error_outline</span>{error}
                  </div>
                )}
                <Button type="submit" loading={loading} className="w-full !py-4 !rounded-2xl shadow-lg shadow-indigo-500/20 font-bold text-[15px] mt-4">Sign In Securely</Button>
              </form>
            </div>
          )}

          {/* ─── STUDENT OTP FORM ─── */}
          {!isAdmin && (
            <div className="bg-white dark:bg-dark-card rounded-3xl shadow-2xl shadow-indigo-500/5 p-8 md:p-10 border border-slate-100 dark:border-gray-800 relative overflow-hidden transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-accent"></div>

              {/* Step 1: Phone Number */}
              {step === "phone" && (
                <div className="animate-slide-up">
                  <div className="mb-8 text-center lg:text-left">
                    <h1 className="font-heading text-3xl font-extrabold text-slate-900 dark:text-white">Welcome to EME</h1>
                    <p className="mt-2 text-sm text-slate-500 dark:text-gray-400 font-medium">Enter your mobile number to sign in or create an account</p>
                  </div>
                  <form onSubmit={handleSendOtp} className="space-y-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">Mobile Number</label>
                      <div className="relative flex">
                        <div className="flex items-center gap-1.5 px-4 rounded-l-xl border-2 border-r-0 border-slate-200 bg-slate-100 dark:bg-slate-800 dark:border-slate-700">
                          <span className="text-lg">🇮🇳</span>
                          <span className="text-sm font-bold text-slate-600 dark:text-slate-300">+91</span>
                        </div>
                        <input
                          type="tel"
                          inputMode="numeric"
                          placeholder="Enter 10 digit number"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          required
                          maxLength={10}
                          className="flex-1 rounded-r-xl border-2 border-slate-200 bg-slate-50 text-slate-900 outline-none transition-all duration-200 py-3.5 px-4 text-sm font-medium tracking-wider focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="animate-slide-up">
                      <InputField label="Full Name (for new students)" icon="person_outline" type="text" placeholder="Enter your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                      <p className="text-[11px] text-slate-400 mt-1.5 ml-1">Leave blank if you already have an account</p>
                    </div>

                    {error && (
                      <div className="rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700 border border-rose-100 flex items-center gap-3 animate-slide-up">
                        <span className="material-icons text-[20px]">error_outline</span>{error}
                      </div>
                    )}

                    <Button type="submit" loading={loading} disabled={phone.replace(/\D/g, "").length !== 10} className="w-full !py-4 !rounded-2xl shadow-lg shadow-indigo-500/20 font-bold text-[15px] mt-4">
                      <span className="material-icons text-[20px]">send</span>
                      Send OTP
                    </Button>
                  </form>
                </div>
              )}

              {/* Step 2: OTP Verification */}
              {step === "otp" && (
                <div className="animate-slide-up">
                  <div className="mb-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-4">
                      <span className="material-icons text-3xl text-indigo-600">sms</span>
                    </div>
                    <h1 className="font-heading text-3xl font-extrabold text-slate-900 dark:text-white">Verify OTP</h1>
                    <p className="mt-2 text-sm text-slate-500 dark:text-gray-400 font-medium">
                      We sent a 6-digit code to <span className="font-bold text-indigo-600">+91 {phone}</span>
                    </p>
                  </div>

                  <form onSubmit={handleVerifyOtp} className="space-y-6">
                    <OtpInput value={otp} onChange={setOtp} disabled={loading} />

                    {/* Timer + Resend */}
                    <div className="text-center">
                      {cooldown > 0 ? (
                        <p className="text-sm text-slate-400 font-medium">
                          Resend OTP in <span className="font-bold text-indigo-600 tabular-nums">{cooldown}s</span>
                        </p>
                      ) : (
                        <button type="button" onClick={handleSendOtp} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors underline underline-offset-4">
                          Resend OTP
                        </button>
                      )}
                    </div>

                    {success && !error && (
                      <div className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700 border border-emerald-100 flex items-center gap-3 animate-slide-up">
                        <span className="material-icons text-[20px]">check_circle</span>{success}
                      </div>
                    )}

                    {error && (
                      <div className="rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700 border border-rose-100 flex items-center gap-3 animate-slide-up">
                        <span className="material-icons text-[20px]">error_outline</span>{error}
                      </div>
                    )}

                    <Button type="submit" loading={loading} disabled={otp.replace(/\D/g, "").length !== 6} className="w-full !py-4 !rounded-2xl shadow-lg shadow-indigo-500/20 font-bold text-[15px]">
                      <span className="material-icons text-[20px]">verified</span>
                      Verify & Continue
                    </Button>

                    <button type="button" onClick={() => { setStep("phone"); setOtp(""); setError(""); setSuccess(""); }} className="w-full text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors flex items-center justify-center gap-1">
                      <span className="material-icons text-[16px]">arrow_back</span>
                      Change Number
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-8 w-full text-center flex flex-col sm:flex-row justify-between items-center gap-4 max-w-screen-xl mx-auto">
          <p className="text-xs font-bold text-slate-400">© 2026 EME Academy. All rights reserved.</p>
          {!isAdmin && (
            <button onClick={() => navigate("/login?role=admin")} className="text-[10px] font-bold text-slate-300 hover:text-slate-500 uppercase tracking-widest transition-colors flex items-center gap-1">
              <span className="material-icons text-[12px]">admin_panel_settings</span>Admin Access
            </button>
          )}
          {isAdmin && (
            <button onClick={() => navigate("/")} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-600 uppercase tracking-widest transition-colors flex items-center gap-1">
              <span className="material-icons text-[12px]">school</span>Student Portal
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

Login.propTypes = { defaultRole: PropTypes.string };

export default Login;
