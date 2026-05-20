const { createGeocodingRouter } = require('./presentation/http/geocoding.routes');

function registerGeocodingModule() {
  return [
    {
      basePath: '/api/geocode',
      router: createGeocodingRouter(),
    },
  ];
}

module.exports = { registerGeocodingModule };
