export default function errorMiddleware(err, req, res, next) {
  const statusCode = err?.statusCode || err?.status || 500;
  const message = err?.message || "Internal Server Error";

  if (res.headersSent) {
    return next(err);
  }

  return res.status(statusCode).json({ message });
}
