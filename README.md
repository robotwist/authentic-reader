# Authentic Reader - News Aggregator

Authentic Reader is a powerful news aggregation platform designed to enhance your reading experience with a focus on reliability, bias detection, and content analysis.

## Features

- RSS Feed aggregation from reliable sources
- Content analysis for bias and quality assessment
- Article categorization and filtering
- Personalized reading experience
- Offline reading capability
- Dark mode support

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Installation

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn

### Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/authentic-reader.git
cd authentic-reader
```

2. Install frontend dependencies:

```bash
npm install
```

3. Install backend dependencies:

```bash
cd server
npm install
cd ..
```

3. Set up environment variables:

Create a `.env` file in the project root and another in the `server` directory with the following variables:

```
# Root .env
VITE_API_URL=http://localhost:3000

# server/.env
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/portfolio
JWT_SECRET=your_jwt_secret
```

## Quick Start

To start both the frontend and backend servers concurrently:

```bash
npm run dev
```

Or start them separately:

```bash
# Start frontend (development)
npm run frontend

# Start backend
npm run backend
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

## Development

### Project Structure

The project follows a clear separation between frontend and backend:

- `/src`: Frontend React application
- `/server`: Backend Node.js application
- `/public`: Static assets

For detailed architecture information, see [ARCHITECTURE.md](ARCHITECTURE.md).

### Frontend Development

The frontend is built with:
- React (with functional components and hooks)
- TypeScript
- CSS Modules
- Vite

Key commands:

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend Development

The backend is built with:
- Node.js
- Express
- TypeScript
- PostgreSQL (with Sequelize ORM)

Key commands:

```bash
# Start backend server
cd server
npm run dev

# Build backend
npm run build

# Start production server
npm run start
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run frontend tests
npm run test:frontend

# Run backend tests
npm run test:backend

# Run with coverage report
npm run test:coverage
```

### Writing Tests

- Frontend: Jest and React Testing Library
- Backend: Jest and Supertest

Example test:

```typescript
import { render, screen } from '@testing-library/react';
import ArticleCard from '../components/ArticleCard';

test('renders article title', () => {
  const article = {
    title: 'Test Article',
    link: 'https://example.com',
    guid: '12345',
    pubDate: new Date().toISOString(),
  };
  
  render(<ArticleCard article={article} />);
  expect(screen.getByText('Test Article')).toBeInTheDocument();
});
```

## Deployment

### Frontend Deployment

Build the frontend for production:

```bash
npm run build
```

The output will be in the `dist` directory, which can be deployed to any static hosting service like Netlify, Vercel, or AWS S3.

### Backend Deployment

Build the backend for production:

```bash
cd server
npm run build
```

The compiled JavaScript will be in the `dist` directory. Deploy to a Node.js hosting service like Heroku, DigitalOcean, or AWS EC2.

## Architecture

For detailed information about the application architecture, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure you follow the coding standards and include tests for new features.

## Troubleshooting

### Common Issues

**API Connection Issues**
- Verify the backend server is running
- Check that environment variables are configured correctly
- Inspect the browser console for CORS errors

**Build Failures**
- Clear node_modules and reinstall dependencies
- Verify TypeScript types are correct
- Check for linter errors with `npm run lint`

**Performance Issues**
- Check for unnecessary re-renders using React DevTools
- Verify large data sets are properly paginated
- Ensure images are properly optimized

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

Your Name - [@your_twitter](https://twitter.com/your_twitter) - email@example.com

Project Link: [https://github.com/yourusername/authentic-reader](https://github.com/yourusername/authentic-reader)
