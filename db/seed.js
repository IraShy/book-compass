const db = require("../db");
const bcrypt = require("bcrypt");
const { fetchBookFromGoogle } = require("../src/services/bookService");

async function seedDatabase() {
  try {
    console.log("Seeding the database...");
    console.log();
    console.log("Create users");

    const hashedPassword = await bcrypt.hash("password123", 10);

    const users = [
      {
        username: "alice",
        email: "alice@example.com",
        password: hashedPassword,
      },
      { username: "bob", email: "bob@example.com", password: hashedPassword },
    ];

    for (const user of users) {
      await db.query(
        `INSERT INTO users (username, email, hashed_password) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (email) DO NOTHING`,
        [user.username, user.email, user.password]
      );
    }

    console.log("Users created successfully");
    console.log();
    console.log("Fetch books from Google Books API");

    const bookSearches = [
      { title: "Dune", author: "Frank Herbert" },
      { title: "1984", author: "George Orwell" },
      { title: "Pride and Prejudice", author: "Jane Austen" },
      { title: "The Hobbit", author: "J.R.R. Tolkien" },
    ];

    const books = [];
    for (const search of bookSearches) {
      console.log(`Fetching "${search.title}" by ${search.author}...`);
      console.log();
      const googleBook = await fetchBookFromGoogle(search.title, search.author);

      if (googleBook) {
        await db.query(
          `INSERT INTO books (google_books_id, title, authors, description)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (google_books_id) DO NOTHING`,
          [
            googleBook.google_books_id,
            googleBook.title,
            googleBook.authors,
            googleBook.description,
          ]
        );

        books.push(googleBook);
        console.log(
          `Added: ${googleBook.title} (ID: ${googleBook.google_books_id})`
        );
        console.log();
      } else {
        console.log(`Could not find: ${search.title}`);
      }
    }

    const aliceResult = await db.query(
      "SELECT id FROM users WHERE email = 'alice@example.com'"
    );
    const bobResult = await db.query(
      "SELECT id FROM users WHERE email = 'bob@example.com'"
    );

    const aliceId = aliceResult.rows[0]?.id;
    const bobId = bobResult.rows[0]?.id;

    console.log("Create book reviews");
    if (aliceId && bobId && books.length > 0) {
      const reviews = [
        // Alice's reviews
        {
          userId: aliceId,
          bookId: books[0]?.google_books_id, // Dune
          rating: 9,
          content:
            "Incredible epic fantasy with complex political intrigue and deep world-building. Herbert creates a fascinating universe with detailed ecology, religion, and social structures. The spice melange concept is brilliant, and Paul's journey from noble heir to messianic leader is compelling. Love the blend of science fiction and mysticism. The desert planet Arrakis feels completely real and lived-in.",
        },
        {
          userId: aliceId,
          bookId: books[1]?.google_books_id, // 1984
          rating: 8,
          content:
            "Terrifyingly relevant dystopian masterpiece. Orwell's vision of totalitarian surveillance and thought control feels more prescient than ever. The concept of doublethink and newspeak is chilling. Winston's struggle against Big Brother is heartbreaking. While depressing, it's essential reading that makes you think deeply about freedom, truth, and the power of language to shape reality.",
        },
        // Bob's reviews
        {
          userId: bobId,
          bookId: books[2]?.google_books_id, // Pride and Prejudice
          rating: 7,
          content:
            "Witty and charming romance with sharp social commentary. Austen's dialogue sparkles with intelligence and humor. Elizabeth Bennet is a wonderful, strong-willed protagonist who stands up for herself. The slow-burn romance with Darcy is satisfying, and I love how both characters grow and overcome their initial prejudices. Great insight into Regency-era social dynamics.",
        },
        {
          userId: bobId,
          bookId: books[3]?.google_books_id, // The Hobbit
          rating: 9,
          content:
            "Delightful adventure story that perfectly captures the wonder of fantasy. Bilbo's transformation from comfortable homebody to brave adventurer is beautifully written. Tolkien's world-building is immersive without being overwhelming. The riddles with Gollum, the dragon Smaug, and the Battle of Five Armies are all memorable. Great introduction to Middle-earth that makes me want to read more fantasy epics.",
        },
        {
          userId: bobId,
          bookId: books[0]?.google_books_id, // Dune
          rating: 6,
          content:
            "Impressive scope and imagination, but quite dense and slow-paced. The political machinations are complex, sometimes confusingly so. Herbert's world-building is undeniably detailed, but I found myself getting lost in the extensive terminology and religious concepts. Paul's character development is interesting, though I wished for more action sequences. Definitely a book that rewards careful reading.",
        },
      ];

      for (const review of reviews) {
        if (review.bookId) {
          await db.query(
            `INSERT INTO reviews (user_id, book_id, rating, content)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT DO NOTHING`,
            [review.userId, review.bookId, review.rating, review.content]
          );
        }
      }
    }
    console.log();
    console.log("Book reviews created successfully");
    console.log();
    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Seeding failed:", error.message);
  } finally {
    process.exit(0);
  }
}

seedDatabase();
