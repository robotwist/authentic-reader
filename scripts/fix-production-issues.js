#!/usr/bin/env node

/**
 * Fix Production Issues Script
 * 
 * This script helps identify and fix common production deployment issues
 * for the Authentic Reader application.
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Authentic Reader - Production Issues Fix Script\n');

// Check current environment variables
console.log('📋 Current Environment Configuration:');
console.log('=====================================');

const envVars = {
  'VITE_API_URL': process.env.VITE_API_URL || 'Not set',
  'VITE_BACKEND_URL': process.env.VITE_BACKEND_URL || 'Not set',
  'NODE_ENV': process.env.NODE_ENV || 'Not set'
};

Object.entries(envVars).forEach(([key, value]) => {
  console.log(`${key}: ${value}`);
});

console.log('\n🔍 Issues Found:');
console.log('================');

let issuesFound = 0;

// Check for double /api issue
if (envVars['VITE_API_URL'] && envVars['VITE_API_URL'].endsWith('/api')) {
  console.log('❌ ISSUE: VITE_API_URL ends with /api - this will cause double /api/api/ URLs');
  console.log('   Current: ' + envVars['VITE_API_URL']);
  console.log('   Should be: ' + envVars['VITE_API_URL'].replace('/api', ''));
  issuesFound++;
}

// Check if API URL is set
if (envVars['VITE_API_URL'] === 'Not set') {
  console.log('❌ ISSUE: VITE_API_URL is not set');
  issuesFound++;
}

// Check if backend URL is set
if (envVars['VITE_BACKEND_URL'] === 'Not set') {
  console.log('❌ ISSUE: VITE_BACKEND_URL is not set');
  issuesFound++;
}

if (issuesFound === 0) {
  console.log('✅ No obvious configuration issues found');
} else {
  console.log(`\n⚠️  Found ${issuesFound} issue(s) that need to be fixed`);
}

console.log('\n📝 Fix Instructions:');
console.log('===================');

console.log(`
1. NETLIFY ENVIRONMENT VARIABLES:
   Go to your Netlify dashboard > Site settings > Environment variables
   and update:
   
   VITE_API_URL = https://authentic-reader-api-8b0a83fb7d96.herokuapp.com
   VITE_BACKEND_URL = https://authentic-reader-api-8b0a83fb7d96.herokuapp.com
   
   ⚠️  IMPORTANT: Remove /api from the end of VITE_API_URL

2. REBUILD AND REDEPLOY:
   After updating environment variables, trigger a new build:
   
   - Go to Netlify dashboard > Deploys
   - Click "Trigger deploy" > "Deploy site"
   - Or push a new commit to trigger automatic deployment

3. VERIFY FIXES:
   After deployment, check:
   - Browser console for API errors
   - Network tab for correct API URLs
   - Service worker registration
   
4. TEST ENDPOINTS:
   Test these URLs in your browser:
   - https://authentic-reader-api-8b0a83fb7d96.herokuapp.com/health
   - https://authentic-reader-api-8b0a83fb7d96.herokuapp.com/api/sources/public

5. CLEAR BROWSER CACHE:
   - Clear browser cache and local storage
   - Hard refresh (Ctrl+F5 or Cmd+Shift+R)
   - Check if service worker is updated
`);

console.log('\n🔧 Service Worker Issues:');
console.log('========================');

console.log(`
If you're still seeing service worker errors:

1. Clear service worker:
   - Open browser dev tools
   - Go to Application > Service Workers
   - Click "Unregister" for any existing service workers
   - Refresh the page

2. Check service worker registration:
   - Look for errors in the console
   - Verify the service worker file is being served correctly

3. Verify precache configuration:
   - The service worker should now properly handle the root URL
   - Check that navigateFallback is set to '/index.html'
`);

console.log('\n📞 Need Help?');
console.log('=============');
console.log(`
If issues persist after following these steps:

1. Check Netlify build logs for any build errors
2. Verify the backend API is responding correctly
3. Check browser console for specific error messages
4. Ensure CORS is properly configured on the backend

Common API endpoints to test:
- GET /health
- GET /api/sources/public
- GET /api/articles
`);

console.log('\n✅ Script completed. Follow the instructions above to fix production issues.\n');
