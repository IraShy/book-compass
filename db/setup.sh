#!/bin/bash

DB_USER="bookuser"
DB_PASS="bookpassword"
DEV_DB="book_compass_dev"
TEST_DB="book_compass_test"

# Drop databases first (to release dependency on user)
echo "Dropping databases if they exist..."
dropdb $DEV_DB --if-exists
dropdb $TEST_DB --if-exists

# Drop and recreate user
echo "Dropping user $DB_USER if exists..."
dropuser $DB_USER --if-exists

echo "Creating user $DB_USER..."
psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" || echo "User $DB_USER already exists."

# Function to set up a database
create_database() {
  local DB_NAME=$1

  echo "Setting up $DB_NAME..."

  echo "Creating database $DB_NAME..."
  createdb $DB_NAME

  echo "Granting privileges to $DB_USER on $DB_NAME..."
  psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

  echo "Setting up schema for $DB_NAME..."
  PGPASSWORD=$DB_PASS psql -U $DB_USER -d $DB_NAME -f db/schema.sql

  echo "Granting table permissions on $DB_NAME..."
  psql -d $DB_NAME -c "GRANT USAGE ON SCHEMA public TO $DB_USER;"
  psql -d $DB_NAME -c "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO $DB_USER;"
}

# Set up both databases
create_database $DEV_DB
create_database $TEST_DB

echo "All done."
