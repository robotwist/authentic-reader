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
- [Security](#security)
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

Create a `.env` file in the project root based on the `.env.example` template:

```bash
cp .env.example .env
```

Then edit the `.env` file to add your own API keys:

```
# Root .env
REACT_APP_HF_API_TOKEN=your_hugging_face_token_here
VITE_HF_API_TOKEN=your_hugging_face_token_here
VITE_LOG_LEVEL=info
VITE_API_URL=http://localhost:3000

# server/.env
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/portfolio
JWT_SECRET=your_jwt_secret
```

### Hugging Face API Integration

Authentic Reader uses the Hugging Face Inference API for content analysis features:

1. **Get an API Token**: Visit [Hugging Face](https://huggingface.co/settings/tokens) to create an account and generate an API token.

2. **Create a Fine-Grained Token**: For improved security, we recommend using a fine-grained token with minimal permissions:
   - Select "Read" access only
   - Enable only the "Inference" permission
   - Optionally restrict to only the specific models we use (listed below)

3. **Add to Environment Variables**: Add your token to the `.env` file as shown above. Never commit this file to version control.

4. **Test the Integration**: Use the "Env Test" page in the application to verify your token is loaded correctly, then try the "Analysis Tool" to test the API connection.

5. **Models Used**:
   - Emotion Analysis: `j-hartmann/emotion-english-distilroberta-base`
   - Sentiment Analysis: `distilbert-base-uncased-finetuned-sst-2-english`
   - Entity Detection: `dslim/bert-base-NER`
   - Summarization: `facebook/bart-large-cnn`

**Security Note**: Keep your API tokens secure. See our [Security Guidelines](#security) for best practices.

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

### Frontend Deployment with Netlify

The frontend can be deployed to Netlify using our deployment helper script:

```bash
node scripts/deploy-netlify.js
```

This script will:
1. Build the frontend for production
2. Configure environment variables
3. Deploy to Netlify
4. Set up SPA routing automatically

### Backend Deployment with Heroku

The backend can be deployed to Heroku using our deployment helper script:

```bash
node scripts/deploy-heroku.js
```

This script will:
1. Set up environment variables on Heroku
2. Deploy the server code to Heroku
3. Configure the PostgreSQL database
4. Run migrations if needed

## Architecture

For detailed information about the application architecture, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Security

Authentic Reader takes security seriously, especially regarding API token management and secure coding practices.

### API Tokens and Secrets

To keep your API tokens and secrets secure:

1. **Never commit tokens to Git**: Always store sensitive information in environment variables.

2. **Use the setup script**: Run our setup script to configure your environment:
   ```bash
   node setup-dev.js
   ```

3. **Rotate tokens regularly**: Regenerate your API tokens periodically, especially if you suspect they may have been exposed.

4. **Use fine-grained access**: Create tokens with minimal permissions required for your use case.

5. **Verify .gitignore**: Ensure `.env` files are included in your `.gitignore` file.

6. **Check for accidental commits**: Use tools like `git-secrets` to scan for accidentally committed credentials.

7. **For production**: Set environment variables on your hosting platform rather than using `.env` files.

### Handling Token Exposure

If you suspect an API token has been exposed:

1. **Revoke the token immediately**: Go to [Hugging Face Settings](https://huggingface.co/settings/tokens) and delete the compromised token.

2. **Create a new token**: Generate a fresh token with appropriate permissions.

3. **Update all environments**: Update the token in all your development and production environments.

4. **Monitor usage**: Keep an eye on API usage for any unauthorized access.

### Security Tools

The project includes several security-focused tools:

```bash
# Check for exposed tokens in the codebase
node scripts/check-tokens.js
```

For comprehensive security guidelines, see [SECURITY.md](SECURITY.md).

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
