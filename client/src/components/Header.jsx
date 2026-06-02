import { useLocation } from "react-router-dom";

import { clearStoredAuth, getStoredUser } from "../services/api";

const pageTitles = {
  "/student/dashboard": "Dashboard",
  "/student/exams": "Exams",
  "/student/certificates": "Certificates",
  "/student/profile": "Profile",
};

function Header() {
  const location = useLocation();
  const user = getStoredUser();
  const pageTitle = pageTitles[location.pathname] || "Student Portal";

  const handleLogout = () => {
    clearStoredAuth();
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-20 h-[60px] border-b border-slate-200 bg-white px-6 shadow-sm">
      <div className="flex h-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-grayText">Welcome back</p>
          <h2 className="font-heading text-2xl text-primary">{pageTitle}</h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs uppercase tracking-[0.25em] text-grayText">Student</p>
            <p className="mt-1 text-sm font-semibold text-dark">{user?.name || "EME Learner"}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-primary shadow-sm transition hover:bg-slate-50"
          >
            <span className="material-icons">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
