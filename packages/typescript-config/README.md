# @runsheet/typescript-config

Shared TypeScript configuration for the Pythagoras monorepo.

## Configurations

### `base.json`

Base TypeScript configuration with strict settings for Node.js projects.

**Usage:**

```json
{
  "extends": "@runsheet/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

### `eslint.json`

TypeScript configuration optimized for ESLint with allowJs and noEmit enabled.

**Usage:**

```json
{
  "extends": "@runsheet/typescript-config/eslint.json",
  "include": ["src", "test", "scripts"]
}
```

## Features

- **Strict Mode**: Full TypeScript strict checking enabled
- **ES2022**: Modern JavaScript features
- **NodeNext**: Node.js ESM module resolution
- **Interop**: Synthetic default imports and ESM interop enabled
