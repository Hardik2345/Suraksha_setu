const User = require('../../../../models/User');
const passport = require('../../../../config/passport');

async function registerUser(payload) {
  const { name, email, password, passwordConfirm, phone, role } = payload;

  if (!name || !email || !password) {
    return { status: 400, body: { message: 'Missing required fields' } };
  }

  if (password !== passwordConfirm) {
    return { status: 400, body: { message: 'Passwords do not match' } };
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return { status: 400, body: { message: 'Email already registered' } };
  }

  const user = await User.create({ name, email, password, phone, role: role || 'citizen' });
  return {
    status: 201,
    body: {
      message: 'Registration successful',
      user: { id: user._id, email: user.email, name: user.name },
    },
  };
}

function authenticate(req, res, next) {
  return new Promise((resolve, reject) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) return reject(err);
      if (!user) {
        resolve({ status: 401, body: { message: info.message || 'Authentication failed' } });
        return;
      }

      req.logIn(user, (loginErr) => {
        if (loginErr) return reject(loginErr);
        req.session.save((sessionErr) => {
          if (sessionErr) return reject(sessionErr);

          resolve({
            status: 200,
            body: {
              message: 'Login successful',
              user: { id: user._id, email: user.email, name: user.name, role: user.role },
            },
          });
        });
      });
    })(req, res, next);
  });
}

function logout(req) {
  return new Promise((resolve, reject) => {
    req.logout((err) => {
      if (err) return reject(err);
      resolve({ status: 200, body: { message: 'Logged out' } });
    });
  });
}

function getCurrentProfile(user) {
  if (!user) {
    return { status: 401, body: { message: 'Not authenticated' } };
  }

  return {
    status: 200,
    body: {
      user: { id: user._id, name: user.name, email: user.email, role: user.role, location: user.location },
    },
  };
}

async function updateCurrentUserLocation(user, payload) {
  if (!user) {
    return { status: 401, body: { message: 'Not authenticated' } };
  }

  const { location } = payload || {};
  if (!location || location.type !== 'Point' || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
    return { status: 400, body: { message: 'A valid GeoJSON location is required' } };
  }

  const [lng, lat] = location.coordinates.map(Number);
  if (Number.isNaN(lng) || Number.isNaN(lat)) {
    return { status: 400, body: { message: 'Location coordinates must be numeric' } };
  }

  user.location = {
    type: 'Point',
    coordinates: [lng, lat],
    address: location.address,
    city: location.city,
    state: location.state,
    pincode: location.pincode,
  };
  await user.save();

  return {
    status: 200,
    body: {
      message: 'Location updated successfully',
      user: { id: user._id, name: user.name, email: user.email, role: user.role, location: user.location },
    },
  };
}

module.exports = {
  registerUser,
  authenticate,
  logout,
  getCurrentProfile,
  updateCurrentUserLocation,
};
