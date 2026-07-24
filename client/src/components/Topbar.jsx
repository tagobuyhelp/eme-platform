import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { io } from "socket.io-client";
import { getStoredUser } from "../services/api";

const titles = {
  admin: {
    "/admin/dashboard": "Admin Dashboard",
    "/admin/students": "Student Management",
    "/admin/exams": "Exam Management",
    "/admin/questions": "Question Management",
    "/admin/results": "Results Overview",
    "/admin/certificates": "Certificate Monitoring",
    "/admin/profile": "Admin Settings",
  },
  student: {
    "/student/dashboard": "Dashboard",
    "/student/exams": "Exams",
    "/student/certificates": "Certificates",
    "/student/profile": "Profile",
  }
};

const pageIcons = {
  "/student/dashboard": "dashboard",
  "/student/exams": "quiz",
  "/student/certificates": "workspace_premium",
  "/student/profile": "person",
  "/admin/dashboard": "dashboard",
  "/admin/students": "groups",
  "/admin/exams": "assignment",
  "/admin/questions": "help_center",
  "/admin/results": "analytics",
  "/admin/certificates": "verified",
  "/admin/profile": "admin_panel_settings",
};

function Topbar({ role, toggleSidebar, toggleMobileDrawer, theme, toggleTheme, profilePhoto }) {
  const location = useLocation();
  const user = getStoredUser();
  const pageTitle = titles[role]?.[location.pathname] || (role === "admin" ? "Admin Panel" : "Student Portal");
  const currentIcon = pageIcons[location.pathname] || "auto_awesome";

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [toastAlert, setToastAlert] = useState(null);

  useEffect(() => {
    if (role === "admin") {
      const socketUrl = import.meta.env.PROD ? "/" : (import.meta.env.VITE_SOCKET_URL || "/");
      const socket = io(socketUrl);

      socket.on("connect", () => {
        socket.emit("join_admin");
      });

      socket.on("admin_alert", (payload) => {
        setNotifications((prev) => [payload, ...prev]);
        setUnreadCount((prev) => prev + 1);
        
        setToastAlert(payload);
        setTimeout(() => setToastAlert(null), 5000); // hide after 5s
      });

      return () => socket.disconnect();
    }
  }, [role]);

  return (
    <>
      <header className={`sticky top-0 z-30 flex h-[64px] w-full items-center justify-between px-4 sm:px-6 transition-all duration-300 border-b backdrop-blur-lg ${
        theme === "dark" ? "bg-slate-900/90 border-slate-800/80" : "bg-white/90 border-slate-200/80 shadow-sm"
      }`}>
        <div className="flex items-center gap-3">
          {/* Mobile Menu Toggle */}
          <button 
            onClick={toggleMobileDrawer}
            className={`lg:hidden flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
              theme === "dark" ? "hover:bg-slate-800 text-white" : "hover:bg-slate-100 text-slate-700"
            }`}
          >
            <span className="material-icons">menu</span>
          </button>

          {/* Desktop Sidebar Toggle */}
          <button 
            onClick={toggleSidebar}
            className={`hidden lg:flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
              theme === "dark" ? "hover:bg-slate-800 text-white" : "hover:bg-slate-100 text-slate-700"
            }`}
          >
            <span className="material-icons">menu_open</span>
          </button>

          {/* Page Title with Matching Material Icon */}
          <div className="flex items-center gap-2">
            <span className="material-icons text-xl text-eme-blue dark:text-eme-cyan">{currentIcon}</span>
            <h2 className={`font-heading text-base sm:text-lg font-black tracking-tight leading-none ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
              {pageTitle}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          
          {role === "admin" && (
            <div className="relative">
              <button 
                onClick={() => { setShowDropdown(!showDropdown); setUnreadCount(0); }}
                className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                  theme === "dark" ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span className="material-icons text-[22px]">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse"></span>
                )}
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-3 w-80 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-1.5">
                      <span className="material-icons text-eme-cyan text-sm">notifications</span>
                      Notifications
                    </h3>
                    {notifications.length > 0 && (
                      <button onClick={() => setNotifications([])} className="text-xs text-eme-blue hover:text-eme-navy font-bold">Clear All</button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto no-scrollbar">
                    {notifications.length > 0 ? (
                      notifications.map((notif, idx) => (
                        <div key={idx} className="p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{notif.title}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{notif.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1 font-semibold uppercase">{new Date(notif.time).toLocaleTimeString()}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-slate-400 text-sm font-medium">No new notifications</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleTheme}
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
              theme === "dark" 
                ? "bg-eme-cyan/15 text-eme-cyan hover:bg-eme-cyan/25" 
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            <span className="material-icons text-xl">
              {theme === "dark" ? "light_mode" : "dark_mode"}
            </span>
          </button>

          {/* User Profile Summary */}
          <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/60 p-1.5 pl-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <div className="hidden sm:block text-right">
              <p className={`text-xs font-black truncate max-w-[120px] ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                {user?.name || "User"}
              </p>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-eme-blue dark:text-eme-cyan">
                {role === "admin" ? "Admin" : "Student"}
              </p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-eme-navy to-eme-blue flex items-center justify-center text-white font-black shadow-md shadow-eme-navy/20 overflow-hidden shrink-0 border border-white/20">
              {profilePhoto || user?.profilePhoto ? (
                 <img src={profilePhoto || user?.profilePhoto} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                 user?.name?.charAt(0).toUpperCase() || (role === "admin" ? "A" : "S")
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Global Toast Alert */}
      {toastAlert && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up bg-white rounded-2xl shadow-2xl shadow-indigo-500/20 border border-indigo-100 p-4 max-w-sm flex gap-4 items-start">
           <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
             <span className="material-icons text-indigo-600">notifications_active</span>
           </div>
           <div>
             <h4 className="font-bold text-slate-900 text-sm">{toastAlert.title}</h4>
             <p className="text-slate-600 text-xs mt-1 leading-snug">{toastAlert.message}</p>
           </div>
           <button onClick={() => setToastAlert(null)} className="text-slate-400 hover:text-slate-600 -mr-2">
             <span className="material-icons text-sm">close</span>
           </button>
        </div>
      )}
    </>
  );
}

Topbar.propTypes = {
  role: PropTypes.oneOf(["admin", "student"]).isRequired,
  toggleSidebar: PropTypes.func.isRequired,
  toggleMobileDrawer: PropTypes.func.isRequired,
  theme: PropTypes.string.isRequired,
  toggleTheme: PropTypes.func.isRequired,
  profilePhoto: PropTypes.string,
};

export default Topbar;
