import PropTypes from "prop-types";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { hasStoredAuth } from "../services/api";

function ProtectedRoute() {
  const location = useLocation();
  const token = hasStoredAuth();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node,
};

export default ProtectedRoute;
