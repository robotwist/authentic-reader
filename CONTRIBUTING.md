# Contributing to Authentic Reader

Thank you for considering contributing to Authentic Reader! This document provides guidelines and workflows to make the contribution process smooth and effective.

## Development Workflow

We follow a strict GitHub workflow to ensure code quality:

1. **Fork the repository** to your personal GitHub account
2. **Create a feature branch** in your fork for your changes
3. **Make your changes** following our coding standards
4. **Write or update tests** for your changes
5. **Submit a pull request** from your fork to the main repository's `main` branch

## Important Note on Branch Protection

All branches in the main repository have branch protection rules applied. This means:

- Direct pushing to any branch in the main repository is restricted
- All changes must go through the fork and pull request workflow
- Pull requests require review before merging
- Code must pass CI checks before it can be merged

## Branching Strategy

When working in your fork:

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

1. Fork the repository on GitHub
2. Clone your fork: `git clone https://github.com/YOUR-USERNAME/authentic-reader.git`
3. Add the upstream repository: `git remote add upstream https://github.com/robotwist/authentic-reader.git`
4. Install dependencies: `npm install`
5. Set up environment variables (see `.env.example`)
6. Start the development server: `npm run dev`

## Keeping Your Fork Updated

Regularly sync your fork with the upstream repository:

```
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

Then create new feature branches from your updated main branch.

## Additional Resources

- [Project README](README.md)
- [Issue Tracker](https://github.com/robotwist/authentic-reader/issues)
- [Code of Conduct](CODE_OF_CONDUCT.md)

## License

By contributing to Authentic Reader, you agree that your contributions will be licensed under the project's license.