const express = require("express")
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const mongoose = require("mongoose")
const morgan = require("morgan")
const crypto = require('crypto');
const helmet = require("helmet")
const cors = require("cors")
const cookieParser = require('cookie-parser');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const Redis = require('ioredis');

// Load environment variables early and determine environment
require('dotenv').config();
const isProduction = process.env.NODE_ENV === 'production';

// Create Redis client only in production (avoid dev compatibility issues)
let redisClient;
const allowRedisInDev = process.env.USE_REDIS_IN_DEV === 'true';
if ((isProduction || allowRedisInDev) && process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL);
  console.log(`Redis client enabled (${isProduction ? 'production' : 'development (opt-in)'}).`);
} else {
  console.log('Redis client disabled (set REDIS_URL and USE_REDIS_IN_DEV=true to enable in dev)');
}
if (redisClient) {
  const rawSet = redisClient.set.bind(redisClient);
  redisClient.set = (...args) => {
    // If third arg is an options object (node-redis style), drop it for ioredis.
    if (args.length >= 3 && typeof args[2] === 'object' && args[2] !== null) {
      // args = [key, value, optionsObj]
      return rawSet(args[0], args[1]); // ignore options object; rely on cookie expiry
    }
    return rawSet(...args);
  };
}

// (compatRedisClient wrapper removed) Use `redisClient` directly.
const hpp = require('hpp');
const session = require('express-session');
let ConnectRedis;
try { ConnectRedis = require('connect-redis'); } catch (e) { ConnectRedis = null; }
const flash = require('connect-flash');
const passport = require('./config/passport');
const path = require('path');
const http = require("http")
const AppError = require('./utils/appError.js');
const globalErrorHandler = require('./controllers/errorController');
require("dotenv").config()

// Swagger/OpenAPI: load combined spec from config/swagger.js (reads backend/swagger/openapi.json)
let swaggerUi;
let swaggerSpec;
try {
  swaggerUi = require('swagger-ui-express');
  // Use the loader module which reads backend/swagger/openapi.json
  swaggerSpec = require('./config/swagger');
} catch (e) {
  // swagger dependencies or spec file may not be available in minimal environments
  swaggerUi = null;
  swaggerSpec = null;
  console.warn('swagger-ui-express or OpenAPI spec not available:', e.message);
}

const app = express()
const server = http.createServer(app)
app.set('trust proxy', 1);

// Environment flag (defined earlier)

// generate a per-request nonce for inline scripts/styles you explicitly allow
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
});

// Set security HTTP headers
app.use(helmet());

// Content Security Policy
const cspDirectives = {
  defaultSrc: ["'self'"],
  // Allow scripts from self and from selected CDNs; allow scripts using the generated nonce
  scriptSrc: [
    "'self'",
    (req, res) => `'nonce-${res.locals.nonce}'`,
    'https://cdn.jsdelivr.net',          // example public CDN - add any you use
  ],
  // Allow styles from self and e.g. Google Fonts
  styleSrc: [
    "'self'",
    'https://fonts.googleapis.com'
  ],
  // Images: self plus data: (for inline images) and blob: if you use blobs
  imgSrc: [
    "'self'",
    'data:',
    'blob:'
  ],
  // Fonts: allow Google Fonts or other providers you need
  fontSrc: [
    "'self'",
    'https://fonts.gstatic.com'
  ],
  // API/websocket endpoints your frontend fetches from (adjust as needed)
  connectSrc: [
    "'self'",
    'https://api.example.com',  // replace with your real API origin
    'ws:'                       // allow websocket connections (if used)
  ],
  // Disallow embedding the site in frames
  frameAncestors: ["'none'"],
  // Disallow object/embed tags
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"]
};

// During development allow Vite/dev origin for scripts/connects
if (!isProduction) {
  cspDirectives.scriptSrc.push('http://localhost:5173');
  cspDirectives.connectSrc.push('http://localhost:5173');
}

// Use reportOnly = true in development to avoid blocking during testing

app.use(
  helmet.contentSecurityPolicy({
    directives: cspDirectives,
    // set reportOnly true while developing to surface violations without blocking
    reportOnly: !isProduction,
    // Optionally set a report URI (deprecated) or use Reporting API; example:
    // reportUri: '/csp-report-endpoint'
  })
);

// endpoint to collect CSP reports (reporting API / report-to headers are recommended in modern setups)
app.post('/csp-report', express.json({ type: ['application/csp-report', 'application/json'] }), (req, res) => {
  console.warn('CSP violation report:', JSON.stringify(req.body));
  res.status(204).end();
});

// HSTS — force HTTPS for 2 years, include subdomains and enable preload (only in production)
if (isProduction) {
  app.use(
    helmet.hsts({
      maxAge: 63072000, // 2 years in seconds
      includeSubDomains: true,
      preload: true,
    })
  );
}

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(compression());

// express-mongo-sanitize's default middleware assigns back to `req.query` which
// can be a getter-only property in some Express setups. To avoid "Cannot set
// property query of #<IncomingMessage> which has only a getter", call the
// sanitizer on mutable objects only and skip `req.query` assignment.
// Setup input sanitization: mongo-sanitize (in-place) and xss-clean (safe usage)
if (mongoSanitize && typeof mongoSanitize.sanitize === 'function') {
  app.use((req, res, next) => {
    try {
      if (req.body) mongoSanitize.sanitize(req.body);
      if (req.params) mongoSanitize.sanitize(req.params);
      if (req.headers) mongoSanitize.sanitize(req.headers);
      // Intentionally skip sanitizing req.query to avoid assigning to a getter-only property
    } catch (err) {
      // If sanitization fails, log and continue — we don't want sanitization errors to crash the app
      console.warn('Input sanitization error:', err);
    }
    next();
  });
} else {
  // fallback to the middleware if available
  app.use(mongoSanitize());
}
// xss-clean installs middleware that assigns to req.query which may be readonly.
// Use its internal clean function to mutate allowed objects and create `req.safeQuery` instead.
let xssCleanFunc;
try {
  xssCleanFunc = require('xss-clean/lib/xss').clean;
} catch (e) {
  xssCleanFunc = null;
}
if (typeof xssCleanFunc === 'function') {
  app.use((req, res, next) => {
    try {
      if (req.body) req.body = xssCleanFunc(req.body);
      if (req.params) req.params = xssCleanFunc(req.params);
      if (req.headers) req.headers = xssCleanFunc(req.headers);
      // Do not overwrite req.query; provide a sanitized copy instead
      if (req.query) req.safeQuery = xssCleanFunc(req.query);
    } catch (err) {
      console.warn('XSS sanitization error:', err);
    }
    next();
  });
} else {
  // fallback to the provided middleware (may throw in some environments)
  try {
    app.use(xss());
  } catch (err) {
    console.warn('xss-clean middleware failed to initialize, continuing without it:', err);
  }
}
app.use(hpp());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Redis client event handlers (only if redisClient exists)
if (redisClient) {
  redisClient.on('connect', () => {
    console.log('✅ Redis client connected');
  });

  redisClient.on('ready', () => {
    console.log('⚡ Redis client ready to use');
  });

  redisClient.on('error', (err) => {
    console.error('❌ Redis Client Error:', err);
  });

  redisClient.on('end', () => {
    console.log('🛑 Redis connection closed');
  });
}

// Session store (Redis) - tolerant initialization for different connect-redis versions
let sessionStoreInstance;
// Attempt Redis session store when connect-redis is present and redisClient exists
// This allows opt-in Redis usage in development by setting `USE_REDIS_IN_DEV=true`.
if (ConnectRedis && redisClient) {
  const ConnectRedisModule = ConnectRedis.default || ConnectRedis;
  try {
    // If the module exposes a RedisStore property (e.g. { RedisStore: class ... }), use it
    if (ConnectRedisModule.RedisStore && typeof ConnectRedisModule.RedisStore === 'function') {
      sessionStoreInstance = new ConnectRedisModule.RedisStore({ client: redisClient });
    } else {
      // Try v6-style factory: require('connect-redis')(session)
      try {
        const StoreFactory = ConnectRedisModule(session);
        if (typeof StoreFactory === 'function') {
          sessionStoreInstance = new StoreFactory({ client: redisClient });
        }
      } catch (errFactory) {
        // Try constructor-style direct export
        try {
          const Ctor = ConnectRedisModule.default || ConnectRedisModule;
          if (typeof Ctor === 'function') {
            sessionStoreInstance = new Ctor({ client: redisClient });
          }
        } catch (errCtor) {
          console.warn('connect-redis present but could not initialize store:', errFactory, errCtor);
        }
      }
    }
  } catch (err) {
    console.warn('connect-redis present but initialization failed:', err);
  }

  if (!sessionStoreInstance) {
    console.warn('Could not initialize Redis session store; sessions will use memory store (not for production)');
  }
} else {
  if (!redisClient) {
    console.log('Redis session store skipped: redisClient not configured (set REDIS_URL and USE_REDIS_IN_DEV=true to enable in dev)');
  } else if (!ConnectRedis) {
    console.warn('connect-redis not installed; sessions will use memory store (not for production)');
  }
}

app.use(session({
  store: sessionStoreInstance,
  secret: process.env.SESSION_SECRET || 'change-this-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

// Initialize passport & flash
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Export app for testing
module.exports = app;

// Views/static (API-first but keep placeholders)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// expose user to templates / downstream middleware
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.isAuthenticated = req.isAuthenticated && req.isAuthenticated();
  next();
});

// Custom Redis-backed store for express-rate-limit
class RedisRateLimitStore {
  constructor({ client, prefix = 'rl:' } = {}) {
    if (!client) {
      throw new Error('RedisRateLimitStore requires a Redis client');
    }
    this.redis = client;
    this.prefix = prefix;
    this.windowMs = 0; // will be set in init()
  }

  // Called by express-rate-limit with the options you pass to rateLimit()
  init(options) {
    this.windowMs = options.windowMs;
  }

  // Main method: increment hits for a key
  async increment(key) {
    const redisKey = this.prefix + key;
    const now = Date.now();
    const ttlMs = this.windowMs;

    // Use MULTI to get current TTL and increment atomically-ish
    const results = await this.redis
      .multi()
      .pttl(redisKey) // results[0][1]
      .incr(redisKey) // results[1][1]
      .exec();

    const pttl = results[0][1]; // -2 = key does not exist, -1 = no TTL, >=0 = ms
    const hits = results[1][1];

    let resetMs;
    if (pttl === -2 || pttl === -1) {
      // New key or existing key without TTL: set TTL
      await this.redis.pexpire(redisKey, ttlMs);
      resetMs = ttlMs;
    } else {
      resetMs = pttl;
    }

    return {
      totalHits: hits,
      resetTime: new Date(now + resetMs),
    };
  }

  // Used when skipFailedRequests/skipSuccessfulRequests are enabled
  async decrement(key) {
    const redisKey = this.prefix + key;
    try {
      await this.redis.decr(redisKey);
    } catch (e) {
      // best-effort; ignore errors here
    }
  }

  // Reset rate limit for a specific key
  async resetKey(key) {
    const redisKey = this.prefix + key;
    await this.redis.del(redisKey);
  }

  // Optional: reset everything
  async resetAll() {
    // Could scan and delete keys with this.prefix, but not required.
  }
}

// Limit requests from same API
let limiter;

if (redisClient) {
  console.log(
    `Rate limiter: Redis custom store enabled (${isProduction ? 'production' : 'development (opt-in)'})`
  );

  limiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100,
    keyGenerator: ipKeyGenerator,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisRateLimitStore({ client: redisClient }),
    message: 'Too many requests from this IP, please try again in an hour!',
  });
} else {
  console.log('Rate limiter: using in-memory store (Redis disabled)');
  limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes in dev
    max: 1000, // Higher limit for development
    keyGenerator: ipKeyGenerator,
    standardHeaders: true,
    legacyHeaders: false,
  });
}

// Only apply rate limiter in production
if (isProduction) {
  app.use('/api', limiter);
} else {
  console.log('Rate limiter disabled in development mode');
}

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(express.json())
app.use(express.urlencoded({ extended: true }));

// Mount routes with proper /api prefixes to match Swagger documentation
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const sosRoutes = require('./routes/sos');
app.use('/api/sos', sosRoutes);

const dashboardRoutes = require('./routes/dashboard');
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', dashboardRoutes);

try {
  const resourceRoutes = require('./routes/resource');
  app.use('/api/resources', resourceRoutes);
} catch (e) {
  console.warn('Resource routes could not be mounted:', e.message);
}

try {
  const alertRoutes = require('./routes/alert');
  app.use('/api/alerts', alertRoutes);
} catch (e) {
  console.warn('Alert routes could not be mounted:', e.message);
}

// Mount Swagger UI (if available) BEFORE error handlers so docs render
if (swaggerUi && swaggerSpec) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Suraksha Setu API Docs'
  }));
  console.log('📚 API Documentation available at: /api-docs');
} else {
  console.log('Swagger UI not mounted (missing dependency or config)');
}

//Configure content security policy later as per your needs

// 404 handler
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler
app.use(globalErrorHandler);

const DB = process.env.DATABASE.replace(
  "<db_password>",
  process.env.DATABASE_PASSWORD
);

app.set("env", process.env.NODE_ENV);

mongoose
  .connect(DB, {
    maxPoolSize: 5,
  })
mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose disconnected");
});

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
