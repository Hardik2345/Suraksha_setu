const authService = require('../../application/auth.service');

exports.postRegister = async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);
    res.status(result.status).json(result.body);
  } catch (err) {
    next(err);
  }
};

exports.postLogin = async (req, res, next) => {
  try {
    const result = await authService.authenticate(req, res, next);
    res.status(result.status).json(result.body);
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const result = await authService.logout(req);
    res.status(result.status).json(result.body);
  } catch (err) {
    next(err);
  }
};

exports.getProfile = (req, res) => {
  const result = authService.getCurrentProfile(req.user);
  res.status(result.status).json(result.body);
};

exports.updateLocation = async (req, res, next) => {
  try {
    const result = await authService.updateCurrentUserLocation(req.user, req.body);
    res.status(result.status).json(result.body);
  } catch (err) {
    next(err);
  }
};
