const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize SQLite DB
const db = new sqlite3.Database('./messages.db', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Create messages table if not exists
db.run(`CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// API Endpoints

// Get all messages
app.get('/api/messages', (req, res) => {
  db.all('SELECT id, content, created_at FROM messages ORDER BY created_at ASC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to retrieve messages' });
    }
    return res.json(rows);
  });
});

// Post a new message
app.post('/api/messages', (req, res) => {
  const { content } = req.body;
  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Message content is required' });
  }

  const stmt = db.prepare('INSERT INTO messages(content) VALUES(?)');
  stmt.run(content.trim(), function (err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to save message' });
    }
    // Return the new message including id and timestamp
    db.get('SELECT id, content, created_at FROM messages WHERE id = ?', [this.lastID], (err2, row) => {
      if (err2) {
        return res.status(500).json({ error: 'Failed to retrieve new message' });
      }
      return res.status(201).json(row);
    });
  });
  stmt.finalize();
});

// Serve frontend fallback (if needed)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
  console.log(\`Server running at http://localhost:\${PORT}\`);
});

