import { NavLink, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { clearStoredAuth, getStoredUser } from "../services/api";
import Logo from "./Logo";

const adminNavItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/admin/students", label: "Students", icon: "groups" },
  { to: "/admin/courses", label: "Courses", icon: "library_books" },
  { to: "/admin/exams", label: "Exams", icon: "assignment" },
  { to: "/admin/questions", label: "Questions", icon: "help" },
  { to: "/admin/results", label: "Results", icon: "analytics" },
  { to: "/admin/certificates", label: "Certificates", icon: "workspace_premium" },
  { to: "/admin/profile", label: "Settings", icon: "manage_accounts" },
];

const studentNavItems = [
  { to: "/student/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/student/exams", label: "Exams", icon: "quiz" },
  { to: "/student/certificates", label: "Certificates", icon: "workspace_premium" },
  { to: "/student/profile", label: "Profile", icon: "person" },
];

function Sidebar({ role, collapsed, isMobile, onClose, profilePhoto }) {
  const navigate = useNavigate();
  const user = getStoredUser();
  const navItems = role === "admin" ? adminNavItems : studentNavItems;

  const handleLogout = () => {
    clearStoredAuth();
    navigate("/login", { replace: true });
  };

  const sidebarWidth = collapsed ? "w-[70px]" : "w-[240px]";
  const mobileWidth = "w-64";

  return (
    <aside 
      className={`
        sidebar bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out
        ${isMobile ? mobileWidth : `${sidebarWidth} fixed top-0 left-0 z-40`}
      `}
    >
      <div className="flex h-full flex-col px-4 py-6">
        {/* Header Section */}
        <div className={`mb-8 flex items-center ${collapsed && !isMobile ? "justify-center" : "justify-between"}`}>
          {!collapsed || isMobile ? (
            <div className="flex items-center text-white">
              <Logo variant="full" className="h-10 w-auto" theme="dark" />
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 p-1">
              <Logo variant="icon" className="h-full w-full" theme="dark" />
            </div>
          )}
          
          {isMobile && (
            <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
              <span className="material-icons">close</span>
            </button>
          )}
        </div>

        {/* User Info - Hidden when collapsed */}
        {(!collapsed || isMobile) && (
          <div className="mb-8 rounded-2xl bg-slate-800/50 p-4 border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-600/20 overflow-hidden">
                {profilePhoto || user?.profilePhoto ? (
                 <img src={profilePhoto || user?.profilePhoto} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                   user?.name?.charAt(0) || (role === "admin" ? "A" : "S")
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold">
                  {role === "admin" ? "Administrator" : "Student"}
                </p>
                <p className="mt-0.5 text-sm font-bold truncate text-white">{user?.name || (role === "admin" ? "Admin" : "Learner")}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 group relative overflow-hidden ${
                  isActive 
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                } ${collapsed && !isMobile ? "justify-center px-0 border-l-0" : ""}`
              }
              title={collapsed && !isMobile ? item.label : ""}
            >
              <span className={`material-icons relative z-10 ${collapsed && !isMobile ? "text-2xl" : "text-xl"} ${collapsed && !isMobile ? "" : ""}`}>
                {item.icon}
              </span>
              {(!collapsed || isMobile) && (
               <span className="relative z-10 truncate tracking-wide">{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="mt-auto pt-6 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-400 transition-all duration-200 hover:bg-rose-500/10 hover:text-rose-500 group
              ${collapsed && !isMobile ? "justify-center px-0" : ""}
            `}
            title={collapsed && !isMobile ? "Logout" : ""}
          >
            <span className="material-icons text-xl group-hover:-translate-x-1 transition-transform">logout</span>
            {(!collapsed || isMobile) && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}

Sidebar.propTypes = {
  role: PropTypes.oneOf(["admin", "student"]).isRequired,
  collapsed: PropTypes.bool,
  isMobile: PropTypes.bool,
  onClose: PropTypes.func,
  profilePhoto: PropTypes.string,
};

export default Sidebar;
