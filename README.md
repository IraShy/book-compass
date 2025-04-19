## Setup Database

To set up the PostgreSQL database for this project, follow these steps:

1. Make sure you have PostgreSQL installed and running on your local machine.
2. Run the following command to make the setup script executable:

```bash
chmod +x db/setup.sh
```

3. Execute the script to create the necessary database and user:

```bash
./db/setup.sh
```

4. Update your .env file to use the correct DATABASE_URL:

```bash
DATABASE_URL=postgres://bookuser:bookpassword@localhost:5432/book_compass_dev
```

The script will:

- create a new database (`book_compass_dev`)
- create a new user (`bookuser`)
- grant the user full privileges on the database

## Running the Project

After setting up the database, you're ready to start the project:

1. Install the dependencies:

```bash
npm install
```

2. Start the server:

```bash
npm run dev
```

3. Visit [http://localhost:8000/api/health](http://localhost:8000/api/health) to check that the server is running.

4. Visit [http://localhost:8000/ping-db](http://localhost:3000/ping-db) to check that DB connection is working.
