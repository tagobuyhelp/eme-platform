import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useLocation, useNavigate } from "react-router-dom";

import api, { setStoredAuth } from "../../services/api";
import Logo from "../../components/Logo";
import InputField from "../../components/InputField";
import Button from "../../components/Button";

function Login({ defaultRole = "student" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const requestedRole = new URLSearchParams(location.search).get("role") || location.state?.from?.role || defaultRole;

  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Force Admin to Login tab
  useEffect(() => {
    if (requestedRole === "admin") {
      setIsLogin(true);
    }
  }, [requestedRole]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      let response;

      if (isLogin) {
        response = await api.post("/auth/login", { email, password });
      } else {
        response = await api.post("/auth/register", { name: fullName, email, password, role: "student" });
        // Automatically create a blank student profile linked to this user
        const newUserId = response.data.user.id;
        try {
          await api.post("/students", {
            userId: newUserId,
            fullName: fullName,
            email: email,
            status: "pending"
          }, {
            headers: { Authorization: `Bearer ${response.data.token}` }
          });
        } catch(err) {
          console.warn("Failed to auto-create profile, student will be prompted to create it later", err);
        }
      }

      const { token, user } = response.data;
      setStoredAuth({ token, user });

      if (user.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
        return;
      }

      navigate("/student/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || `Failed to ${isLogin ? 'login' : 'register'}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-slate-50 dark:bg-dark-bg">
      {/* Left Section - Hero/Brand Panel */}
      <div 
        className="hidden lg:flex lg:w-[45%] flex-col items-center justify-center p-12 text-white relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('/asset/images/eme-students-in-class.webp')" }}
      >
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-indigo-950/75 backdrop-blur-[2px]"></div>
        
        {/* Dynamic Glass Circles to keep it modern */}
        <div className="absolute top-[-5%] left-[-10%] w-72 h-72 rounded-full bg-white/10 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[10%] right-[-5%] w-96 h-96 rounded-full bg-[#26C1D3]/30 blur-3xl"></div>
        
        <div className="relative z-10 w-full max-w-md">
          <Logo variant="full" className="h-20 w-auto mb-10 brightness-0 invert drop-shadow-md" />
          
          <h2 className="font-heading text-5xl font-extrabold mb-6 tracking-tight leading-tight drop-shadow-md">
            {isLogin ? "Unlock your academic potential." : "Enroll in excellence today."}
          </h2>
          <p className="text-lg text-white/90 font-medium mb-12 drop-shadow-sm">
            Join thousands of scholars. Access a world-class curriculum, expert mentorship, and industry-recognized certifications.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20 shadow-xl">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <span className="material-icons text-white">menu_book</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white">Comprehensive Curriculum</p>
                <p className="text-xs text-indigo-100">Thousands of study materials</p>
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
        </div>
      </div>

      {/* Right Section - Auth Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 lg:p-20 relative">
        
        {/* Mobile Logo */}
        <div className="lg:hidden flex justify-center mb-8 w-full">
          <Logo variant="full" className="h-16 w-auto" />
        </div>

        <div className="w-full max-w-md w-full">
          
          {/* Tab Switcher (Only show if not admin) */}
          {requestedRole !== "admin" && (
            <div className="flex bg-slate-200/50 dark:bg-slate-800 p-1.5 rounded-2xl mb-8 border border-slate-200 dark:border-slate-700 relative">
               <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white dark:bg-slate-700 rounded-xl shadow-sm transition-transform duration-300 ease-in-out ${isLogin ? "translate-x-0" : "translate-x-full ml-[6px]"}`}></div>
               <button 
                 type="button"
                 onClick={() => { setIsLogin(true); setError(""); }}
                 className={`flex-1 py-3 text-sm font-bold z-10 transition-colors ${isLogin ? 'text-indigo-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
               >
                 Sign In
               </button>
               <button 
                 type="button"
                 onClick={() => { setIsLogin(false); setError(""); }}
                 className={`flex-1 py-3 text-sm font-bold z-10 transition-colors ${!isLogin ? 'text-indigo-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
               >
                 Create Account
               </button>
            </div>
          )}

          <div className="bg-white dark:bg-dark-card rounded-3xl shadow-2xl shadow-indigo-500/5 p-8 md:p-10 border border-slate-100 dark:border-gray-800 transition-all duration-300 relative overflow-hidden">
            {/* Subtle top border accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-accent"></div>

            <div className="mb-8 text-center lg:text-left">
              <h1 className="font-heading text-3xl font-extrabold text-slate-900 dark:text-white">
                {requestedRole === "admin" ? "Admin Access" : (isLogin ? "Welcome Back" : "Join EME Academy")}
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-gray-400 font-medium">
                {requestedRole === "admin" ? "Secure login for administrators" : (isLogin ? "Enter your credentials to access your portal" : "Fill in your details to get started")}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Register only field */}
              {!isLogin && (
                <div className="animate-slide-up">
                  <InputField
                    label="Full Name"
                    icon="person_outline"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={!isLogin}
                  />
                </div>
              )}

              <InputField
                label="Email Address"
                icon="alternate_email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <div className="space-y-2">
                <InputField
                  label="Password"
                  icon="lock_outline"
                  type="password"
                  placeholder={isLogin ? "Enter your password" : "Create a strong password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
                
                {isLogin && (
                  <div className="flex justify-between items-center px-1">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                      <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 transition-colors">Remember me</span>
                    </label>
                    <button type="button" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                      Forgot Password?
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <div className="rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700 border border-rose-100 flex items-center gap-3 animate-slide-up">
                  <span className="material-icons text-[20px]">error_outline</span>
                  {error}
                </div>
              )}

              <Button
                type="submit"
                loading={loading}
                className="w-full !py-4 !rounded-2xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 font-bold text-[15px] mt-4"
              >
                {isLogin ? "Sign In Securely" : "Create My Account"}
              </Button>
            </form>
          </div>
          
        </div>

        {/* Footer */}
        <div className="mt-auto pt-8 w-full text-center flex flex-col sm:flex-row justify-between items-center gap-4 max-w-screen-xl mx-auto">
          <p className="text-xs font-bold text-slate-400">© 2026 EME Academy. All rights reserved.</p>
          
          {/* Discreet Admin Link */}
          {requestedRole !== "admin" && (
            <button 
              onClick={() => navigate('/login?role=admin')}
              className="text-[10px] font-bold text-slate-300 hover:text-slate-500 uppercase tracking-widest transition-colors flex items-center gap-1"
            >
              <span className="material-icons text-[12px]">admin_panel_settings</span>
              Admin Access
            </button>
          )}
          {requestedRole === "admin" && (
            <button 
              onClick={() => navigate('/')}
              className="text-[10px] font-bold text-indigo-400 hover:text-indigo-600 uppercase tracking-widest transition-colors flex items-center gap-1"
            >
              <span className="material-icons text-[12px]">school</span>
              Student Portal
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

Login.propTypes = {
  defaultRole: PropTypes.string,
};

export default Login;
