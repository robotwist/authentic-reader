#!/usr/bin/env node

/**
 * This tool scans route files and controller files to check for consistency between them.
 * It identifies controller functions that are referenced in routes but not defined in controllers.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Define paths to scan
const routesDir = path.join(projectRoot, 'routes');
const controllersDir = path.join(projectRoot, 'controllers');

// Store controller exports and route references
const controllerExports = new Map();
const routeReferences = new Map();

/**
 * Extract all named exports from a controller file
 */
function extractControllerExports(fileContent, controllerName) {
  const regex = /export\s+const\s+(\w+)\s*=/g;
  let match;
  const exports = [];

  while ((match = regex.exec(fileContent)) !== null) {
    exports.push(match[1]);
  }

  controllerExports.set(controllerName, exports);
  return exports;
}

/**
 * Extract all controller references from a routes file
 */
function extractRouteReferences(fileContent, routeName) {
  let controllerRefs = new Map();
  
  // Find imports for controllers
  const lines = fileContent.split('\n');
  let currentControllerName = null;
  
  // Find import statements
  for (const line of lines) {
    // Look for star import pattern: import * as userController from '../controllers/userController.js';
    const starImportMatch = line.match(/import\s+\*\s+as\s+(\w+)Controller\s+from\s+['"]\.\.\/controllers\/(\w+)Controller\.js['"]/);
    if (starImportMatch) {
      currentControllerName = starImportMatch[2];
      controllerRefs.set(currentControllerName, []);
    }
    
    // Look for destructuring import pattern: import { fn1, fn2 } from '../controllers/userController.js';
    const destructuredImportMatch = line.match(/import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]\.\.\/controllers\/(\w+)Controller\.js['"]/);
    if (destructuredImportMatch) {
      currentControllerName = destructuredImportMatch[2];
      const functions = destructuredImportMatch[1].split(',').map(f => f.trim());
      controllerRefs.set(currentControllerName, functions);
    }
  }
  
  // Find route handlers using star imports
  for (const line of lines) {
    // Skip comment lines and import lines
    if (line.trim().startsWith('//') || line.includes('import ')) {
      continue;
    }
    
    // Look for controller function calls in route definitions
    // Match pattern like: router.get('/users', userController.getUsers);
    for (const [controllerName, functions] of controllerRefs.entries()) {
      const regex = new RegExp(`${controllerName}Controller\\.(\\w+)(?![\\w.])`, 'g');
      let match;
      while ((match = regex.exec(line)) !== null) {
        const funcName = match[1];
        if (!functions.includes(funcName)) {
          functions.push(funcName);
        }
      }
    }
  }
  
  routeReferences.set(routeName, controllerRefs);
  return controllerRefs;
}

/**
 * Process all controller files
 */
async function processControllers() {
  const files = fs.readdirSync(controllersDir);
  
  for (const file of files) {
    if (file.endsWith('Controller.js')) {
      const filePath = path.join(controllersDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const controllerName = file.replace('.js', '');
      
      console.log(`Processing controller: ${controllerName}`);
      const exports = extractControllerExports(content, controllerName);
      console.log(`  Found ${exports.length} exports`);
    }
  }
}

/**
 * Process all route files
 */
async function processRoutes() {
  const files = fs.readdirSync(routesDir);
  
  for (const file of files) {
    if (file.endsWith('.js') && !file.includes('index')) {
      const filePath = path.join(routesDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const routeName = file.replace('.js', '');
      
      console.log(`Processing route: ${routeName}`);
      const refs = extractRouteReferences(content, routeName);
      
      refs.forEach((functions, controller) => {
        console.log(`  References to ${controller}Controller: ${functions.length}`);
      });
    }
  }
}

/**
 * Check for inconsistencies
 */
function checkConsistency() {
  console.log('\nChecking for inconsistencies...');
  let inconsistenciesFound = false;
  
  routeReferences.forEach((controllerMap, routeName) => {
    controllerMap.forEach((functions, controllerName) => {
      const controllerFunctions = controllerExports.get(controllerName + 'Controller') || [];
      
      for (const func of functions) {
        if (!controllerFunctions.includes(func)) {
          console.log(`❌ ERROR in ${routeName}.js: Function "${func}" is referenced but not exported from ${controllerName}Controller.js`);
          inconsistenciesFound = true;
        }
      }
    });
  });
  
  if (!inconsistenciesFound) {
    console.log('✅ All controller references in routes are valid!');
  }
}

// Main function
async function main() {
  console.log('Checking controller and route consistency...\n');
  
  await processControllers();
  console.log('');
  await processRoutes();
  
  checkConsistency();
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 