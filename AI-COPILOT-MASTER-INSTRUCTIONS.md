# 🤖 AI COPILOT MASTER INSTRUCTION FILE
## Suraksha Setu - 40% MVP Delivery in 24 Hours

---

## 📖 HOW TO READ THIS FILE (FOR AI ASSISTANTS)

**IMPORTANT:** This document contains phase-by-phase instructions for building a disaster management platform. Each phase has:
1. **PHASE START MARKER**: Where to begin implementation
2. **PHASE END MARKER**: When phase is complete
3. **DEFINITION OF DONE (DoD)**: Acceptance criteria
4. **IMPLEMENTATION GUIDE**: Step-by-step instructions
5. **CRITICAL WARNINGS**: Things to avoid/be careful about
6. **ASK BEFORE PROCEEDING**: Questions to clarify with developer

**When stuck or uncertain:**
- Read the entire phase first
- Check "CRITICAL WARNINGS" section
- Ask questions from "ASK BEFORE PROCEEDING"
- Never assume - always clarify with developer

**File Navigation:**
- Use Ctrl+F to search for "PHASE X START"
- Each phase is independent but builds on previous
- Always check "Dependencies" before starting a phase

---

## 🎯 PROJECT CONTEXT

**Project:** Suraksha Setu (Disaster Management Platform)  
**Deadline:** 24 hours (40% completion required)  
**Current Status:** Server setup complete with MongoDB, Redis, Security middleware  
**Tech Stack:** Node.js, Express, MongoDB, Redis, Passport.js (session auth), EJS/React  
**Architecture:** Monolithic (NOT microservices)  
**Team:** 2 developers using GitHub Copilot  

**Current Code Status:**
- ✅ Express server configured
- ✅ MongoDB connection working
- ✅ Redis connection working
- ✅ Security middleware (Helmet, CSP, Rate limiting, CORS)
- ✅ Error handling middleware
- ❌ Authentication NOT implemented
- ❌ Database models NOT created
- ❌ Routes NOT created
- ❌ Frontend NOT started

---

## 📊 40% COMPLETION BREAKDOWN

**Total Features Required:** 7  
**40% Target:** 3 core features fully functional  

### Priority 1 (Must Have - 40%):
1. **Authentication System** (Passport.js session-based) - 15%
2. **SOS Reporting** (Create + List) - 15%
3. **Basic Dashboard UI** (Citizens see SOS, Admins see all) - 10%

### Priority 2 (Nice to Have - Next 30%):
4. Resource Directory (Static data) - 10%
5. Alert Feed (Static/hardcoded) - 10%
6. Basic Map View - 10%

### Priority 3 (Post-demo - Remaining 30%):
7. Advanced features, polish, deployment

---

## ⚡ PHASE BREAKDOWN (40% TARGET)

```
PHASE 1: Authentication & User Management (15%)
├── Duration: 6-8 hours
├── DoD: Users can register, login, logout, view profile
└── Files: models/User.js, routes/auth.js, controllers/authController.js, views/auth pages

PHASE 2: SOS Reporting System (15%)
├── Duration: 5-6 hours
├── DoD: Citizens create SOS, Admins view all SOS entries
└── Files: models/SOS.js, routes/sos.js, controllers/sosController.js, views/sos pages

PHASE 3: Dashboard & UI Integration (10%)
├── Duration: 4-5 hours
├── DoD: Role-based dashboards rendering, basic navigation working
└── Files: views/dashboard.ejs, public/css/styles.css, layout templates
```

---

# 🚀 PHASE 1: AUTHENTICATION & USER MANAGEMENT

## ⏱️ PHASE 1 START MARKER
**Estimated Time:** 6-8 hours  
**Deliverable:** Complete authentication system with Passport.js sessions

---

## 📝 DEFINITION OF DONE (DoD) - PHASE 1

### Functional Requirements:
- [ ] User can register with email, password, name, phone, role (citizen/admin)
- [ ] Passwords are hashed using bcrypt
- [ ] User can login with email and password
- [ ] Session is created and stored in Redis
- [ ] User can logout and session is destroyed
- [ ] Protected routes redirect unauthenticated users to login
- [ ] Role-based access control working (admin vs citizen)
- [ ] User profile page displays logged-in user info

### Technical Requirements:
- [ ] User model created with proper schema validation
- [ ] Passport.js local strategy configured
- [ ] Express-session configured with Redis store
- [ ] Auth routes defined: /register, /login, /logout, /profile
- [ ] Auth middleware created: isAuthenticated, isAdmin
- [ ] Form validation on both client and server side
- [ ] Error messages displayed for invalid inputs
- [ ] Success messages for successful registration/login

### Testing Checklist:
- [ ] Register new user (citizen role)
- [ ] Register new user (admin role)
- [ ] Duplicate email shows error
- [ ] Login with correct credentials
- [ ] Login with wrong password shows error
- [ ] Logout redirects to login page
- [ ] Accessing /dashboard without login redirects to /login
- [ ] Admin can access admin routes
- [ ] Citizen cannot access admin routes

---

## 🛠️ IMPLEMENTATION GUIDE - PHASE 1

### Step 1.1: Create User Model

**File:** `models/User.js`

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
      },
      message: 'Please provide a valid email'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Don't return password in queries by default
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^[0-9]{10}$/.test(v);
      },
      message: 'Phone number must be 10 digits'
    }
  },
  role: {
    type: String,
    enum: ['citizen', 'admin'],
    default: 'citizen'
  },
  location: {
    lat: Number,
    lng: Number,
    address: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
```

**CRITICAL WARNINGS:**
- ⚠️ Never store plain text passwords
- ⚠️ Always use `select: false` on password field
- ⚠️ Hash password in pre-save hook, not in controller
- ⚠️ Email must be unique and lowercase

---

### Step 1.2: Configure Passport.js

**File:** `config/passport.js`

```javascript
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

// Local Strategy
passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email, password, done) => {
    try {
      // Find user with password field
      const user = await User.findOne({ email }).select('+password');
      
      if (!user) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      // Check if user is active
      if (!user.isActive) {
        return done(null, false, { message: 'Account is deactivated' });
      }

      // Compare password
      const isMatch = await user.comparePassword(password);
      
      if (!isMatch) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// Serialize user (store user id in session)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user (retrieve user from session)
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
```

**CRITICAL WARNINGS:**
- ⚠️ Must use `select('+password')` to get password field
- ⚠️ Never send password in response
- ⚠️ Always check if user.isActive before authentication
- ⚠️ Serialize only user.id, not entire user object

---

### Step 1.3: Configure Express Session with Redis

**File:** Update `server.js` (add BEFORE routes)

```javascript
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const passport = require('./config/passport');

// Session configuration (ADD THIS AFTER MIDDLEWARE SETUP)
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // true in production (HTTPS)
    httpOnly: true, // Prevent XSS
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Make user available in all views
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.isAuthenticated = req.isAuthenticated();
  next();
});
```

**CRITICAL WARNINGS:**
- ⚠️ Session secret MUST be in .env file
- ⚠️ Set `secure: true` only in production (requires HTTPS)
- ⚠️ Use `httpOnly: true` to prevent XSS attacks
- ⚠️ Session middleware must come BEFORE passport.initialize()

---

### Step 1.4: Create Auth Controller

**File:** `controllers/authController.js`

```javascript
const User = require('../models/User');
const passport = require('passport');

// GET /register - Show registration form
exports.getRegister = (req, res) => {
  res.render('auth/register', { 
    title: 'Register',
    error: req.flash('error'),
    success: req.flash('success')
  });
};

// POST /register - Handle registration
exports.postRegister = async (req, res, next) => {
  try {
    const { name, email, password, passwordConfirm, phone, role } = req.body;

    // Validate password confirmation
    if (password !== passwordConfirm) {
      req.flash('error', 'Passwords do not match');
      return res.redirect('/register');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash('error', 'Email already registered');
      return res.redirect('/register');
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: role || 'citizen'
    });

    req.flash('success', 'Registration successful! Please login.');
    res.redirect('/login');

  } catch (err) {
    console.error('Registration error:', err);
    req.flash('error', err.message || 'Registration failed');
    res.redirect('/register');
  }
};

// GET /login - Show login form
exports.getLogin = (req, res) => {
  res.render('auth/login', { 
    title: 'Login',
    error: req.flash('error'),
    success: req.flash('success')
  });
};

// POST /login - Handle login
exports.postLogin = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    
    if (!user) {
      req.flash('error', info.message || 'Login failed');
      return res.redirect('/login');
    }

    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }

      req.flash('success', 'Welcome back!');
      
      // Redirect based on role
      if (user.role === 'admin') {
        return res.redirect('/admin/dashboard');
      } else {
        return res.redirect('/dashboard');
      }
    });
  })(req, res, next);
};

// GET /logout - Handle logout
exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash('success', 'Logged out successfully');
    res.redirect('/login');
  });
};

// GET /profile - Show user profile
exports.getProfile = (req, res) => {
  res.render('auth/profile', { 
    title: 'My Profile',
    user: req.user
  });
};
```

**CRITICAL WARNINGS:**
- ⚠️ Always check if email exists before creating user
- ⚠️ Use flash messages for user feedback
- ⚠️ Redirect based on user role after login
- ⚠️ Use `req.logIn()` for passport authentication
- ⚠️ Handle errors properly with try-catch

---

### Step 1.5: Create Auth Middleware

**File:** `middleware/auth.js`

```javascript
// Check if user is authenticated
exports.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error', 'Please login to access this page');
  res.redirect('/login');
};

// Check if user is admin
exports.isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  req.flash('error', 'Access denied. Admin privileges required.');
  res.redirect('/dashboard');
};

// Check if user is citizen
exports.isCitizen = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'citizen') {
    return next();
  }
  req.flash('error', 'Access denied.');
  res.redirect('/dashboard');
};

// Redirect if already authenticated
exports.redirectIfAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect('/dashboard');
  }
  next();
};
```

---

### Step 1.6: Create Auth Routes

**File:** `routes/auth.js`

```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated, redirectIfAuthenticated } = require('../middleware/auth');

// Public routes
router.get('/register', redirectIfAuthenticated, authController.getRegister);
router.post('/register', redirectIfAuthenticated, authController.postRegister);

router.get('/login', redirectIfAuthenticated, authController.getLogin);
router.post('/login', redirectIfAuthenticated, authController.postLogin);

// Protected routes
router.get('/logout', isAuthenticated, authController.logout);
router.get('/profile', isAuthenticated, authController.getProfile);

module.exports = router;
```

---

### Step 1.7: Create Auth Views

**File:** `views/auth/register.ejs`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><%= title %> - Suraksha Setu</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
  <div class="auth-container">
    <div class="auth-card">
      <h1>Register</h1>
      
      <% if (error && error.length > 0) { %>
        <div class="alert alert-error"><%= error %></div>
      <% } %>
      
      <% if (success && success.length > 0) { %>
        <div class="alert alert-success"><%= success %></div>
      <% } %>

      <form action="/register" method="POST">
        <div class="form-group">
          <label for="name">Full Name</label>
          <input type="text" id="name" name="name" required minlength="2">
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" required>
        </div>

        <div class="form-group">
          <label for="phone">Phone Number (Optional)</label>
          <input type="tel" id="phone" name="phone" pattern="[0-9]{10}">
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" required minlength="8">
        </div>

        <div class="form-group">
          <label for="passwordConfirm">Confirm Password</label>
          <input type="password" id="passwordConfirm" name="passwordConfirm" required minlength="8">
        </div>

        <div class="form-group">
          <label for="role">Role</label>
          <select id="role" name="role" required>
            <option value="citizen">Citizen</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <button type="submit" class="btn btn-primary">Register</button>
      </form>

      <p class="auth-link">
        Already have an account? <a href="/login">Login here</a>
      </p>
    </div>
  </div>
</body>
</html>
```

**File:** `views/auth/login.ejs`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><%= title %> - Suraksha Setu</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
  <div class="auth-container">
    <div class="auth-card">
      <h1>Login</h1>
      
      <% if (error && error.length > 0) { %>
        <div class="alert alert-error"><%= error %></div>
      <% } %>
      
      <% if (success && success.length > 0) { %>
        <div class="alert alert-success"><%= success %></div>
      <% } %>

      <form action="/login" method="POST">
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" required>
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" required>
        </div>

        <button type="submit" class="btn btn-primary">Login</button>
      </form>

      <p class="auth-link">
        Don't have an account? <a href="/register">Register here</a>
      </p>
    </div>
  </div>
</body>
</html>
```

---

### Step 1.8: Update server.js to Include Routes

**Add to server.js (BEFORE error handling middleware):**

```javascript
// Setup view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Flash messages
const flash = require('connect-flash');
app.use(flash());

// Routes
const authRoutes = require('./routes/auth');
app.use('/', authRoutes);
```

---

### Step 1.9: Install Required Dependencies

```bash
npm install passport passport-local bcryptjs express-session connect-redis connect-flash ejs
```

---

## ⏱️ PHASE 1 END MARKER

**Verification Steps:**
1. Start server: `npm start`
2. Visit http://localhost:5000/register
3. Create citizen account
4. Create admin account
5. Test login with both accounts
6. Verify redirect based on role
7. Test logout functionality
8. Try accessing /profile without login (should redirect)

**If all tests pass → PHASE 1 COMPLETE ✅**

---

# 🚨 PHASE 2: SOS REPORTING SYSTEM

## ⏱️ PHASE 2 START MARKER
**Estimated Time:** 5-6 hours  
**Deliverable:** SOS creation and listing functionality

**Dependencies:** PHASE 1 must be complete

---

## 📝 DEFINITION OF DONE (DoD) - PHASE 2

### Functional Requirements:
- [ ] Citizen can create SOS report with location, type, severity, description
- [ ] SOS automatically captures user's geolocation (or allows manual entry)
- [ ] SOS is saved to database with userId, timestamp, status
- [ ] Citizen can view their own SOS history
- [ ] Admin can view ALL SOS reports from all users
- [ ] Admin can filter SOS by status, severity, type
- [ ] Admin can update SOS status (pending → acknowledged → resolved)
- [ ] SOS list shows user name, location, timestamp, status

### Technical Requirements:
- [ ] SOS model created with proper schema
- [ ] SOS routes defined: GET/POST /sos, GET /sos/:id, PUT /sos/:id/status
- [ ] SOS controller with CRUD operations
- [ ] Authorization: Only SOS creator or admin can view specific SOS
- [ ] Geolocation API integration (browser-based or manual input fallback)
- [ ] Form validation for SOS creation
- [ ] Status update restricted to admin only

### Testing Checklist:
- [ ] Citizen creates SOS with geolocation
- [ ] Citizen creates SOS with manual location
- [ ] Citizen views only their own SOS
- [ ] Admin views all SOS from all users
- [ ] Admin can update SOS status
- [ ] Citizen cannot update SOS status
- [ ] Cannot create SOS without required fields

---

## 🛠️ IMPLEMENTATION GUIDE - PHASE 2

### Step 2.1: Create SOS Model

**File:** `models/SOS.js`

```javascript
const mongoose = require('mongoose');

const sosSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['flood', 'fire', 'earthquake', 'medical', 'accident', 'other'],
    required: [true, 'Emergency type is required']
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'high'
  },
  status: {
    type: String,
    enum: ['pending', 'acknowledged', 'in-progress', 'resolved'],
    default: 'pending'
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  location: {
    lat: {
      type: Number,
      required: [true, 'Latitude is required']
    },
    lng: {
      type: Number,
      required: [true, 'Longitude is required']
    },
    address: String
  },
  contactNumber: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^[0-9]{10}$/.test(v);
      },
      message: 'Contact number must be 10 digits'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: Date,
  adminNotes: String
});

// Update timestamp on save
sosSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.status === 'resolved' && !this.resolvedAt) {
    this.resolvedAt = Date.now();
  }
  next();
});

const SOS = mongoose.model('SOS', sosSchema);

module.exports = SOS;
```

---

### Step 2.2: Create SOS Controller

**File:** `controllers/sosController.js`

```javascript
const SOS = require('../models/SOS');
const User = require('../models/User');

// GET /sos - List SOS reports
exports.listSOS = async (req, res) => {
  try {
    let query = {};
    
    // Citizens see only their SOS, admins see all
    if (req.user.role !== 'admin') {
      query.userId = req.user._id;
    }

    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    const sosList = await SOS.find(query)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });

    res.render('sos/list', {
      title: 'SOS Reports',
      sosList,
      user: req.user
    });

  } catch (err) {
    console.error('Error fetching SOS:', err);
    req.flash('error', 'Failed to load SOS reports');
    res.redirect('/dashboard');
  }
};

// GET /sos/create - Show SOS creation form
exports.getCreateSOS = (req, res) => {
  res.render('sos/create', {
    title: 'Create SOS',
    user: req.user
  });
};

// POST /sos - Create new SOS
exports.createSOS = async (req, res) => {
  try {
    const { type, severity, description, lat, lng, address, contactNumber } = req.body;

    // Validate required fields
    if (!type || !description || !lat || !lng) {
      req.flash('error', 'All required fields must be filled');
      return res.redirect('/sos/create');
    }

    // Create SOS
    const sos = await SOS.create({
      userId: req.user._id,
      type,
      severity: severity || 'high',
      description,
      location: { lat: parseFloat(lat), lng: parseFloat(lng), address },
      contactNumber: contactNumber || req.user.phone
    });

    req.flash('success', 'SOS report created successfully!');
    res.redirect('/sos');

  } catch (err) {
    console.error('Error creating SOS:', err);
    req.flash('error', err.message || 'Failed to create SOS');
    res.redirect('/sos/create');
  }
};

// GET /sos/:id - View specific SOS
exports.viewSOS = async (req, res) => {
  try {
    const sos = await SOS.findById(req.params.id).populate('userId', 'name email phone');

    if (!sos) {
      req.flash('error', 'SOS not found');
      return res.redirect('/sos');
    }

    // Authorization: only creator or admin can view
    if (req.user.role !== 'admin' && sos.userId._id.toString() !== req.user._id.toString()) {
      req.flash('error', 'Access denied');
      return res.redirect('/sos');
    }

    res.render('sos/view', {
      title: 'SOS Details',
      sos,
      user: req.user
    });

  } catch (err) {
    console.error('Error viewing SOS:', err);
    req.flash('error', 'Failed to load SOS details');
    res.redirect('/sos');
  }
};

// PUT /sos/:id/status - Update SOS status (Admin only)
exports.updateStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    const sos = await SOS.findById(req.params.id);

    if (!sos) {
      return res.status(404).json({ success: false, message: 'SOS not found' });
    }

    sos.status = status;
    if (adminNotes) {
      sos.adminNotes = adminNotes;
    }
    await sos.save();

    res.json({ success: true, message: 'Status updated successfully' });

  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
};
```

---

### Step 2.3: Create SOS Routes

**File:** `routes/sos.js`

```javascript
const express = require('express');
const router = express.Router();
const sosController = require('../controllers/sosController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(isAuthenticated);

// SOS routes
router.get('/sos', sosController.listSOS);
router.get('/sos/create', sosController.getCreateSOS);
router.post('/sos', sosController.createSOS);
router.get('/sos/:id', sosController.viewSOS);

// Admin only routes
router.put('/sos/:id/status', isAdmin, sosController.updateStatus);

module.exports = router;
```

---

### Step 2.4: Create SOS Views

**File:** `views/sos/create.ejs`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><%= title %> - Suraksha Setu</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
  <%- include('../partials/navbar') %>

  <div class="container">
    <h1>Create SOS Report</h1>

    <% if (locals.error) { %>
      <div class="alert alert-error"><%= error %></div>
    <% } %>

    <form action="/sos" method="POST" id="sosForm">
      <div class="form-group">
        <label for="type">Emergency Type *</label>
        <select id="type" name="type" required>
          <option value="">Select Type</option>
          <option value="flood">Flood</option>
          <option value="fire">Fire</option>
          <option value="earthquake">Earthquake</option>
          <option value="medical">Medical Emergency</option>
          <option value="accident">Accident</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div class="form-group">
        <label for="severity">Severity *</label>
        <select id="severity" name="severity" required>
          <option value="high">High</option>
          <option value="critical">Critical</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div class="form-group">
        <label for="description">Description *</label>
        <textarea id="description" name="description" rows="4" required maxlength="500"></textarea>
      </div>

      <div class="form-group">
        <label>Location *</label>
        <button type="button" id="getLocation" class="btn btn-secondary">Get My Location</button>
        <small id="locationStatus"></small>
      </div>

      <input type="hidden" id="lat" name="lat" required>
      <input type="hidden" id="lng" name="lng" required>

      <div class="form-group">
        <label for="address">Address (Optional)</label>
        <input type="text" id="address" name="address">
      </div>

      <div class="form-group">
        <label for="contactNumber">Contact Number</label>
        <input type="tel" id="contactNumber" name="contactNumber" pattern="[0-9]{10}" value="<%= user.phone || '' %>">
      </div>

      <button type="submit" class="btn btn-primary" id="submitBtn" disabled>Submit SOS</button>
    </form>
  </div>

  <script>
    const getLocationBtn = document.getElementById('getLocation');
    const locationStatus = document.getElementById('locationStatus');
    const submitBtn = document.getElementById('submitBtn');
    const latInput = document.getElementById('lat');
    const lngInput = document.getElementById('lng');

    getLocationBtn.addEventListener('click', () => {
      if (navigator.geolocation) {
        locationStatus.textContent = 'Getting location...';
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            latInput.value = position.coords.latitude;
            lngInput.value = position.coords.longitude;
            locationStatus.textContent = `✓ Location captured: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
            locationStatus.style.color = 'green';
            submitBtn.disabled = false;
          },
          (error) => {
            locationStatus.textContent = '✗ Location access denied. Please enter manually.';
            locationStatus.style.color = 'red';
            // Allow manual entry
            const manualLat = prompt('Enter latitude:');
            const manualLng = prompt('Enter longitude:');
            if (manualLat && manualLng) {
              latInput.value = manualLat;
              lngInput.value = manualLng;
              locationStatus.textContent = '✓ Location entered manually';
              submitBtn.disabled = false;
            }
          }
        );
      } else {
        alert('Geolocation is not supported by your browser');
      }
    });
  </script>
</body>
</html>
```

**File:** `views/sos/list.ejs`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><%= title %> - Suraksha Setu</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
  <%- include('../partials/navbar') %>

  <div class="container">
    <div class="page-header">
      <h1>SOS Reports</h1>
      <a href="/sos/create" class="btn btn-primary">Create New SOS</a>
    </div>

    <% if (locals.success) { %>
      <div class="alert alert-success"><%= success %></div>
    <% } %>

    <% if (sosList.length === 0) { %>
      <p>No SOS reports found.</p>
    <% } else { %>
      <table class="sos-table">
        <thead>
          <tr>
            <th>Date</th>
            <% if (user.role === 'admin') { %>
              <th>User</th>
            <% } %>
            <th>Type</th>
            <th>Severity</th>
            <th>Status</th>
            <th>Location</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <% sosList.forEach(sos => { %>
            <tr>
              <td><%= new Date(sos.createdAt).toLocaleString() %></td>
              <% if (user.role === 'admin') { %>
                <td><%= sos.userId.name %></td>
              <% } %>
              <td><span class="badge badge-<%= sos.type %>"><%= sos.type %></span></td>
              <td><span class="badge badge-<%= sos.severity %>"><%= sos.severity %></span></td>
              <td>
                <span class="badge badge-<%= sos.status %>"><%= sos.status %></span>
              </td>
              <td><%= sos.location.lat.toFixed(4) %>, <%= sos.location.lng.toFixed(4) %></td>
              <td>
                <a href="/sos/<%= sos._id %>" class="btn btn-small">View</a>
              </td>
            </tr>
          <% }) %>
        </tbody>
      </table>
    <% } %>
  </div>
</body>
</html>
```

---

### Step 2.5: Update server.js

**Add SOS routes:**

```javascript
const sosRoutes = require('./routes/sos');
app.use('/', sosRoutes);
```

---

## ⏱️ PHASE 2 END MARKER

**Verification Steps:**
1. Login as citizen
2. Create SOS report with geolocation
3. View SOS list (should see only your reports)
4. Login as admin
5. View SOS list (should see all reports)
6. Test status update as admin

**If all tests pass → PHASE 2 COMPLETE ✅**

---

# 📊 PHASE 3: DASHBOARD & UI INTEGRATION

## ⏱️ PHASE 3 START MARKER
**Estimated Time:** 4-5 hours  
**Deliverable:** Role-based dashboards with navigation

**Dependencies:** PHASE 1 & 2 must be complete

---

## 📝 DEFINITION OF DONE (DoD) - PHASE 3

### Functional Requirements:
- [ ] Citizen dashboard shows: recent SOS, quick create button, resource links
- [ ] Admin dashboard shows: SOS statistics, all pending SOS, recent activity
- [ ] Navigation bar with role-based menu items
- [ ] Responsive design for mobile and desktop
- [ ] Flash messages display properly
- [ ] Logout button in navbar

### Technical Requirements:
- [ ] Dashboard routes: /dashboard, /admin/dashboard
- [ ] Reusable navbar partial
- [ ] CSS styling for professional look
- [ ] Role-based navigation rendering

---

## 🛠️ IMPLEMENTATION GUIDE - PHASE 3

### Step 3.1: Create Dashboard Controller

**File:** `controllers/dashboardController.js`

```javascript
const SOS = require('../models/SOS');

// Citizen Dashboard
exports.citizenDashboard = async (req, res) => {
  try {
    const recentSOS = await SOS.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5);

    const stats = {
      total: await SOS.countDocuments({ userId: req.user._id }),
      pending: await SOS.countDocuments({ userId: req.user._id, status: 'pending' }),
      resolved: await SOS.countDocuments({ userId: req.user._id, status: 'resolved' })
    };

    res.render('dashboard/citizen', {
      title: 'Dashboard',
      user: req.user,
      recentSOS,
      stats
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    req.flash('error', 'Failed to load dashboard');
    res.redirect('/');
  }
};

// Admin Dashboard
exports.adminDashboard = async (req, res) => {
  try {
    const pendingSOS = await SOS.find({ status: 'pending' })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    const stats = {
      totalSOS: await SOS.countDocuments(),
      pending: await SOS.countDocuments({ status: 'pending' }),
      acknowledged: await SOS.countDocuments({ status: 'acknowledged' }),
      resolved: await SOS.countDocuments({ status: 'resolved' })
    };

    res.render('dashboard/admin', {
      title: 'Admin Dashboard',
      user: req.user,
      pendingSOS,
      stats
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    req.flash('error', 'Failed to load dashboard');
    res.redirect('/');
  }
};
```

---

### Step 3.2: Create Dashboard Routes

**File:** `routes/dashboard.js`

```javascript
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Citizen dashboard
router.get('/dashboard', isAuthenticated, dashboardController.citizenDashboard);

// Admin dashboard
router.get('/admin/dashboard', isAuthenticated, isAdmin, dashboardController.adminDashboard);

module.exports = router;
```

---

### Step 3.3: Create Navbar Partial

**File:** `views/partials/navbar.ejs`

```html
<nav class="navbar">
  <div class="nav-container">
    <a href="/" class="nav-brand">🛡️ Suraksha Setu</a>
    
    <ul class="nav-menu">
      <% if (locals.isAuthenticated) { %>
        <li><a href="/dashboard">Dashboard</a></li>
        <li><a href="/sos">SOS Reports</a></li>
        
        <% if (user && user.role === 'admin') { %>
          <li><a href="/admin/dashboard">Admin Panel</a></li>
        <% } %>
        
        <li class="nav-user">
          <%= user.name %> (<%= user.role %>)
        </li>
        <li><a href="/logout" class="btn-logout">Logout</a></li>
      <% } else { %>
        <li><a href="/login">Login</a></li>
        <li><a href="/register">Register</a></li>
      <% } %>
    </ul>
  </div>
</nav>
```

---

### Step 3.4: Create Dashboard Views

**File:** `views/dashboard/citizen.ejs`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><%= title %> - Suraksha Setu</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
  <%- include('../partials/navbar') %>

  <div class="container">
    <h1>Welcome, <%= user.name %>!</h1>

    <div class="stats-grid">
      <div class="stat-card">
        <h3><%= stats.total %></h3>
        <p>Total SOS</p>
      </div>
      <div class="stat-card">
        <h3><%= stats.pending %></h3>
        <p>Pending</p>
      </div>
      <div class="stat-card">
        <h3><%= stats.resolved %></h3>
        <p>Resolved</p>
      </div>
    </div>

    <div class="quick-actions">
      <a href="/sos/create" class="btn btn-primary btn-large">🚨 Create SOS</a>
    </div>

    <h2>Recent SOS Reports</h2>
    <% if (recentSOS.length === 0) { %>
      <p>No SOS reports yet.</p>
    <% } else { %>
      <div class="sos-list">
        <% recentSOS.forEach(sos => { %>
          <div class="sos-card">
            <h3><%= sos.type %></h3>
            <p><%= sos.description %></p>
            <span class="badge badge-<%= sos.status %>"><%= sos.status %></span>
            <small><%= new Date(sos.createdAt).toLocaleString() %></small>
          </div>
        <% }) %>
      </div>
    <% } %>
  </div>
</body>
</html>
```

**File:** `views/dashboard/admin.ejs`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><%= title %> - Suraksha Setu</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
  <%- include('../partials/navbar') %>

  <div class="container">
    <h1>Admin Dashboard</h1>

    <div class="stats-grid">
      <div class="stat-card">
        <h3><%= stats.totalSOS %></h3>
        <p>Total SOS</p>
      </div>
      <div class="stat-card">
        <h3><%= stats.pending %></h3>
        <p>Pending</p>
      </div>
      <div class="stat-card">
        <h3><%= stats.acknowledged %></h3>
        <p>Acknowledged</p>
      </div>
      <div class="stat-card">
        <h3><%= stats.resolved %></h3>
        <p>Resolved</p>
      </div>
    </div>

    <h2>Pending SOS Reports</h2>
    <% if (pendingSOS.length === 0) { %>
      <p>No pending SOS reports.</p>
    <% } else { %>
      <table class="sos-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Type</th>
            <th>Severity</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <% pendingSOS.forEach(sos => { %>
            <tr>
              <td><%= sos.userId.name %></td>
              <td><span class="badge badge-<%= sos.type %>"><%= sos.type %></span></td>
              <td><span class="badge badge-<%= sos.severity %>"><%= sos.severity %></span></td>
              <td><%= new Date(sos.createdAt).toLocaleString() %></td>
              <td>
                <a href="/sos/<%= sos._id %>" class="btn btn-small">View</a>
              </td>
            </tr>
          <% }) %>
        </tbody>
      </table>
    <% } %>
  </div>
</body>
</html>
```

---

### Step 3.5: Basic CSS Styling

**File:** `public/css/styles.css`

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #333;
  background: #f4f4f4;
}

.navbar {
  background: #2c3e50;
  color: white;
  padding: 1rem 0;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
}

.nav-brand {
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  text-decoration: none;
}

.nav-menu {
  display: flex;
  list-style: none;
  gap: 1.5rem;
  align-items: center;
}

.nav-menu a {
  color: white;
  text-decoration: none;
  transition: opacity 0.3s;
}

.nav-menu a:hover {
  opacity: 0.8;
}

.container {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 1rem;
}

.auth-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  text-decoration: none;
  display: inline-block;
  transition: background 0.3s;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.alert {
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 4px;
}

.alert-error {
  background: #ffe6e6;
  color: #c0392b;
  border: 1px solid #e74c3c;
}

.alert-success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #27ae60;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  text-align: center;
}

.stat-card h3 {
  font-size: 2rem;
  color: #3498db;
  margin-bottom: 0.5rem;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

.badge-pending { background: #ffeaa7; color: #2d3436; }
.badge-acknowledged { background: #74b9ff; color: #2d3436; }
.badge-resolved { background: #55efc4; color: #2d3436; }
.badge-high { background: #ff7675; color: white; }
.badge-critical { background: #d63031; color: white; }

.sos-table {
  width: 100%;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.sos-table th,
.sos-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #ecf0f1;
}

.sos-table th {
  background: #34495e;
  color: white;
  font-weight: 500;
}

@media (max-width: 768px) {
  .nav-menu {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
```

---

### Step 3.6: Update server.js

```javascript
const dashboardRoutes = require('./routes/dashboard');
app.use('/', dashboardRoutes);
```

---

## ⏱️ PHASE 3 END MARKER

**Verification Steps:**
1. Login as citizen - verify citizen dashboard loads
2. Check recent SOS display
3. Login as admin - verify admin dashboard loads
4. Check pending SOS table
5. Test navigation between pages
6. Test responsive design on mobile

**If all tests pass → PHASE 3 COMPLETE ✅**

---

# 🎯 40% COMPLETION CHECKLIST

## Final Verification (All 3 Phases)

### Authentication (15%):
- [ ] User registration working
- [ ] User login working
- [ ] Sessions persisting in Redis
- [ ] Protected routes redirecting
- [ ] Role-based access working

### SOS System (15%):
- [ ] Citizens can create SOS
- [ ] Geolocation capture working
- [ ] Citizens see their SOS list
- [ ] Admins see all SOS
- [ ] Admin can update status

### Dashboard (10%):
- [ ] Citizen dashboard rendering
- [ ] Admin dashboard rendering
- [ ] Statistics displaying correctly
- [ ] Navigation working
- [ ] UI is responsive

---

## 🚨 ASK BEFORE PROCEEDING (Developer Questions)

Before implementing each phase, ask the developer:

### Phase 1 Questions:
1. Do you want email verification for registration?
2. Should we implement "remember me" functionality?
3. What should be the default role for new registrations?
4. Do you have a SESSION_SECRET in .env file?

### Phase 2 Questions:
1. Should SOS be editable after creation?
2. Do you want image upload for SOS reports?
3. Should we add WhatsApp/SMS notifications?
4. What statuses are needed besides pending/acknowledged/resolved?

### Phase 3 Questions:
1. Do you want a landing page or redirect directly to dashboard?
2. Should we add charts/graphs to dashboards?
3. Do you want admin to be able to delete SOS?
4. Should we add search/filter functionality?

---

## 🐛 COMMON ISSUES & SOLUTIONS

### Issue: Session not persisting
**Solution:** Check Redis connection, verify SESSION_SECRET in .env

### Issue: Geolocation not working
**Solution:** Must use HTTPS in production, allow manual location entry as fallback

### Issue: Cannot read properties of undefined (req.user)
**Solution:** Ensure passport.deserializeUser is working, check session middleware order

### Issue: Flash messages not displaying
**Solution:** Ensure connect-flash is installed and configured before routes

---

## 📦 Required Dependencies

```bash
npm install express mongoose passport passport-local bcryptjs express-session connect-redis connect-flash ejs method-override
```

---

## 🚀 DEPLOYMENT PREP (After 40% Complete)

1. Add environment variables to .env
2. Update CORS origins for production
3. Set secure: true for cookies in production
4. Add MongoDB connection string
5. Add Redis URL
6. Test on mobile device

---

**END OF MASTER INSTRUCTION FILE**

Use this file as your single source of truth for building Suraksha Setu Phase 1 (40% MVP).  
Follow phases sequentially, check DoD before moving forward, and ask questions when stuck!