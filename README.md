# Book Compass Backend

> ⚠️ **Work in Progress** - This project is currently under active development. Features are incomplete and may not function as expected. Please check back later for a stable release.

A RESTful API for book discovery and review management, built with Node.js and deployed on Render.

## Table of Contents

- [Links](#links)
- [Available Endpoints](#available-endpoints)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Running the Project](#running-the-project)
- [Testing](#testing)

## Links

**API Base URL:** https://book-compass.onrender.com/api

**Quick Test:**

- Health Check: [https://book-compass.onrender.com/api/health](https://book-compass.onrender.com/api/health)
- Database Status: [https://book-compass.onrender.com/ping-db](https://book-compass.onrender.com/ping-db)

## Available Endpoints

- `POST /users/register` - Register a new user
- `POST /users/login` - User login
- `GET /users/profile` - Get user profile
- `GET /books/find` - Find or add a book

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
DATABASE_URL=postgres://bookuser:bookpassword@localhost:5432/book_compass_dev
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
