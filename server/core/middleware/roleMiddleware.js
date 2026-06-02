export function authorize(...roles) {
  return function roleGuard(req, res, next) {
    const role = req.user?.role;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return next();
  };
}
