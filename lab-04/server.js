const express = require('express');
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// Keep secret key in a constant for now (moved to .env in Lab 8 as per specification)
const JWT_SECRET = 'AURORA_BACKEND_LAB_SECRET_KEY_2026';

const dbPath = path.join(__dirname, 'userData.db');
let db = null;

// Initialize Database and Server
const initializeDBAndServer = async (port = process.env.PORT || 3000) => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    // Create user table with unique username, name, and hashed password column
    await db.run(`
      CREATE TABLE IF NOT EXISTS user (
        username TEXT PRIMARY KEY,
        name TEXT,
        password TEXT
      );
    `);

    const server = app.listen(port, () => {
      console.log(`Server Running at http://localhost:${port}/`);
    });
    return server;
  } catch (error) {
    console.error(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

// Route: Root / health check
app.get('/', (req, res) => {
  res.send('Lab 4: Registration, Login and JWT API is running.');
});

// Route: POST /register/ (and /register)
// Tasks: Reject existing username with 400; otherwise hash password with bcrypt.hash and save user.
const handleRegister = async (req, res) => {
  try {
    const { username, name, password } = req.body;

    if (!username || !password || !name) {
      return res.status(400).send('All fields (username, name, password) are required');
    }

    if (password.length < 5) {
      return res.status(400).send('Password is too short');
    }

    // Parameterized query to check if username already exists
    const selectUserQuery = `SELECT * FROM user WHERE username = ?;`;
    const dbUser = await db.get(selectUserQuery, [username]);

    if (dbUser !== undefined) {
      // Username already exists: reject with 400
      return res.status(400).send('User already exists');
    }

    // Hash the password with bcrypt (salt rounds = 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Parameterized insert query to securely store user
    const createUserQuery = `
      INSERT INTO user (username, name, password)
      VALUES (?, ?, ?);
    `;
    await db.run(createUserQuery, [username, name, hashedPassword]);

    return res.status(200).send('User created successfully');
  } catch (error) {
    console.error('Registration Error:', error.message);
    return res.status(500).send('Internal Server Error');
  }
};

app.post('/register/', handleRegister);
app.post('/register', handleRegister);

// Route: POST /login/ (and /login)
// Tasks: Return 400 for unknown user, compare password with bcrypt.compare,
// return 400 for wrong password, and on success return { jwt_token } created with jwt.sign.
// Put only the username (never the password) in the token payload.
const handleLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).send('Username and password are required');
    }

    // Parameterized query to look up user
    const selectUserQuery = `SELECT * FROM user WHERE username = ?;`;
    const dbUser = await db.get(selectUserQuery, [username]);

    if (dbUser === undefined) {
      // Unknown user: return 400
      return res.status(400).send('Invalid user');
    }

    // Compare entered plain password with stored bcrypt hash
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);

    if (!isPasswordMatched) {
      // Wrong password: return 400
      return res.status(400).send('Invalid password');
    }

    // Create JWT payload with ONLY username (never password)
    const payload = {
      username: username,
    };

    // Sign JWT token
    const jwt_token = jwt.sign(payload, JWT_SECRET);

    // Return { jwt_token }
    return res.status(200).send({ jwt_token });
  } catch (error) {
    console.error('Login Error:', error.message);
    return res.status(500).send('Internal Server Error');
  }
};

app.post('/login/', handleLogin);
app.post('/login', handleLogin);

// Helper route to inspect database view for demonstration/grading
// Shows that passwords stored are hashes only, never plain text
app.get('/users/', async (req, res) => {
  try {
    const getUsersQuery = `SELECT username, name, password FROM user;`;
    const users = await db.all(getUsersQuery);
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).send('Internal Server Error');
  }
});

// Start the server if executed directly
if (require.main === module) {
  initializeDBAndServer();
}

module.exports = { app, initializeDBAndServer, JWT_SECRET };

