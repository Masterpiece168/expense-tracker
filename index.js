// 1. Load the Express library (like an import in Java)
const express = require('express');

// 2. Create the app
const app = express();

// 3. Define a route: when someone visits "/", send back "Hello World"
app.get('/', (req, res) => {
  res.send('Hello World');
});

app.get('/api/health', (req, res) => {
  res.json({status: 'ok'});
});

// 4. Start listening for requests on port 3000
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});