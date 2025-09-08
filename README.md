# Book Compass Backend

> **Work in progress** - Core features are functional but the project is actively being developed and
> enhanced.

A RESTful API for personalised book recommendations powered by AI. Users can manage their book reviews and
receive book suggestions based on their reading preferences.

## Features

- **User Authentication** - Secure JWT-based registration and login
- **Book Management** - Search and add books via Google Books API
- **Review System** - Create, read, update, and delete book reviews
- **AI Recommendations** - Get personalised book suggestions using Google Gemini AI
- **Private Experience** - Each user's reviews and recommendations are completely isolated

## Table of Contents

- [Links](#links)
- [Available Endpoints](#available-endpoints)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Running the Project](#running-the-project)
- [Development](#development)
- [Testing](#testing)

## Links

**API Base URL:** https://book-compass.onrender.com/api

**Quick Test:**

- Health Check: [https://book-compass.onrender.com/api/health](https://book-compass.onrender.com/api/health)
- Database Status: [https://book-compass.onrender.com/ping-db](https://book-compass.onrender.com/ping-db)

## Available Endpoints

### Authentication

- `POST /users/register` - Register a new user
- `POST /users/login` - User login
- `GET /users/profile` - Get user profile

### Books

- `GET /books/find` - Find or add a book from Google Books API

### Reviews

- `POST /reviews` - Create a new review
- `GET /reviews/:bookId` - Get user's review for a specific book
- `GET /reviews` - Get all user's reviews
- `PUT /reviews/:reviewId` - Update an existing review
- `DELETE /reviews/:reviewId` - Delete an existing review

### AI Recommendations

- `POST /recommendations/generate` - Generate personalised book recommendations based on user's reviews
- `GET /recommendations` - Get all user's recommendations

## Tech Stack

**Backend:**

- Node.js 23.7.0 with Express.js
- PostgreSQL (Docker for dev, Supabase for production)
- JWT authentication with bcrypt password hashing
- Google Gemini AI for book recommendations
- Google Books API integration
- Winston logging
- Jest testing framework with Supertest

**DevOps:**

- Docker containerisation
- CI/CD pipeline with GitHub Actions and Render
- Code quality tools: ESLint, Prettier, Husky pre-commit hooks

## Prerequisites

- Docker

or:

- Node.js (v22 or higher)
- PostgreSQL (v12 or higher)

## Setup

### Environment Configuration

Copy the sample environment file and configure your settings:

```bash
cp .env_sample .env
```

Update the `.env` file with your configuration:

```bash
PORT=8000
NODE_ENV=development
JWT_SECRET=<your-secure-jwt-secret>
DATABASE_URL=postgres://bookuser:bookpassword@localhost:5432/book_compass_dev
GEMINI_API_KEY=<your-gemini-api-key>
```

### Get API Keys

1. **Gemini API Key**: Get your free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. **Google Books API**: No API key required for basic usage

<strong>Docker Setup</strong>

```bash
# Start the application
docker compose up

# The database schema is automatically applied on first run
```

<details>
<summary><strong>Local Development Setup</strong></summary>

#### Database Setup

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

- Create databases for dev (`book_compass_dev`) and test (`book_compass_test`) environments
- Create a database user (`bookuser`) with appropriate privileges
- Apply the database schema to both databases

#### Install Dependencies

```bash
npm install
```

</details>

## Running the Project

### Docker

```bash
docker compose up
```

## Development

### Database Seeding

Populate your database with sample data for development and testing:

```bash
# With Docker
npm run seed:docker

# Local development
npm run seed
```

The seed script creates:

- **Test users**: `alice@example.com` and `bob@example.com` (password: `password123`)
- **Sample books**: Fetched from Google Books API with real IDs
- **Detailed reviews**: Meaningful reviews that help test AI recommendations

### Database Management

```bash
# Connect to database (Docker)
docker-compose exec db psql -U bookuser -d book_compass_dev
```

### Docker Commands

```bash
# Start services
docker compose up

# Stop services
docker compose down

# Rebuild containers
docker compose up --build

# Fresh start (removes all data)
docker compose down --volumes
docker compose up

# View logs
docker compose logs
```

### Local

```bash
npm run dev
```

The server will start on port 8000 with auto-reload enabled.

### Code Quality

The project includes automated code quality tools:

```bash
# Format code
npm run format

# Check formatting
npm run format:check

# Lint code
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

**Pre-commit hooks** automatically run linting and tests before each commit to ensure code quality.

**Skip hooks for documentation, config changes, etc.:**

```bash
git commit -m "commit message" -n
```

### Health Checks

- Server status: [http://localhost:8000/api/health](http://localhost:8000/api/health)
- Database connection: [http://localhost:8000/ping-db](http://localhost:8000/ping-db)

## Testing

### Setup Test Environment

Copy the test environment file:

```bash
cp .env.test_sample .env.test
```

Update the `.env.test` file with your configuration.

The `setup.sh` script creates both dev and test databases, so no additional database setup is needed for
testing.

### Run Tests

```bash
npm test
```

**Note:** Tests are automatically run as part of the pre-commit hooks and CI pipeline to ensure code quality.
