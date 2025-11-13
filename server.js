const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.static('.'));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.listen(PORT, () => {
    console.log(`GeForce NOW Launcher running on http://localhost:${PORT}`);
    console.log(`Visit http://localhost:${PORT} in your browser`);
});
