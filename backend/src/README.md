# Backend Modular Monolith Scaffold

This `src/` tree is the incremental migration target for the backend modular monolith refactor.

Current status:

- route composition now flows through `src/app/http/registerModules.js`
- `auth` is the first extracted module under `src/modules/auth`
- `alerts` is extracted under `src/modules/alerts`
- `sos` is extracted under `src/modules/sos`
- `resources` is extracted under `src/modules/resources`
- `dashboard` is extracted under `src/modules/dashboard`
- legacy features are still mounted from `backend/routes/*` through the central registrar

Migration rule for the next modules:

1. create a module under `src/modules/<module-name>`
2. move route/controller logic into that module first
3. keep external HTTP behavior stable while the module is being extracted
4. point any legacy route/controller entrypoints at the new module to avoid duplicate implementations
5. only remove legacy files after the module is fully migrated

Target layering inside a module:

```text
modules/<module-name>/
  application/
  domain/
  infrastructure/
  presentation/
```

`shared/` is reserved for cross-cutting technical helpers, not business logic.
