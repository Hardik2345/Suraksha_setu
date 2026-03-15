const { Server } = require('socket.io');
const User = require('../../../models/User');
const eventBus = require('../events/eventBus');
const { matchesAlertForUser } = require('../../modules/alerts/domain/alertAudience');

function wrapSessionMiddleware(sessionMiddleware) {
  return (socket, next) => sessionMiddleware(socket.request, {}, next);
}

function resolveSocketUser() {
  return async (socket, next) => {
    try {
      const session = socket.request.session;
      const userId = session && session.passport && session.passport.user;

      if (!userId) {
        return next(new Error('Unauthorized'));
      }

      const user = await User.findById(userId);
      if (!user || !user.isActive) {
        return next(new Error('Unauthorized'));
      }

      socket.data.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
}

function initAlertsGateway({ server, sessionMiddleware, allowedOrigins }) {
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  io.use(wrapSessionMiddleware(sessionMiddleware));
  io.use(resolveSocketUser());

  io.on('connection', (socket) => {
    const user = socket.data.user;
    socket.join(`user:${String(user._id)}`);
    socket.join(`role:${user.role}`);
  });

  eventBus.subscribe('alert.created', (payload) => {
    for (const socket of io.sockets.sockets.values()) {
      if (matchesAlertForUser(payload.alert, socket.data.user)) {
        socket.emit('alert:created', payload);
      }
    }
  });

  eventBus.subscribe('alert.deactivated', (payload) => {
    io.emit('alert:deactivated', payload);
  });

  return io;
}

module.exports = {
  initAlertsGateway,
};
