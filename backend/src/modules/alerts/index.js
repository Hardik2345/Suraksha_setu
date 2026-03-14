const { createAlertsRouter } = require('./presentation/http/alerts.routes');

function registerAlertsModule() {
  return [
    {
      basePath: '/api/alerts',
      router: createAlertsRouter(),
    },
  ];
}

module.exports = { registerAlertsModule };
