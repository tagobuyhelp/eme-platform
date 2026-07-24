import { NavLink } from "react-router-dom";
import PropTypes from "prop-types";

const studentNavItems = [
  { to: "/student/dashboard", label: "Home", icon: "dashboard" },
  { to: "/student/exams", label: "Exams", icon: "quiz" },
  { to: "/student/certificates", label: "Certificates", icon: "workspace_premium" },
  { to: "/student/profile", label: "Profile", icon: "person" },
];

const adminNavItems = [
  { to: "/admin/dashboard", label: "Home", icon: "dashboard" },
  { to: "/admin/students", label: "Students", icon: "groups" },
  { to: "/admin/exams", label: "Exams", icon: "assignment" },
  { isMenu: true, label: "Menu", icon: "menu" },
];

function MobileNav({ role, onMenuClick }) {
  const items = role === "admin" ? adminNavItems : studentNavItems;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800/80 z-40 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
      <div className="flex justify-around items-center h-16 relative">
        {items.map((item, idx) => {
          if (item.isMenu) {
            return (
              <button
                key="menu"
                onClick={onMenuClick}
                className="flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <span className="material-icons text-xl">{item.icon}</span>
                <span className="text-[10px] font-extrabold mt-0.5">{item.label}</span>
              </button>
            );
          }
          
          return (
            <NavLink
              key={idx}
              to={item.to}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center w-full h-full transition-all duration-200 ${
                  isActive ? "text-eme-orange dark:text-eme-orange" : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute top-0 h-1 w-8 rounded-b-full bg-eme-orange shadow-sm shadow-eme-orange/50"></span>
                  )}
                  <div className={`relative flex items-center justify-center transition-transform duration-200 ${isActive ? "-translate-y-0.5" : ""}`}>
                     <span className={`material-icons text-2xl transition-transform ${isActive ? "scale-110 drop-shadow-md text-eme-orange" : ""}`}>{item.icon}</span>
                  </div>
                  <span className={`text-[10px] tracking-tight mt-0.5 ${isActive ? "font-black" : "font-semibold"}`}>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

MobileNav.propTypes = {
  role: PropTypes.string.isRequired,
  onMenuClick: PropTypes.func,
};

export default MobileNav;
