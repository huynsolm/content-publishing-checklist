# Architecture

## Runtime
`index.html` loads `src/app.js` as an ES module. `app.js` owns DOM rendering, form/filter events, confirmation, and `localStorage`. `src/checklist.js` is a dependency-free pure domain module shared by app and Node tests.

## Data flow
1. Load JSON array from localStorage key `content-publishing-checklist.releases.v1`.
2. Normalize stored releases through domain helpers.
3. Render releases according to the selected filter.
4. User actions create, toggle, or delete immutable release records.
5. Save the resulting array to localStorage and render it.

## Files
- `src/checklist.js`: checklist definition, validation, creation, progress, status, filtering, mutation helpers.
- `src/app.js`: browser UI integration.
- `tests/checklist.test.js`: Node unit tests for all domain behavior.

## Commands
- `npm test`: Node test suite.
- `npm run lint`: syntax validation for JavaScript modules.
- `npm start`: temporary static HTTP server.
