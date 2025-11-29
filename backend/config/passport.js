const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

passport.use(
  new LocalStrategy({ usernameField: 'username', passwordField: 'password' }, async (username, password, done) => {
    try {
      // Allow login with either email or username field
      const user = await User.findOne({ email: username }).select('+password');
      if (!user) return done(null, false, { message: 'Incorrect email or password.' });
      const isMatch = await user.comparePassword(password);
      if (!isMatch) return done(null, false, { message: 'Incorrect email or password.' });
      if (!user.isActive) return done(null, false, { message: 'Account is inactive.' });
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
