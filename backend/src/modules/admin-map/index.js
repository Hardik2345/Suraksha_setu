const { createOutbreakMapRouter } = require('./presentation/http/outbreakMap.routes');

function registerAdminMapModule() {
  return [
    {
      basePath: '/api/admin',
      router: createOutbreakMapRouter(),
    },
  ];
}

module.exports = { registerAdminMapModule };
