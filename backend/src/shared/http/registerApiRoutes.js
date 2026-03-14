function registerApiRoutes(app, routes) {
  routes.forEach(({ basePath, router }) => {
    app.use(basePath, router);
  });
}

module.exports = { registerApiRoutes };
