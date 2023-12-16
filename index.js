require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient } = require('mongodb');
const dns = require('dns');
const urlparser = require('url');

const client = new MongoClient(process.env['DB_KEY']);
const db = client.db('urlshortener');
const urls = db.collection('urls');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({ extended: true}))

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', function(req, res) {
const url = req.body.url;
  const myURL = new URL(url);
    const lookupdns = dns.lookup(urlparser.parse(url).hostname, async (err, address) => {

    if (!address) {
      res.json({error: "Invalid URL"})
    } else {

      const count = await urls.countDocuments({})
      const urlDocument = {url, short_url: count}
        
      const result = await urls.insertOne(urlDocument)
      console.log(result)
      res.json({original_url: url, short_url: count})
  }
  })

});

app.get('/api/shorturl/:short_url', async (req, res) => {
  try {
    const short = req.params.short_url;
    const doc = await urls.findOne({ short_url: parseInt(short) });

    if (!doc || !doc.url) {
      res.status(404).json({ error: 'URL not found' });
      return;
    }

    res.redirect(doc.url);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
