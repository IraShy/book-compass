#!/bin/bash

DB_USER="bookuser"
DB_PASS="bookpassword"
DB_NAME="book_compass_dev"

echo "Dropping database $DB_NAME if it exists..."
dropdb $DB_NAME --if-exists

echo "Creating database $DB_NAME..."
createdb $DB_NAME

echo "Dropping user $DB_USER if exists..."
dropuser $DB_USER --if-exists

echo "Creating user $DB_USER..."
psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" || echo "User $DB_USER already exists."

echo "Granting privileges to $DB_USER on $DB_NAME..."
psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

echo "Setting up schema..."
# psql -d $DB_NAME -f db/schema.sql
# psql -U $DB_USER -d $DB_NAME -f db/schema.sql
PGPASSWORD=$DB_PASS psql -U $DB_USER -d $DB_NAME -f db/schema.sql



echo "Setup complete."
