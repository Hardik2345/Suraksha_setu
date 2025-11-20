const User = require('../models/User');
const passport = require('../config/passport');

exports.getRegister = (req, res) => {
  // Render placeholder or return JSON for API-backed frontend
  res.status(200).json({ message: 'Register endpoint (POST /register) available' });
};

exports.postRegister = async (req, res, next) => {
  try {
    const { name, email, password, passwordConfirm, phone, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing required fields' });
    if (password !== passwordConfirm) return res.status(400).json({ message: 'Passwords do not match' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password, phone, role: role || 'citizen' });
    res.status(201).json({ message: 'Registration successful', user: { id: user._id, email: user.email, name: user.name } });
  } catch (err) {
    next(err);
  }
};

exports.getLogin = (req, res) => {
  res.status(200).json({ message: 'Login endpoint (POST /login) available' });
};

exports.postLogin = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ message: info.message || 'Authentication failed' });
    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.json({ message: 'Login successful', user: { id: user._id, email: user.email, name: user.name, role: user.role } });
    });
  })(req, res, next);
};

exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.json({ message: 'Logged out' });
  });
};

exports.getProfile = (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role } });
};
