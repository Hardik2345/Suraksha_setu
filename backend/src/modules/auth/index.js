const { createAuthRouter } = require('./presentation/http/auth.routes');

function registerAuthModule() {
  return [
    {
      basePath: '/api/auth',
      router: createAuthRouter(),
    },
  ];
}

module.exports = { registerAuthModule };
