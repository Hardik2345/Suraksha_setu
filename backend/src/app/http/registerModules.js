const { registerApiRoutes } = require('../../shared/http/registerApiRoutes');
const { registerAuthModule } = require('../../modules/auth');
const { registerAdminMapModule } = require('../../modules/admin-map');
const { registerAlertsModule } = require('../../modules/alerts');
const { registerDashboardModule } = require('../../modules/dashboard');
const { registerGeocodingModule } = require('../../modules/geocoding');
const { registerResourcesModule } = require('../../modules/resources');
const { registerSOSModule } = require('../../modules/sos');
const { registerSnapSOSModule } = require('../../modules/snap-sos');

function registerModules(app) {
  const moduleRoutes = [
    ...registerAuthModule(),
    ...registerAdminMapModule(),
    ...registerAlertsModule(),
    ...registerDashboardModule(),
    ...registerGeocodingModule(),
    ...registerResourcesModule(),
    ...registerSOSModule(),
    ...registerSnapSOSModule(),
  ];

  registerApiRoutes(app, moduleRoutes);
}

module.exports = { registerModules };
