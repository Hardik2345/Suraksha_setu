const { createSOSRouter } = require('./presentation/http/sos.routes');

function registerSOSModule() {
  return [
    {
      basePath: '/api/sos',
      router: createSOSRouter(),
    },
  ];
}

module.exports = { registerSOSModule };
