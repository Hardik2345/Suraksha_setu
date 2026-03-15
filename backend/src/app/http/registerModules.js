const { registerApiRoutes } = require('../../shared/http/registerApiRoutes');
const { registerAuthModule } = require('../../modules/auth');
const { registerAlertsModule } = require('../../modules/alerts');
const { registerDashboardModule } = require('../../modules/dashboard');
const { registerResourcesModule } = require('../../modules/resources');
const { registerSOSModule } = require('../../modules/sos');

function registerModules(app) {
  const moduleRoutes = [
    ...registerAuthModule(),
    ...registerAlertsModule(),
    ...registerDashboardModule(),
    ...registerResourcesModule(),
    ...registerSOSModule(),
  ];

  registerApiRoutes(app, moduleRoutes);
}

module.exports = { registerModules };
