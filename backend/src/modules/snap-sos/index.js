const { createSnapSOSRouter } = require('./presentation/http/snapSos.routes');

function registerSnapSOSModule() {
  return [
    {
      basePath: '/api/snap-sos',
      router: createSnapSOSRouter(),
    },
  ];
}

module.exports = { registerSnapSOSModule };
