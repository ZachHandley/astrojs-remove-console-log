# Astro Console Cleaner

An Astro integration that removes `console.log`, `console.warn`, and `console.error` statements from your code during the build process.

## Installation

```sh
npm install astro-console-cleaner
```

## Usage

Add the integration to your `astro.config.mjs` file:

```javascript
import { defineConfig } from 'astro/config';
import astroConsoleCleaner from 'astro-console-cleaner';

export default defineConfig({
  integrations: [astroConsoleCleaner()],
});
```

This integration will remove all `console.log`, `console.warn`, and `console.error` statements from your code during the build process. It will not affect your development environment.

## License

MIT
