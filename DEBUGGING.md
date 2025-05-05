# Debugging Guide

This document provides guidance for debugging common issues in the Portfolio Website application.

## Table of Contents

- [TypeScript Errors](#typescript-errors)
- [React Component Issues](#react-component-issues)
- [API Connection Problems](#api-connection-problems)
- [Loading State Problems](#loading-state-problems)
- [RSS Feed Issues](#rss-feed-issues)
- [Performance Problems](#performance-problems)
- [Build and Deployment Issues](#build-and-deployment-issues)
- [Adding Debugging Logs](#adding-debugging-logs)

## TypeScript Errors

### "Objects are not valid as a React child" Error

**Symptoms:**
- Error message: "Objects are not valid as a React child (found: object with keys {_, type})"
- Application crashes when rendering a component

**Cause:**
This typically occurs when trying to render an object (like a complex GUID structure) directly in JSX.

**Solution:**
Use the `extractGuidString` utility function to ensure the GUID is converted to a string:

```typescript
// Instead of this:
<div>{article.guid}</div>

// Do this:
import { extractGuidString } from '../utils/guidUtils';
<div>{extractGuidString(article.guid)}</div>
```

### Type Incompatibility Errors

**Symptoms:**
- Error messages like "Type 'X' is not assignable to type 'Y'"
- Build failure due to TypeScript compilation errors

**Cause:**
Mismatched types between interfaces, especially when working with RSS feed data.

**Solution:**
1. Check the types defined in `src/types/index.ts`
2. Use type guards to safely handle type conversions:

```typescript
// Example type guard
function isRSSArticle(article: any): article is RSSArticle {
  return article && typeof article.guid !== 'undefined';
}

// Usage
if (isRSSArticle(item)) {
  // Safe to use RSSArticle properties
}
```

### Circular Dependency Errors

**Symptoms:**
- Error message about circular dependencies
- Unexpected undefined values in imported modules

**Solution:**
1. Use interface-only imports where possible
2. Refactor to use a centralized type definition file
3. Implement the "barrel" pattern for exports
4. For React hooks, use React.useRef to break circular references

## React Component Issues

### Infinite Rendering Loops

**Symptoms:**
- Browser becomes unresponsive
- Console shows repetitive rendering logs
- Memory usage spikes

**Cause:**
Usually caused by state updates in useEffect without proper dependency arrays.

**Solution:**
1. Check useEffect dependency arrays:

```typescript
// Problematic - will cause infinite loop
useEffect(() => {
  setData(transformData(data));
}, [data]); // data changes, effect runs, updates data, effect runs again...

// Fixed version
useEffect(() => {
  const transformed = transformData(data);
  if (JSON.stringify(transformed) !== JSON.stringify(data)) {
    setData(transformed);
  }
}, [data]);

// Better version
const prevDataRef = useRef(data);
useEffect(() => {
  if (prevDataRef.current !== data) {
    setData(transformData(data));
    prevDataRef.current = data;
  }
}, [data]);
```

2. Use functional updates for setState:

```typescript
// Instead of:
setCounter(counter + 1);

// Use:
setCounter(prev => prev + 1);
```

### Component Not Rendering or Updating

**Symptoms:**
- UI doesn't reflect the current state
- Component doesn't re-render when props change

**Cause:**
Issues with React's rendering cycle, props, or state management.

**Solution:**
1. Check if key props are provided correctly for lists
2. Verify state updates are happening as expected
3. Ensure parent components are re-rendering
4. Add debugging logs around render functions:

```typescript
console.log('Component rendering with props:', props);
console.log('Current state:', state);
```

## API Connection Problems

### CORS Errors

**Symptoms:**
- Console error: "Access to fetch at 'X' from origin 'Y' has been blocked by CORS policy"
- API calls fail in the browser but work in Postman

**Solution:**
1. Ensure the backend has proper CORS headers:

```javascript
// In server/index.js
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

2. Check if the API URL is correct in the environment variables

### API Timeouts

**Symptoms:**
- Requests hang for a long time before failing
- Console error: "Timeout of X ms exceeded"

**Solution:**
1. Implement timeout handling in API calls:

```typescript
const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`);
    }
    throw error;
  }
};
```

2. Ensure the backend server has proper timeout handling

### Authentication Issues

**Symptoms:**
- 401 Unauthorized errors
- User gets logged out unexpectedly

**Solution:**
1. Check JWT token expiration and refresh token mechanism
2. Verify localStorage is persisting auth tokens correctly
3. Implement proper error handling for auth failures

## Loading State Problems

### Stuck in Loading State

**Symptoms:**
- Loading spinner never disappears
- Application appears frozen in loading state

**Cause:**
Usually due to unresolved promises or errors in asynchronous code.

**Solution:**
1. Ensure all promise chains have proper error handling:

```typescript
const fetchData = async () => {
  setLoading(true);
  try {
    const result = await api.getData();
    setData(result);
  } catch (error) {
    console.error('Error fetching data:', error);
    setError(error.message);
  } finally {
    setLoading(false); // Always execute this
  }
};
```

2. Add timeout handling to prevent infinite loading:

```typescript
useEffect(() => {
  let timeoutId;
  
  if (loading) {
    timeoutId = setTimeout(() => {
      setLoading(false);
      setError('Request timed out. Please try again.');
    }, 15000); // 15 seconds timeout
  }
  
  return () => {
    if (timeoutId) clearTimeout(timeoutId);
  };
}, [loading]);
```

3. Add debugging logs to trace loading state changes:

```typescript
useEffect(() => {
  console.log('Loading state changed:', loading);
}, [loading]);
```

## RSS Feed Issues

### Feed Parsing Errors

**Symptoms:**
- Error message: "Failed to parse RSS feed"
- No articles displayed after refresh

**Cause:**
Different RSS feed formats or unexpected feed structure.

**Solution:**
1. Add better error handling in the RSS parser
2. Implement fallbacks for different feed formats
3. Add detailed logging to identify the problematic feed:

```typescript
try {
  console.log('Parsing feed from:', feedUrl);
  const feed = await parseFeed(feedXml);
  console.log('Successfully parsed feed:', feedUrl);
  return feed;
} catch (error) {
  console.error('Error parsing feed from', feedUrl, ':', error);
  console.log('Feed content sample:', feedXml.substring(0, 500));
  throw error;
}
```

### GUID Handling Issues

**Symptoms:**
- Duplicate articles in the feed
- Articles not being marked as read correctly

**Cause:**
Inconsistent handling of article GUID formats.

**Solution:**
Use the `guidUtils` functions consistently:

```typescript
// Always use compareGuids for comparison
if (compareGuids(article.guid, savedGuid)) {
  // They match
}

// Always use extractGuidString for rendering or using as keys
<div key={extractGuidString(article.guid)}>...</div>
```

## Performance Problems

### Slow Rendering with Large Article Lists

**Symptoms:**
- UI becomes sluggish when many articles are loaded
- High CPU usage when scrolling through articles

**Solution:**
1. Implement virtualization for long lists:

```jsx
import { FixedSizeList } from 'react-window';

const ArticleList = ({ articles }) => (
  <FixedSizeList
    height={500}
    width="100%"
    itemCount={articles.length}
    itemSize={150}
  >
    {({ index, style }) => (
      <div style={style}>
        <ArticleCard article={articles[index]} />
      </div>
    )}
  </FixedSizeList>
);
```

2. Implement pagination instead of loading all articles at once
3. Optimize ArticleCard rendering with React.memo:

```jsx
const ArticleCard = React.memo(({ article }) => {
  // Component logic here
});
```

### Memory Leaks

**Symptoms:**
- Memory usage grows over time
- Application becomes slower the longer it runs

**Cause:**
Usually caused by unremoved event listeners or uncleared timeouts/intervals.

**Solution:**
1. Clean up resources in useEffect return functions:

```jsx
useEffect(() => {
  const interval = setInterval(refreshData, 60000);
  window.addEventListener('resize', handleResize);
  
  return () => {
    clearInterval(interval);
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

2. Use the React DevTools Profiler to identify components that re-render excessively

## Build and Deployment Issues

### Build Fails

**Symptoms:**
- Error message during `npm run build`
- CI/CD pipeline failure

**Solution:**
1. Check for TypeScript errors
2. Ensure all dependencies are installed correctly
3. Check for environment variables that might be missing in the build environment
4. Try with a clean install:

```bash
rm -rf node_modules
npm install
npm run build
```

### Application Works Locally But Not in Production

**Symptoms:**
- App works fine in development but fails in production

**Solution:**
1. Check for environment-specific code
2. Ensure all API URLs use environment variables
3. Verify that all required environment variables are set in production
4. Check for paths issues (dev uses relative paths, production might use absolute paths)

## Adding Debugging Logs

### Structured Console Logging

Use structured logging with prefixes to make logs easier to find and filter:

```typescript
// Add debugging utilities
const debug = {
  api: (message: string, ...args: any[]) => console.log(`🌐 [API]`, message, ...args),
  render: (message: string, ...args: any[]) => console.log(`🎨 [Render]`, message, ...args),
  state: (message: string, ...args: any[]) => console.log(`📊 [State]`, message, ...args),
  error: (message: string, ...args: any[]) => console.error(`❌ [Error]`, message, ...args),
  feed: (message: string, ...args: any[]) => console.log(`📰 [Feed]`, message, ...args),
};

// Usage
debug.api('Fetching from endpoint:', url);
debug.state('State updated:', newState);
debug.error('Failed to load article:', error);
```

### Component Lifecycle Tracing

Add logs to trace component lifecycles:

```jsx
function ArticleList({ articles }) {
  console.log('⚡ ArticleList rendering with', articles.length, 'articles');
  
  useEffect(() => {
    console.log('⚡ ArticleList mounted');
    return () => console.log('⚡ ArticleList unmounted');
  }, []);
  
  useEffect(() => {
    console.log('⚡ ArticleList articles changed to', articles.length, 'articles');
  }, [articles]);
  
  // Component render logic...
}
```

### Network Request Logging

Add detailed logging for network requests:

```typescript
const fetchArticles = async (sources) => {
  console.log('📡 Fetching articles for sources:', sources.map(s => s.name).join(', '));
  const startTime = performance.now();
  
  try {
    const articles = await Promise.all(sources.map(fetchArticlesFromSource));
    const endTime = performance.now();
    console.log(`✅ Fetched ${articles.flat().length} articles in ${(endTime - startTime).toFixed(0)}ms`);
    return articles.flat();
  } catch (error) {
    console.error('❌ Error fetching articles:', error);
    throw error;
  }
};
```

### Using Browser DevTools

1. Use the "Network" tab to monitor API calls
2. Use the "Performance" tab to profile rendering performance
3. Use the "Memory" tab to check for memory leaks
4. Use conditional breakpoints to debug specific scenarios:
   - Right-click on a line number in DevTools
   - Select "Add conditional breakpoint"
   - Enter a condition like `articles.length > 10`

Remember to remove or disable debugging logs before deploying to production! 