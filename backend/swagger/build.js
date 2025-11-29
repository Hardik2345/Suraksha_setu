const fs = require('fs');
const path = require('path');

// Merge all JSON files under backend/swagger/modules into a single openapi.json
const modulesDir = path.join(__dirname, 'modules');
const outPath = path.join(__dirname, 'openapi.json');

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (Array.isArray(source[key])) {
      target[key] = (target[key] || []).concat(source[key]);
    } else if (source[key] && typeof source[key] === 'object') {
      target[key] = target[key] || {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

function build() {
  const base = {
    openapi: '3.0.3',
    info: { title: 'Suraksha Setu API', version: '1.0.0', description: 'Combined OpenAPI spec (auto-generated)' },
    servers: [{ url: 'http://localhost:6001' }],
    tags: [],
    paths: {},
    components: { schemas: {}, securitySchemes: {} }
  };

  const files = fs.readdirSync(modulesDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const raw = fs.readFileSync(path.join(modulesDir, file), 'utf8');
    try {
      const mod = JSON.parse(raw);
      if (mod.tags) deepMerge(base.tags, mod.tags);
      if (mod.paths) deepMerge(base.paths, mod.paths);
      if (mod.components) deepMerge(base.components, mod.components);
    } catch (err) {
      console.error('Failed to parse', file, err.message);
    }
  }

  fs.writeFileSync(outPath, JSON.stringify(base, null, 2), 'utf8');
  console.log('Built combined OpenAPI spec to', outPath);
}

if (require.main === module) build();

module.exports = { build };
