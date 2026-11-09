# Architecture Documentation

## Overview

This document outlines the architecture of the Portfolio Website, a news aggregation platform built with React, TypeScript, and Node.js. 

The application is structured to provide a resilient and maintainable codebase with a focus on:
- Type safety
- Component reusability
- Clear separation of concerns
- Consistent error handling
- Performance optimization

## Directory Structure

```
/
├── src/                  # Frontend application code
│   ├── assets/           # Static assets like images
│   ├── components/       # React components
│   ├── contexts/         # React context providers
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API and data services
│   ├── styles/           # CSS and styling modules
│   │   └── modules/      # CSS modules and variables
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
│
├── server/               # Backend Node.js application
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Express middleware
│   ├── models/           # Sequelize data models
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic services
│   └── utils/            # Utility functions
│
└── public/               # Static public files
```

## Type System

The application uses a centralized type system to ensure consistency across components and services. The core types are defined in `src/types/index.ts`.

### Key Type Definitions

#### Data Types

- `RSSSource` & `APISource`: Represent RSS feed sources
- `RSSArticle` & `APIArticle`: Represent news articles
- `GUID`: Union type for handling RSS GUID values (can be string or object)
- `User` & `UserPreferences`: Represent user data

#### Type Guards

Type guards are used to safely differentiate between similar types:

```typescript
// Example type guard for checking if a value is an API source
function isAPISource(source: any): source is APISource {
  return source && typeof source.id === 'number';
}
```

#### Utility Functions

The type system includes utility functions for type conversions:

```typescript
// Convert any source type to RSSSource format
function toRSSSource(source: BaseSource | APISource | any): RSSSource {
  // conversion logic
}
```

## Service Architecture

The application follows a service-oriented architecture:

### API Service

The `apiService.ts` handles all communication with the backend API:
- Authentication (login, register, logout)
- User profile management
- Sources and subscriptions
- Article operations (marking as read/saved)

### RSS Service

The `rssService.ts` handles fetching and parsing RSS feeds:
- Parsing various RSS formats (RSS, Atom, RDF)
- Converting raw feed items to application data structures
- Handling network timeouts and errors
- Fallback mechanisms for offline use

### Storage Service

The `storageService.ts` provides local storage capabilities:
- IndexedDB for article storage
- LocalStorage for user preferences
- Caching strategies for offline use

## Component Architecture

Components follow a hierarchical structure:

1. **Layout Components**: Define the overall page structure
2. **Container Components**: Manage data and state
3. **Presentation Components**: Render UI based on props
4. **Utility Components**: Reusable, generic UI elements

### Key Components

- `FeedContainer`: Main container for displaying articles
- `ArticleCard`: Presentation component for individual articles
- `FilterPanel`: Controls for filtering article feed
- `ArticleAnalysis`: Displays content analysis results

## State Management

The application uses React's built-in state management with Context API and custom hooks:

- `AuthContext`: Manages user authentication state
- `useArticles`: Core hook for article data and operations
- `usePreferences`: Manages user preferences

## Error Handling

A consistent error handling strategy is implemented:

1. Service-level errors are captured and transformed into `ApiError` instances
2. Components use try/catch blocks for async operations
3. Error states are properly displayed to users
4. Fallback mechanisms are provided where possible

## CSS Architecture

The styling system uses CSS modules with variables for consistency:

- Global variables defined in `variables.css`
- Component-specific styles in dedicated CSS modules
- Responsive design using CSS Grid and Flexbox
- Dark mode support via CSS variables

## Performance Optimizations

- Timeout handling for network requests
- Pagination of large article lists
- Memoization of expensive calculations
- Lazy loading of images and content
- Debounced search and filter operations

## Testing Strategy

- Unit tests for utility functions and hooks
- Integration tests for components and services
- End-to-end tests for critical user flows
- Jest for test running and assertions
- React Testing Library for component testing

## Security Considerations

- JWT-based authentication
- Input validation on all forms
- CORS protection for API endpoints
- Content Security Policy implementation
- Sanitization of user-generated content

## Future Enhancements

- Implement PWA capabilities for offline use
- Add social sharing features
- Enhance content analysis with AI
- Add email digest subscriptions
- Create mobile app versions

## Development Guidelines

### Adding New Features

1. Define types in `types/index.ts`
2. Implement service functions in appropriate service files
3. Create/update React hooks as needed
4. Build UI components
5. Add tests

### Fixing Issues

1. Identify the root cause using the error messaging
2. Check type definitions for inconsistencies
3. Use type guards for safe type assertions
4. Add appropriate error handling
5. Update tests to cover the fixed scenario

### Code Style

- Use TypeScript for all new code
- Follow ESLint rules for consistent style
- Use functional components with hooks
- Write descriptive comments for complex logic
- Use named exports for better tooling support 