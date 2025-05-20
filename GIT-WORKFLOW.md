# Git Workflow Guidelines

This document outlines the best practices for committing and pushing changes to the Authentic Reader repository.

## Commit Best Practices

### 1. Conventional Commits

We use the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages. The commit message should be structured as follows:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

- **Type**: Describes the kind of change (e.g., feat, fix, docs)
- **Scope**: Describes what area of the codebase is affected (e.g., server, client)
- **Description**: A short summary of the code changes
- **Body**: Additional contextual information about the changes
- **Footer**: Information about breaking changes and reference to issues

Example:
```
feat(server): add authentication middleware

Implement JWT-based authentication for API routes

Closes #123
```

### 2. Keep Commits Atomic

Each commit should represent a single logical change. This makes it easier to:
- Review code
- Understand the project history
- Revert changes if necessary
- Cherry-pick commits to other branches

### 3. Write Meaningful Commit Messages

- Be clear and descriptive
- Use the imperative mood ("add" instead of "added")
- Reference issues and pull requests where appropriate

### 4. Commit Early and Often

- Make small, focused commits rather than large, sweeping changes
- Commit related changes together
- Commit unrelated changes separately

## Pre-Commit Checks

Before committing, ensure that:

1. All linting passes (`npm run lint`)
2. Route controller checks pass (`npm run check:routes`)
3. Tests pass if applicable
4. Your code builds successfully

Our pre-commit hooks will automatically check most of these for you.

## Branching Strategy

1. **Main Branch**: Production-ready code
2. **Development Branch**: Integration branch for features
3. **Feature Branches**: For new features, named as `feature/descriptive-name`
4. **Fix Branches**: For bug fixes, named as `fix/descriptive-name`

## Pull Request Process

1. Create a branch for your feature or fix
2. Make your changes in small, logical commits
3. Push your branch to GitHub
4. Create a pull request with a clear description
5. Ensure all checks pass
6. Request code review
7. Address feedback
8. Merge when approved

## Git Commands Reference

### Starting Work

```bash
# Update your main branch
git checkout main
git pull origin main

# Create a new branch
git checkout -b feature/your-feature-name
```

### Making Commits

```bash
# Stage specific files
git add <file1> <file2>

# Stage all changes
git add .

# Commit with message
git commit
# (This will open your editor with the commit template)
```

### Pushing Changes

```bash
# First push (sets up tracking)
git push -u origin feature/your-feature-name

# Subsequent pushes
git push
```

### Keeping Your Branch Updated

```bash
# Get latest changes from main
git checkout main
git pull origin main

# Update your feature branch
git checkout feature/your-feature-name
git merge main
```

## Troubleshooting

### Fixing the Last Commit

```bash
# Edit the last commit message
git commit --amend

# Add forgotten files to the last commit
git add <forgotten-files>
git commit --amend --no-edit
```

### Handling Merge Conflicts

1. Resolve conflicts in the affected files
2. Stage the resolved files with `git add <file>`
3. Complete the merge with `git commit`

---

By following these guidelines, we maintain a clean, useful history that makes our project easier to maintain and collaborate on.

## Practical Guide: Committing and Pushing Changes

This section provides a step-by-step guide on how to commit and push changes to GitHub following our best practices.

### Initial Setup (One-time)

1. Run our Git hooks setup script:
   ```bash
   npm run setup:git
   ```
   This will set up Husky, commit message validation, and pre-commit hooks.

2. Verify that the hooks are installed:
   ```bash
   ls -la .husky
   ```
   You should see `pre-commit` and `commit-msg` files.

### Daily Workflow

#### 1. Create or checkout a branch

For a new feature:
```bash
git checkout -b feature/your-descriptive-feature-name
```

For a bug fix:
```bash
git checkout -b fix/issue-description
```

#### 2. Make your changes

Work on your feature or fix, creating focused changes.

#### 3. Check status and stage files

```bash
# See what files have been modified
git status

# Stage specific files 
git add path/to/file1 path/to/file2

# Or stage all changes
git add .
```

#### 4. Run pre-commit checks manually (optional)

Our hooks will run these automatically, but you can check in advance:
```bash
# Check linting
cd server && npm run lint

# Check route-controller consistency
cd server && npm run check:routes
```

#### 5. Commit changes

```bash
git commit
```

This will open your editor with our commit message template. Fill it out following the conventional commits format:
```
feat(scope): concise description of the change

More detailed explanation if needed.

Closes #123
```

If the commit fails due to linting or message format issues, fix them and try again.

#### 6. Push changes to GitHub

First push to a new branch:
```bash
git push -u origin your-branch-name
```

Subsequent pushes:
```bash
git push
```

#### 7. Create a Pull Request

Go to the repository on GitHub and create a new Pull Request from your branch.

### Example Workflow

```bash
# Start a new feature
git checkout -b feature/user-preferences

# Make changes to files...

# Stage changes
git add server/controllers/userController.js server/routes/user.js

# Commit changes
git commit
# (Editor opens with commit template)
# Enter: feat(user): add preferences API endpoints

# Push to GitHub
git push -u origin feature/user-preferences

# Create PR on GitHub
```

### Troubleshooting Commits

If your commit fails with a linting error:
1. Fix the issues reported
2. Stage the changes: `git add .`
3. Try committing again: `git commit`

If your commit fails with a commit message format error:
1. Make sure you're following the conventional commits format
2. Try again with a properly formatted message 