require("dotenv").config(); // Load environment variables from .env file
const cors = require("cors");
const express = require('express');
const app = express();
const port = 3001;

const { Pool } = require('pg');

// For postgresql
app.use(express.json()); // Body parser middleware
app.use(cors()); // CORS middleware (allows requests from other domains)

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const db_name = 'room_queue'

app.use(express.json());

// Endpoint to handle user joins in the queue
app.post("/join-queue", async (req, res) => {
  try {
    const { name } = req.body;
    
    // Insert user into the PostgreSQL database
    const client = await pool.connect();
    const query = `INSERT INTO ${db_name} (username) VALUES ($1)`;
    //const query = 'INSERT INTO room_users (room_id, username, user_id, ws) VALUES ($1, $2, $3, $4)', [roomId,'test', JSON.stringify([data.uid]), ws];

    await client.query(query, [name]);
    client.release();

    res.status(201).json({ message: 'User added to the queue.' });
  } catch (error) {
    console.error('Error adding user to queue:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`PostgreSQL is running on port ${port}`);
});
