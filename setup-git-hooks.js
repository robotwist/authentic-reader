#!/usr/bin/env node

/**
 * Git Hooks Setup Script
 * 
 * This script automates the setup of Git hooks for the Authentic Reader project.
 * It ensures that:
 * 1. Husky is installed and initialized
 * 2. Git is configured to use our commit message template
 * 3. All hook scripts are executable
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

console.log(`${colors.blue}========================================${colors.reset}`);
console.log(`${colors.blue}  Authentic Reader Git Hooks Setup${colors.reset}`);
console.log(`${colors.blue}========================================${colors.reset}\n`);

try {
  // Step 1: Verify Husky is installed
  console.log(`${colors.yellow}Verifying dependencies...${colors.reset}`);
  
  try {
    execSync('npm list husky');
    console.log(`${colors.green}✓ Husky is installed${colors.reset}`);
  } catch (error) {
    console.log(`${colors.yellow}Installing husky...${colors.reset}`);
    execSync('npm install --save-dev husky @commitlint/cli @commitlint/config-conventional', { stdio: 'inherit' });
  }
  
  // Step 2: Create husky directory if it doesn't exist
  const huskyDir = path.join(process.cwd(), '.husky');
  if (!fs.existsSync(huskyDir)) {
    console.log(`${colors.yellow}Creating .husky directory...${colors.reset}`);
    fs.mkdirSync(huskyDir, { recursive: true });
  }
  
  // Step 3: Setup pre-commit hook
  console.log(`${colors.yellow}Setting up pre-commit hook...${colors.reset}`);
  const preCommitPath = path.join(huskyDir, 'pre-commit');
  
  if (!fs.existsSync(preCommitPath)) {
    const preCommitContent = `#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Skip hooks on merge commits
if git rev-parse -q --verify MERGE_HEAD; then
  exit 0
fi

# Lint server code
cd server && npm run lint
if [ $? -ne 0 ]; then
  echo "Server linting failed! Fix the errors before committing."
  exit 1
fi

# Check route-controller consistency
cd server && npm run check:routes
if [ $? -ne 0 ]; then
  echo "Route-controller check failed! Fix the errors before committing."
  exit 1
fi

# Uncomment to lint React code once a linting command is set up
# cd client && npm run lint
# if [ $? -ne 0 ]; then
#   echo "Client linting failed! Fix the errors before committing."
#   exit 1
# fi

exit 0
`;
    fs.writeFileSync(preCommitPath, preCommitContent);
    execSync(`chmod +x ${preCommitPath}`);
    console.log(`${colors.green}✓ Pre-commit hook created${colors.reset}`);
  } else {
    console.log(`${colors.green}✓ Pre-commit hook already exists${colors.reset}`);
  }
  
  // Step 4: Setup commit-msg hook
  console.log(`${colors.yellow}Setting up commit-msg hook...${colors.reset}`);
  const commitMsgPath = path.join(huskyDir, 'commit-msg');
  
  if (!fs.existsSync(commitMsgPath)) {
    const commitMsgContent = `#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx --no -- commitlint --edit ${1}
`;
    fs.writeFileSync(commitMsgPath, commitMsgContent);
    execSync(`chmod +x ${commitMsgPath}`);
    console.log(`${colors.green}✓ Commit-msg hook created${colors.reset}`);
  } else {
    console.log(`${colors.green}✓ Commit-msg hook already exists${colors.reset}`);
  }
  
  // Step 5: Configure Git to use commit message template
  console.log(`${colors.yellow}Setting up commit message template...${colors.reset}`);
  execSync('git config --local commit.template .gitmessage');
  console.log(`${colors.green}✓ Git configured to use commit message template${colors.reset}`);
  
  console.log(`\n${colors.green}Git hooks setup completed successfully!${colors.reset}`);
  console.log(`${colors.blue}-------------------------------------------${colors.reset}`);
  console.log(`${colors.yellow}What happens now:${colors.reset}`);
  console.log(`${colors.yellow}1. Pre-commit hook will run linting and route checks${colors.reset}`);
  console.log(`${colors.yellow}2. Commit messages will be validated against the conventional commits format${colors.reset}`);
  console.log(`${colors.yellow}3. A commit message template will be used when you run 'git commit'${colors.reset}`);
  console.log(`\n${colors.yellow}For more details, see GIT-WORKFLOW.md${colors.reset}`);
  
} catch (error) {
  console.error(`\n${colors.red}Error: ${error.message}${colors.reset}`);
  process.exit(1);
} 