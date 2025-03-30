# Migration from react-scripts to Vite

## Overview
This document outlines the migration process from react-scripts (Create React App) to Vite for the "Who What Where" application's frontend. The migration was performed to improve development experience, build performance, and to use a maintained and supported build tool.

## Why Vite?
React Scripts (part of Create React App) has been deprecated and is no longer being actively maintained. Vite offers several advantages:

1. Faster development server startup and hot module replacement
2. Improved build times
3. Better ESM support
4. Active maintenance
5. Simpler configuration
6. Better TypeScript support

## Changes Made

### Dependencies
- Added prop-types package which is required by components but not automatically included with Vite
- Updated package.json dependencies to match Vite requirements

### Configuration Files
- Added `vite.config.js` - Main Vite configuration file
- Updated `tailwind.config.js` - Changed from CommonJS to ESM format
- Added `postcss.config.js` - Explicit PostCSS configuration for Vite
- Moved `index.html` from the public folder to the root directory
- Created `.env` file with Vite-specific environment variable naming

### Package.json Changes
- Added Vite development dependencies
- Removed react-scripts
- Updated scripts section to use Vite commands
- Added `"type": "module"` to enable ESM by default
- Added Vitest for testing

### Environment Variables
- Changed environment variable naming from `REACT_APP_*` to `VITE_*`
- Added Vite-specific environment configuration

### Code Changes
- Updated environment variable references in code
- Ensured proper paths for static assets

## How to Run
- Development: `npm run start`
- Production build: `npm run build`
- Preview production build: `npm run preview`
- Testing: `npm run test` or `npm run test:watch`

## Known Issues
- Some libraries may not be fully compatible with ESM and may require additional configuration
- If CSS modules are used, the naming convention might need adjustments
- Test files may need updates to work with Vitest instead of Jest
- Files with JSX syntax should use the .jsx extension rather than .js to avoid import analysis errors
- The migration script automatically renames index.js to index.jsx to address this issue

## Reverting the Migration
If issues arise, you can revert to the previous setup using the backup files stored in the backup folder:
```bash
# From the project root
cp -r backup/frontend/* frontend/
cd frontend
npm install
```

## References
- [Vite Documentation](https://vitejs.dev/guide/)
- [Vite Configuration Reference](https://vitejs.dev/config/)
- [Migrating from CRA](https://vitejs.dev/guide/migration-from-cra.html)
