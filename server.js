const express = require('express');
const moment = require('moment');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = process.env.PORT || 3000; // This will use Heroku's port or fallback to 3000 for local development


// Initialize the SQLite database
let db = new sqlite3.Database('./nfcTags.db');

// Middleware to serve static files (dashboard)
app.use(express.static('public'));

// Function to determine which URL to redirect based on time
function getRedirectUrl() {
  const now = moment();
  const day = now.day(); // Day of the week (0 = Sunday, 1 = Monday, etc.)
  const time = now.format('HH:mm'); // Current time in 24-hour format

  // Sunday specific logic
  if (day === 0) { // If it's Sunday
    if (time >= "10:30" && time <= "10:50") {
      return 'https://thecitybible.church/connect';
    } else if (time >= "10:51" && time <= "11:50") {
      return 'https://thecitybible.church/give';
    }
  }

  // Default URL (if none of the above conditions match)
  return 'http://linktr.ee/citybiblechurch';
}

// Route for NFC tap
app.get('/nfc/:tagId', (req, res) => {
  const tagId = req.params.tagId;

  // Logic to handle the specific NFC tag
  db.get("SELECT * FROM tags WHERE id = ?", [tagId], (err, row) => {
    if (err) {
      return res.status(500).send('Database error');
    }

    if (row) {
      // If tag exists, redirect to the appropriate URL based on time
      const url = getRedirectUrl();
      res.redirect(url);
    } else {
      res.status(404).send('NFC tag not found');
    }
  });
});

// Create database table (run only once)
db.run(`CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  createdAt TEXT,
  expirationDate TEXT
)`);

app.listen(port, () => {
  console.log(`NFC tag management server running at http://localhost:${port}`);
});

// Get all tags
app.get('/tags', (req, res) => {
    db.all("SELECT * FROM tags", (err, rows) => {
      if (err) {
        return res.status(500).send('Database error');
      }
      res.json(rows);
    });
  });
  
  // Add new tag
  app.post('/tags', express.json(), (req, res) => {
    const { id, expirationDate } = req.body;
    const createdAt = moment().format();
  
    db.run("INSERT INTO tags (id, createdAt, expirationDate) VALUES (?, ?, ?)", [id, createdAt, expirationDate], (err) => {
      if (err) {
        return res.status(500).send('Database error');
      }
      res.sendStatus(201);
    });
  });
  
  app.listen(PORT, () => {
    console.log(`NFC tag management server running at http://localhost:${PORT}`);
});
