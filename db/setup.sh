#!/bin/bash

DB_USER="bookuser"
DB_PASS="bookpassword"
DB_NAME="book_compass_dev"

echo "Creating database $DB_NAME..."
createdb $DB_NAME

echo "Creating user $DB_USER..."
psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" || echo "User $DB_USER already exists."

echo "Granting privileges to $DB_USER on $DB_NAME..."
psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

echo "Setup complete."
