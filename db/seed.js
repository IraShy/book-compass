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
      { title: "To Kill a Mockingbird", author: "Harper Lee" },
      { title: "The Great Gatsby", author: "F. Scott Fitzgerald" },
      { title: "The Lord of the Rings", author: "J.R.R. Tolkien" },
      { title: "Harry Potter and the Philosopher's Stone", author: "J.K. Rowling" },
      { title: "The Catcher in the Rye", author: "J.D. Salinger" },
      { title: "Brave New World", author: "Aldous Huxley" },
      { title: "The Handmaid's Tale", author: "Margaret Atwood" },
      { title: "Foundation", author: "Isaac Asimov" },
      { title: "Neuromancer", author: "William Gibson" },
      { title: "The Martian", author: "Andy Weir" },
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
          [googleBook.google_books_id, googleBook.title, googleBook.authors, googleBook.description]
        );

        books.push(googleBook);
        console.log(`Added: ${googleBook.title} (ID: ${googleBook.google_books_id})`);
        console.log();
      } else {
        console.log(`Could not find: ${search.title}`);
      }
    }

    const aliceResult = await db.query("SELECT id FROM users WHERE email = 'alice@example.com'");
    const bobResult = await db.query("SELECT id FROM users WHERE email = 'bob@example.com'");

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
        {
          userId: aliceId,
          bookId: books[6]?.google_books_id, // The Lord of the Rings
          rating: 10,
          content:
            "Epic fantasy masterpiece that sets the standard for the genre. Tolkien's world-building is unparalleled - Middle-earth feels completely real and lived-in. The friendship between Frodo and Sam is deeply moving. The scope is breathtaking, from intimate character moments to massive battles. Beautiful prose that ranges from simple and direct to poetic and mythic. A timeless adventure about courage, friendship, and hope.",
        },
        {
          userId: aliceId,
          bookId: books[7]?.google_books_id, // Harry Potter
          rating: 8,
          content:
            "Magical and enchanting introduction to a wonderful world. Rowling creates a perfect blend of whimsy and danger. Hogwarts feels like a place you'd want to live. Harry's journey from unloved orphan to hero is compelling. The magic system is creative and fun. Great characters and friendships. While aimed at younger readers, it has depth and heart that appeals to all ages.",
        },
        {
          userId: aliceId,
          bookId: books[8]?.google_books_id, // The Catcher in the Rye
          rating: 6,
          content:
            "Interesting character study but Holden's voice gets tiresome. Salinger captures teenage angst and alienation well, but the constant complaining becomes grating. Some profound insights about phoniness and growing up, but the plot meanders. The stream-of-consciousness style is effective but exhausting. Important for its cultural impact, though not entirely enjoyable to read.",
        },
        {
          userId: aliceId,
          bookId: books[9]?.google_books_id, // Brave New World
          rating: 9,
          content:
            "Brilliant dystopian vision that complements 1984 perfectly. Huxley's world of pleasure and conditioning is more seductive and perhaps more realistic than Orwell's brutal oppression. The soma-dependent society and engineered happiness are chilling concepts. Bernard and John's struggles against conformity are compelling. Raises important questions about technology, happiness, and human nature.",
        },
        {
          userId: aliceId,
          bookId: books[10]?.google_books_id, // The Handmaid's Tale
          rating: 8,
          content:
            "Powerful and disturbing feminist dystopia. Atwood's writing is sharp and evocative. Offred's situation is horrifying yet believable. The gradual revelation of how Gilead came to be is masterfully done. The oppression feels real and immediate. While difficult to read due to the subject matter, it's an important warning about extremism and women's rights.",
        },
        {
          userId: aliceId,
          bookId: books[11]?.google_books_id, // Foundation
          rating: 7,
          content:
            "Fascinating concept of psychohistory and galactic empire. Asimov's ideas about predicting societal trends are brilliant. The scope spanning centuries is ambitious. However, the characters feel somewhat flat and the dialogue is dated. More focused on ideas than emotional depth. Important influence on science fiction, though the execution feels academic rather than engaging.",
        },
        {
          userId: aliceId,
          bookId: books[12]?.google_books_id, // Neuromancer
          rating: 8,
          content:
            "Groundbreaking cyberpunk that defined a genre. Gibson's vision of cyberspace and AI is prescient and influential. The noir atmosphere in a high-tech world is perfectly executed. Case's journey through the matrix is thrilling. Dense with ideas and terminology that can be overwhelming but rewarding. Essential reading for understanding modern sci-fi and our relationship with technology.",
        },
        {
          userId: aliceId,
          bookId: books[13]?.google_books_id, // The Martian
          rating: 9,
          content:
            "Incredibly engaging hard science fiction survival story. Weir makes complex science accessible and exciting. Mark Watney's humor and determination in the face of impossible odds is inspiring. The problem-solving approach is methodical and believable. Great balance of technical detail and human drama. Shows the best of human ingenuity and the power of science to overcome challenges.",
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
        {
          userId: bobId,
          bookId: books[1]?.google_books_id, // 1984
          rating: 10,
          content:
            "Absolutely brilliant and terrifying. This book changed how I think about government, media, and truth itself. The way Orwell shows how language can be manipulated to control thought is genius. Big Brother's surveillance state feels incredibly relevant today. Winston's final defeat is soul-crushing but necessary to show the complete power of totalitarianism. A masterpiece that everyone should read.",
        },
        {
          userId: bobId,
          bookId: books[4]?.google_books_id, // To Kill a Mockingbird
          rating: 9,
          content:
            "Powerful and moving exploration of justice, morality, and growing up. Scout's perspective as a child witnessing adult prejudice is brilliantly handled. Atticus Finch is a compelling moral center, though complex. The trial scenes are gripping and heartbreaking. Lee tackles difficult themes with grace and nuance. Essential reading that stays with you long after finishing.",
        },
        {
          userId: bobId,
          bookId: books[5]?.google_books_id, // The Great Gatsby
          rating: 8,
          content:
            "Beautiful prose and haunting portrayal of the American Dream's corruption. Fitzgerald's writing is lyrical and evocative. Gatsby's obsession with Daisy is both romantic and tragic. The symbolism is rich without being heavy-handed. Nick's narration provides the perfect lens into this decadent world. A masterclass in atmosphere and character development.",
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
