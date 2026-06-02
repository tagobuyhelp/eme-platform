import PropTypes from "prop-types";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { getStoredUser, hasStoredAuth } from "../services/api";

function RoleRoute({ role }) {
  const location = useLocation();
  const hasToken = hasStoredAuth();
  const user = getStoredUser();

  if (!hasToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!user || user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

RoleRoute.propTypes = {
  role: PropTypes.string.isRequired,
};

export default RoleRoute;
