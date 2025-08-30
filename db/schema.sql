CREATE TABLE books (
  google_books_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  authors TEXT[],
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username TEXT,
  email TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reviews (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  book_id TEXT NULL REFERENCES books(google_books_id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 10),
  content TEXT CHECK (LENGTH(content) <= 2000),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, book_id)
);

CREATE TABLE suggestions (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  book_id TEXT REFERENCES books(google_books_id) ON DELETE CASCADE,
  reason TEXT, -- why this book was suggested
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, book_id)
);

CREATE TABLE reading_lists (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (LENGTH(title) <= 50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, title)
);

CREATE TABLE reading_list_books (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  list_id INTEGER REFERENCES reading_lists(id) ON DELETE CASCADE,
  book_id TEXT REFERENCES books(google_books_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (list_id, book_id)
);

CREATE TABLE read_books (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  book_id TEXT REFERENCES books(google_books_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, book_id)
);

CREATE TABLE conversations (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE sender_type AS ENUM ('user', 'ai');

CREATE TABLE messages (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  sender sender_type,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE message_suggestions (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
  book_id TEXT REFERENCES books(google_books_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_suggestions_user_id ON suggestions(user_id);