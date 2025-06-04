const express = require('express');
const mysql = require('mysql2');
const { nanoid } = require('nanoid');
require('dotenv').config();

const app = express();
const port = 3000;
app.use(express.json());

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || 'pass',
  database: process.env.DB_NAME || 'shortener'
});

connection.connect();

app.post('/shorten', (req, res) => {
  const { url } = req.body;
  const id = nanoid(6);
  connection.query('INSERT INTO links (id, url) VALUES (?, ?)', [id, url], (err) => {
    if (err) return res.status(500).send(err.message);
    res.send({ shortUrl: `${req.headers.host}/${id}` });
  });
});

app.get('/:id', (req, res) => {
  const { id } = req.params;
  connection.query('SELECT url FROM links WHERE id = ?', [id], (err, results) => {
    if (err || results.length === 0) return res.sendStatus(404);
    res.redirect(results[0].url);
  });
});

app.listen(port, () => console.log(`Backend running on port ${port}`));
