# Authentic Reader Admin System

This project includes a Django-like admin system for managing users and sources. The admin system provides an easy way to create super users, set up the database, and manage application data.

## Setup

### Prerequisites

- Node.js and npm installed
- PostgreSQL installed and running
- A PostgreSQL user with database creation privileges

### Initial Setup

To set up the system for the first time:

1. Navigate to the server directory:
   ```
   cd server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the setup script:
   ```
   npm run setup
   ```

This setup script will:
- Create the database if it doesn't exist
- Run all migrations
- Create a superuser (admin) account interactively

### Creating a Superuser

You can create a superuser (admin) by running:

```
npm run setup
```

This will guide you through creating an admin user with the following prompts:
- Username (required)
- Email (required, must be valid format)
- Password (required, minimum 8 characters)
- Password confirmation

If a user with the provided email already exists, the script will update that user to have admin privileges.

## Admin Dashboard

After setting up, you can access the Admin Dashboard by:

1. Start the frontend and backend servers:
   ```
   # In the root directory
   npm run dev
   
   # In the server directory
   npm run dev
   ```

2. Navigate to `http://localhost:5173/admin` in your browser

3. Log in with your admin credentials

### Admin Dashboard Features

The admin dashboard provides the following features:

#### User Management
- View all users
- Create new users
- Set/unset admin privileges
- Delete users (with safeguards to prevent deleting yourself or the last admin)

#### Source Management
- View all sources
- Add new sources
- Delete sources

## API Endpoints

The admin system exposes the following API endpoints:

### User Management
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create a new user
- `GET /api/admin/users/:id` - Get a specific user
- `PATCH /api/admin/users/:id` - Update a user
- `DELETE /api/admin/users/:id` - Delete a user

### Dashboard Stats
- `GET /api/admin/stats` - Get system statistics

## Security

All admin endpoints are protected by:
1. Authentication middleware - requires a valid JWT token
2. Admin-only middleware - requires the user to have admin privileges

## Extending the Admin System

To add new sections to the admin dashboard:

1. Create a new component in `client/src/components/`
2. Add a new tab in the `AdminDashboard.tsx` component
3. Add new API endpoints in the backend as needed

## Comparison to Django Admin

This system provides functionality similar to Django's admin, but is customized for a React+Express+Sequelize stack:

| Django Admin Feature | Our Implementation |
|----------------------|--------------------|
| Admin interface | React-based admin dashboard |
| User model | Sequelize User model with isAdmin flag |
| createsuperuser command | Interactive setup.js script |
| Admin-only views | AdminRoute component with isAdmin check |
| Model admin registration | Direct API endpoints for each model |

## Troubleshooting

If you encounter issues:

1. **Database connection errors**: Ensure PostgreSQL is running and the credentials in .env match your setup
2. **Authentication issues**: Check that your JWT token is valid
3. **Permission denied**: Ensure your user has the isAdmin flag set to true 