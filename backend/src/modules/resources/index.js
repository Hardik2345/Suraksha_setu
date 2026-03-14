const { createResourcesRouter } = require('./presentation/http/resources.routes');

function registerResourcesModule() {
  return [
    {
      basePath: '/api/resources',
      router: createResourcesRouter(),
    },
  ];
}

module.exports = { registerResourcesModule };
