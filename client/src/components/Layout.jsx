import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import MobileNav from "./MobileNav";
import { useTheme } from "../hooks/useTheme";

function Layout({ role = "student" }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => setCollapsed(!collapsed);
  const toggleMobileDrawer = () => setMobileOpen(!mobileOpen);

  const [student, setStudent] = useState(null);

  useEffect(() => {
    if (role === "student") {
      import("../services/api").then(({ default: api }) => {
        api.get("/students/me")
          .then((res) => setStudent(res.data.student))
          .catch(() => {});
      });
    }
  }, [role]);

  return (
    <div className="flex bg-app">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block">
        <Sidebar 
          role={role} 
          collapsed={collapsed} 
          profilePhoto={student?.profilePhoto}
        />
      </div>

      {/* Sidebar - Mobile Drawer */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div 
            className="fixed top-0 left-0 h-full w-64 shadow-2xl transition-transform duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar 
              role={role} 
              isMobile={true} 
              onClose={() => setMobileOpen(false)} 
              profilePhoto={student?.profilePhoto}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div 
        className={`flex flex-1 flex-col transition-all duration-300 min-h-screen ${
          collapsed ? "lg:ml-[70px]" : "lg:ml-[240px]"
        }`}
      >
        <Topbar 
          role={role} 
          toggleSidebar={toggleSidebar} 
          toggleMobileDrawer={toggleMobileDrawer}
          theme={theme}
          toggleTheme={toggleTheme}
          profilePhoto={student?.profilePhoto}
        />
        
        {/* pb-20 on mobile prevents content from being hidden behind bottom nav */}
        <main className="content flex-1 pb-20 lg:pb-0">
          <Outlet />
        </main>
        
        {/* Bottom Navigation - Mobile Only */}
        <MobileNav role={role} onMenuClick={toggleMobileDrawer} />
      </div>
    </div>
  );
}

Layout.propTypes = {
  role: PropTypes.oneOf(["admin", "student"]),
};

export default Layout;
