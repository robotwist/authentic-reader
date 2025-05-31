// Placeholder monitor middleware
export const requestMonitor = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
};

export const errorMonitor = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, err);
  next(err);
}; 