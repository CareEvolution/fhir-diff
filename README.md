# FHIR Diff

This library performs a diff between two FHIR bundles.

## Development Details

The code is written in TypeScript, with a couple of JavaScript config files. The package.json file indicates this is an ECMAScript (ES) module, so the JavaScript config files use `import` rather than `require`. However, when we build, we generate both ES and CommonJS module files so that this can be used in both frontend (browser) and backend (Node) settings.

- Primary language: Typescript
- Secondary language: JavaScript (ES Module flavor)
- Testing framework: Jest
- Linting framework: eslint
- Builder: rollup
- Builds to: CommonJS and ES modules
