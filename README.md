# FHIR Diff

This library performs a diff between two FHIR bundles.

## Development Details

The code is written in TypeScript, with some JavaScript config files. We are writing this for the Node.js environment, because that is the lowest common denominator for where we want to use this library.

- Primary language: Typescript
- Secondary language: JavaScript (Node flavor)
- Testing framework: Jest
- Linting framework: eslint
- Builder: tsc
- Builds to: CommonJS module

## Publish

To publish a new version of the module:

- Update the version in the package.json file
- Commit and push all changes `git commit` and `git push`
- Tag the repo: `git tag x.y.z`
- Push the tag: `git push --tags`

## Prerelease

To publish a new prerelease version of the module:

- update the version in the package.json file to a prerelease version (e.g., `1.0.0-mybranch001`)
- run `npm ci`
- run `npm run build`
- run `npm publish ./dist`

Then in the consuming project:

```
npm install --save @careevolution/fhir-diff@1.0.0-mybranch001
```
