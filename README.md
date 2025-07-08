# Book Compass Backend

## Table of Contents

- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Running the Project](#running-the-project)
- [Testing](#testing)
- [Available Endpoints](#available-endpoints)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)

## Prerequisites

- Node.js (v22 or higher)
- PostgreSQL (v12 or higher)

## Setup

### 1. Environment Configuration

Copy the sample environment file and configure your settings:

```bash
cp .env_sample .env
```

Update the `.env` file with your configuration:

```bash
PORT=8000
DATABASE_URL=postgres://bookuser:bookpassword@localhost:5432/book_compass_dev
NODE_ENV=development
JWT_SECRET="your-secure-jwt-secret-here"
```

### 2. Database Setup

1. Make sure PostgreSQL is installed and running on your local machine.
2. Make the setup script executable:

```bash
chmod +x db/setup.sh
```

3. Execute the setup script:

```bash
./db/setup.sh
```

The setup script will:

- Create a new database for dev (`book_compass_dev`) and test (`book_compass_test`) environments
- Create a new user (`bookuser`)
- Grant the user full privileges on the database
- Initialise the database schema

### 3. Install Dependencies

```bash
npm install
```

## Running the Project

### Development Mode

```bash
npm run dev
```

The server will start on port 8000 with auto-reload enabled.

### Health Checks

- Server status: [http://localhost:8000/api/health](http://localhost:8000/api/health)
- Database connection: [http://localhost:8000/ping-db](http://localhost:8000/ping-db)

## Testing

### Setup Test Environment

Copy the test environment file:

```bash
cp .env.test_sample .env.test
```

The setup.sh script creates both dev AND test databases, so no additional database setup is needed for testing.

### Run Tests

```bash
npm test
```

## Available Endpoints

- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile
- `GET /api/books/find` - Find or add a book
- `GET /api/health` - Health check
- `GET /ping-db` - Database connection test

## Project Structure

```
src/
├── controllers/     # Request handlers
├── middlewares/     # Custom middleware
├── routes/         # Route definitions
├── services/       # Business logic
└── utils/          # Utility functions
db/
├── index.js        # Database connection
├── schema.sql      # Database schema
└── setup.sh        # Database setup script
tests/              # Test files
```

## Environment Variables

| Variable       | Description                  | Default                                                                    |
| -------------- | ---------------------------- | -------------------------------------------------------------------------- |
| `PORT`         | Server port                  | 8000                                                                       |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://bookuser:bookpassword@localhost:5432/book_compass_dev` (local) |
| `NODE_ENV`     | Environment mode             | development                                                                |
| `JWT_SECRET`   | JWT signing secret           | -                                                                          |
