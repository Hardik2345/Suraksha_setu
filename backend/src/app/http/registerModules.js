const { registerApiRoutes } = require('../../shared/http/registerApiRoutes');
const { registerAuthModule } = require('../../modules/auth');
const { registerAlertsModule } = require('../../modules/alerts');
const { registerResourcesModule } = require('../../modules/resources');
const { registerSOSModule } = require('../../modules/sos');

function registerModules(app) {
  const moduleRoutes = [
    ...registerAuthModule(),
    ...registerAlertsModule(),
    ...registerResourcesModule(),
    ...registerSOSModule(),
    { basePath: '/api/dashboard', router: require('../../../routes/dashboard') },
    { basePath: '/api/admin', router: require('../../../routes/dashboard') },
  ];

  registerApiRoutes(app, moduleRoutes);
}

module.exports = { registerModules };
