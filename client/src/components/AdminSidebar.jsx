import { NavLink, useNavigate } from "react-router-dom";
import { clearStoredAuth, getStoredUser } from "../services/api";

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/admin/students", label: "Students", icon: "groups" },
  { to: "/admin/courses", label: "Courses", icon: "library_books" },
  { to: "/admin/exams", label: "Exams", icon: "assignment" },
  { to: "/admin/questions", label: "Questions", icon: "help" },
  { to: "/admin/results", label: "Results", icon: "analytics" },
  { to: "/admin/certificates", label: "Certificates", icon: "workspace_premium" },
];

function AdminSidebar() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const handleLogout = () => {
    clearStoredAuth();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="w-full bg-slate-900 border-r border-slate-800 text-white lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-[240px]">
      <div className="flex h-full flex-col px-5 py-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-indigo-400">EME Platform</p>
          <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight">Admin Panel</h1>
          <p className="mt-2 text-sm text-slate-400 font-medium leading-relaxed">
            Manage operations, assessments, certificates, and platform performance.
          </p>
        </div>

        <div className="mt-8 rounded-2xl bg-slate-800/50 p-4 border border-slate-700/50">
          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Administrator</p>
          <p className="mt-1 text-lg font-bold text-white truncate">{user?.name || "Admin User"}</p>
          <p className="text-xs font-medium text-slate-400 truncate">{user?.email || "admin@emeplatform.com"}</p>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                  isActive ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <span className="material-icons text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 flex items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-800/30 px-4 py-3.5 text-sm font-bold text-slate-300 transition-all hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30"
        >
          <span className="material-icons text-lg">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;
