# ESLint and ES Modules Guide

This guide provides best practices for using ESLint and ES Modules in Node.js applications to avoid common issues with imports/exports.

## Running ESLint

We have several npm scripts for running ESLint:

```bash
# Run ESLint on the entire project
npm run lint

# Run ESLint with auto-fix
npm run lint:fix

# Lint just the routes
npm run lint:routes

# Lint just the controllers
npm run lint:controllers

# Generate an HTML report
npm run lint:report
```

## Best Practices for ES Modules

### 1. Always Use ES Module Syntax

✅ **DO** use ES module syntax consistently:
```javascript
// Importing
import express from 'express';
import { function1, function2 } from './utils.js';

// Exporting
export const myFunction = () => { /* ... */ };
export default myClass;
```

❌ **DON'T** use CommonJS syntax:
```javascript
// Don't use require
const express = require('express');

// Don't use module.exports
module.exports = { myFunction };
```

### 2. Include the `.js` Extension in Imports

With ES Modules, you must include the `.js` extension in local imports:

✅ **DO** include file extensions:
```javascript
import { myFunction } from './utils.js';
```

❌ **DON'T** omit file extensions:
```javascript
import { myFunction } from './utils'; // This will fail in ES Modules
```

### 3. Keep Function Names Consistent

The most common error we've encountered is function names being different between exports and imports:

✅ **DO** keep function names consistent:
```javascript
// In controller file
export const getUser = async (req, res) => { /* ... */ };

// In routes file
router.get('/:id', userController.getUser);
```

❌ **DON'T** use inconsistent names:
```javascript
// In controller file
export const getUserById = async (req, res) => { /* ... */ };

// In routes file (WRONG - name doesn't match)
router.get('/:id', userController.getUser);
```

### 4. Use Named Exports for Controllers

✅ **DO** use named exports for controller functions:
```javascript
export const getUsers = async (req, res) => { /* ... */ };
export const createUser = async (req, res) => { /* ... */ };
```

❌ **DON'T** use default exports with objects:
```javascript
// This makes importing more complex and error-prone
export default {
  getUsers: async (req, res) => { /* ... */ },
  createUser: async (req, res) => { /* ... */ }
};
```

### 5. Keep Route Ordering in Mind

Express routes are matched in the order they are defined. Place more specific routes before general ones:

✅ **DO** place specific routes first:
```javascript
router.get('/specific-path', handler);
router.get('/:id', idHandler);  // This uses a parameter, so it's more general
```

❌ **DON'T** place parameter routes before specific routes:
```javascript
// This is wrong - '/specific-path' will never be matched
router.get('/:id', idHandler);
router.get('/specific-path', handler);
```

### 6. Import Styles

For importing controller functions in route files, use either:

1. **Named imports with the `*` syntax**:
   ```javascript
   import * as userController from '../controllers/userController.js';
   router.get('/users', userController.getUsers);
   ```

2. **Destructured imports**:
   ```javascript
   import { getUsers, createUser } from '../controllers/userController.js';
   router.get('/users', getUsers);
   ```

Choose one approach and be consistent.

## Tips for Debugging Import/Export Issues

If you encounter issues with imports or exports:

1. Run ESLint on the file with the error: 
   ```bash
   npx eslint path/to/file.js
   ```

2. Check that the export exists in the source file:
   ```bash
   grep -r "export const functionName" ./controllers/
   ```

3. Make sure your function naming is consistent between export and import.

4. Check that all paths include the `.js` extension.

5. For undefined route handlers, check the stacktrace to identify which route is causing the issue, then verify the controller function exists. 