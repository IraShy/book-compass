# Book Compass Backend

A RESTful API for book discovery and review management, built with Node.js and deployed on Render.

## Table of Contents

- [Live Demo](#live-demo)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Running the Project](#running-the-project)
- [Testing](#testing)
- [Available Endpoints](#available-endpoints)

## Live Demo

🚀 **API Base URL:** https://book-compass.onrender.com

**Quick Test:**

- Health Check: [https://book-compass.onrender.com/api/health](https://book-compass.onrender.com/api/health)
- Database Status: [https://book-compass.onrender.com/ping-db](https://book-compass.onrender.com/ping-db)

## Tech Stack

**Backend:**

- Node.js 23.7.0 with Express.js
- PostgreSQL with Supabase
- JWT authentication
- Winston logging
- Jest testing framework

**DevOps:**

- Docker containerisation
- CI/CD pipeline with GitHub Actions and Render

## Prerequisites

- Docker

or:

- Node.js (v22 or higher)
- PostgreSQL (v12 or higher)

## Setup

#### Environment Configuration

Copy the sample environment file and configure your settings:

```bash
cp .env_sample .env
```

Update the `.env` file with your configuration:

```bash
PORT=8000
NODE_ENV=development
JWT_SECRET=<your-secure-jwt-secret>

# Database configuration
DB_USER=<your-database-user>
DB_PASSWORD=<your-database-password>
DB_HOST=<your-database-host>
DB_PORT=5432
DB_NAME=<your-database-name>
```

<strong>Docker</strong>

```bash
docker compose up
```

<details>
<summary><strong>Local Development</strong></summary>

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

- Create a new database for dev (`book_compass_dev`) and test (`book_compass_test`) environments
- Create a new user (`bookuser`)
- Grant the user full privileges on the database
- Initialise the database schema

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

<details>
<summary><strong>Additional Docker Commands</strong></summary>

```bash
# Start services
docker compose up

# Stop services
docker compose down

# Rebuild
docker compose up --build

# Remove containers and volumes (fresh start)
docker compose down --volumes

# Remove everything (nuclear option)
docker system prune -a --volumes
```

</details>

### Local

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

Update the `.env.test` file with your configuration.

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
