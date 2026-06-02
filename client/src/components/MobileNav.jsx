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
    <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-40 pb-safe shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
      <div className="flex justify-around items-center h-16">
        {items.map((item, idx) => {
          if (item.isMenu) {
            return (
              <button
                key="menu"
                onClick={onMenuClick}
                className="flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <span className="material-icons text-xl">{item.icon}</span>
                <span className="text-[10px] font-bold mt-0.5">{item.label}</span>
              </button>
            );
          }
          
          return (
            <NavLink
              key={idx}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full h-full transition-colors ${
                  isActive ? "text-indigo-600" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative flex items-center justify-center">
                     <span className={`material-icons text-xl transition-transform ${isActive ? "scale-110 drop-shadow-md" : ""}`}>{item.icon}</span>
                  </div>
                  <span className={`text-[10px] mt-0.5 ${isActive ? "font-bold" : "font-medium"}`}>{item.label}</span>
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
