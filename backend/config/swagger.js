/*
  Serve a single consolidated OpenAPI spec from `backend/swagger/openapi.json`.
  The repo contains per-module JSON files under `backend/swagger/` for maintainability; this module exports the combined spec object.
*/

const path = require('path');
const fs = require('fs');

const specPath = path.join(__dirname, '..', 'swagger', 'openapi.json');
let swaggerSpec = {};
try {
  const raw = fs.readFileSync(specPath, 'utf8');
  swaggerSpec = JSON.parse(raw);
} catch (err) {
  // Fall back to an empty spec so server still starts even if file missing
  console.error('Failed to load OpenAPI spec from', specPath, err && err.message);
  swaggerSpec = { openapi: '3.0.3', info: { title: 'Suraksha Setu API', version: '1.0.0' }, paths: {} };
}

module.exports = swaggerSpec;
