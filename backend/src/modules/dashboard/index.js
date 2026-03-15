const {
  createCitizenDashboardRouter,
  createAdminDashboardRouter,
} = require('./presentation/http/dashboard.routes');

function registerDashboardModule() {
  return [
    {
      basePath: '/api/dashboard',
      router: createCitizenDashboardRouter(),
    },
    {
      basePath: '/api/admin',
      router: createAdminDashboardRouter(),
    },
  ];
}

module.exports = { registerDashboardModule };
