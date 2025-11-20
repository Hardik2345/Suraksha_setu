exports.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return res.status(401).json({ message: 'Please login to access this resource' });
};

exports.isAdmin = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated() && req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Admin privileges required' });
};

exports.redirectIfAuthenticated = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) return res.status(200).json({ message: 'Already authenticated' });
  next();
};
