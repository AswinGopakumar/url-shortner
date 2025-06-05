const express = require('express');
const mysql = require('mysql2'); // Make sure this is included
const { nanoid } = require('nanoid');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Wait for MySQL to be ready before starting server
function waitForMySQL(attempts = 10) {
  return new Promise((resolve, reject) => {
    const tryConnect = (retryCount) => {
      const connection = mysql.createConnection({
        host: process.env.DB_HOST || 'db',
        user: process.env.DB_USER || 'user',
        password: process.env.DB_PASSWORD || 'pass',
        database: process.env.DB_NAME || 'shortener'
      });

      connection.connect(err => {
        if (err) {
          if (retryCount <= 0) return reject('MySQL not ready, giving up.');
          console.log('MySQL not ready, retrying...');
          setTimeout(() => tryConnect(retryCount - 1), 2000);
        } else {
          console.log('Connected to MySQL');
          resolve(connection);
        }
      });
    };

    tryConnect(attempts);
  });
}

// Start server after DB is ready
waitForMySQL().then(connection => {
  // Route: Shorten URL
  app.post('/shorten', (req, res) => {
    const { url } = req.body;
    const id = nanoid(6);

    connection.query(
      'INSERT INTO links (id, url) VALUES (?, ?)',
      [id, url],
      (err) => {
        if (err) return res.status(500).send(err.message);
        res.send({ shortUrl: `${req.headers.host}/${id}` });
      }
    );
  });

  // Route: Redirect to original URL
  app.get('/:id', (req, res) => {
    const { id } = req.params;

    connection.query(
      'SELECT url FROM links WHERE id = ?',
      [id],
      (err, results) => {
        if (err || results.length === 0) return res.sendStatus(404);
        res.redirect(results[0].url);
      }
    );
  });

  app.listen(port, () => {
    console.log(`Backend running on port ${port}`);
  });
}).catch(err => {
  console.error(err);
  process.exit(1);
});
