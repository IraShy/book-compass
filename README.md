# Book Compass Backend

> **Work in progress** - Core features are functional but the project is actively being developed and
> enhanced.

## Project Overview

Book Compass (backend) is a RESTful API service for personalised book recommendations. Users can create and
manage book reviews, and the system uses Google's Gemini AI to generate book suggestions based on their
reading history and preferences.

### Use Cases

- Create and manage book reviews with ratings (1-10 scale)
- Generate AI-powered book recommendations based on review history
- Search for books using Google Books API
- Manage user accounts with secure authentication
- Track reading history and preferences

## Features

### Core Functionality

- **User Authentication & Management**: secure JWT-based registration, login, logout, and session management
- **Profile Control**: update username, email, change password, and delete account
- **User Privacy**: each user's data is isolated - reviews and recommendations are private and not shared
  between users
- **Book Discovery**: search and retrieve books via Google Books API integration, with LRU caching for
  performance
- **Review System**: create, read, update, and delete book reviews with ratings (1-10 scale)
- **AI-Powered Recommendations**: generate personalised book suggestions using Google Gemini AI based on
  review analysis
- **Recommendation History**: view and manage all your AI-generated book suggestions with explanations

### Technical Features

- **Book Caching**: LRU cache system for optimised book data retrieval
- **Database Management**: automated schema setup and seeding for development and testing
- **Health Monitoring**: health checks for database, Google Books API, and Gemini AI services
- **Logging**: Winston-based structured logging with request tracking and error monitoring
- **Data Validation & Security**: input validation, SQL injection prevention, and secure password handling
- **Private User Experience**: complete data isolation between users with no cross-user data sharing

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

**Frontend repo** https://github.com/IraShy/book-compass-client

**Quick Test:**

- Health Check: [https://book-compass.onrender.com/api/health](https://book-compass.onrender.com/api/health)
- Database Status: [https://book-compass.onrender.com/ping-db](https://book-compass.onrender.com/ping-db)

## Available Endpoints

### Authentication & User Management

- `POST /users/register` - Register a new user account
- `POST /users/login` - User login
- `POST /users/logout` - User logout
- `GET /users/profile` - Get current user profile information
- `PUT /users/profile` - Update user profile (username, email with password verification)
- `PUT /users/password` - Change user password (requires current password)
- `DELETE /users/profile` - Delete user account (requires password confirmation)

### Books

- `GET /books/find` - Search and retrieve books by title and authors
- `GET /books/:id` - Get detailed information for a specific book by ID

### Reviews

- `POST /reviews` - Create a new book review (rating 1-10, content up to 2000 characters)
- `GET /reviews/:bookId` - Get user's review for a specific book
- `GET /reviews` - Get all user's reviews
- `PUT /reviews/:reviewId` - Update an existing review
- `DELETE /reviews/:reviewId` - Delete a review permanently

### AI Recommendations

- `POST /recommendations/generate` - Generate personalised book recommendations using Gemini AI (requires
  minimum 3 reviews)
- `GET /recommendations` - Get all user's recommendation history with reasons and book details

### System Health & Monitoring

- `GET /api/health` - Health check (database, Google Books API, Gemini AI status)
- `GET /ping-db` - Database connectivity test with schema validation

## Tech Stack

- Node.js 23.7.0 with Express.js framework
- PostgreSQL
- JWT (JSON Web Tokens)
- bcrypt
- Google Gemini AI (gemini-2.0-flash-lite)
- Google Books API
- LRU caching system
- Winston logging
- Jest testing framework with Supertest
- Docker
- Supabase
- Render cloud deployment
- GitHub Actions CI/CD pipeline
- Code quality enforcement: ESLint, Prettier, Husky pre-commit hooks

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
- **Sample books**: Fetched from Google Books API with real book IDs and metadata
- **Sample reviews**: Varied reviews for testing AI recommendation functionality
- **Realistic data**: Simulates actual user behavior patterns for comprehensive testing

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

### Code Quality & Standards

The project enforces code quality standards through automated tools:

```bash
# Format code with Prettier
npm run format

# Check code formatting
npm run format:check

# Run ESLint checks
npm run lint:check

# Auto-fix linting issues
npm run lint
```

**Automated Quality Enforcement:**

- **Pre-commit hooks** (Husky) automatically run linting, formatting, and tests before each commit
- **Lint-staged** ensures only staged files are processed for faster commits
- **CI/CD pipeline** runs full quality checks on every push and pull request

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
