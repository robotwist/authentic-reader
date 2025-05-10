# Contributing to Authentic Reader

Thank you for considering contributing to Authentic Reader! This document provides guidelines and workflows to make the contribution process smooth and effective.

## Development Workflow

We follow a GitHub Flow workflow:

1. **Fork the repository** (external contributors) or **create a new branch** (core team members)
2. **Create a feature branch** for your changes
3. **Make your changes** following our coding standards
4. **Write or update tests** for your changes
5. **Submit a pull request** against the `main` branch

## Branching Strategy

- `main` branch is the default branch and is protected
- Feature branches should be named following this convention:
  - `feature/short-description` for new features
  - `bugfix/issue-number-short-description` for bug fixes
  - `docs/short-description` for documentation changes
  - `refactor/short-description` for code refactoring

## Commit Messages

Write clear, concise commit messages that explain what changes were made and why:

```
feat: Add article sentiment analysis feature

Implement sentiment analysis for extracted article content using the
Hugging Face API. This helps users understand the emotional tone of
articles they're reading.
```

We loosely follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

## Pull Request Process

1. Update the README.md or documentation with details of changes if necessary
2. Update the CHANGELOG.md with details of changes if necessary
3. The PR should work on all supported browsers and platforms
4. The PR requires approval from at least one maintainer before merging
5. Squash commits when merging to keep the main branch history clean

## Code Standards

- Follow the existing code style in the project
- Use TypeScript for frontend code
- Use ESLint and Prettier for code formatting
- Write unit tests for new features and bug fixes
- Ensure all tests pass before submitting a PR

## Setting Up Development Environment

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Start the development server: `npm run dev`

## Additional Resources

- [Project README](README.md)
- [Issue Tracker](https://github.com/robotwist/authentic-reader/issues)
- [Code of Conduct](CODE_OF_CONDUCT.md)

## License

By contributing to Authentic Reader, you agree that your contributions will be licensed under the project's license. 