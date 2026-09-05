require("dotenv").config();

const mysql = require("mysql2");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "mealix"
});
db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
    return;
  }

  console.log("Connected to MySQL!");
});

app.use(cors());
app.use(express.json());


app.get("/api/foods", (req, res) => {
  const sql = "SELECT * FROM foods";

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        message: "Database error"
      });
    }

    res.json(results);
  });
});

app.get("/", (req, res) => {
  res.send("Mealix API is running!");
});

app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;

  // Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({
      message: "All fields are required"
    });
  }

  try {
    // Check if user already exists
    const checkSql = "SELECT * FROM users WHERE email = ?";

    db.query(checkSql, [email], async (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          message: "Database error"
        });
      }

      if (results.length > 0) {
        return res.status(409).json({
          message: "Email already registered"
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user
      const insertSql =
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";

      db.query(
        insertSql,
        [name, email, hashedPassword],
        (err, result) => {
          if (err) {
            console.error(err);
            return res.status(500).json({
              message: "Failed to register user"
            });
          }

          res.status(201).json({
            message: "User registered successfully",
            userId: result.insertId
          });
        }
      );
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required"
    });
  }

  const sql = "SELECT * FROM users WHERE email = ?";

  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error(err);

      return res.status(500).json({
        message: "Database error"
      });
    }

    if (results.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const user = results[0];

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

      const token = jwt.sign(
          {
              id: user.id,
              email: user.email
          },
          process.env.JWT_SECRET,
          {
              expiresIn: "1d"
          }
      );

      res.json({
          message: "Login successful",
          token,
          user: {
              id: user.id,
              name: user.name,
              email: user.email
          }
      });
  });
});
app.get("/api/profile", authMiddleware, (req, res) => {
  res.json({
    message: "You are authenticated!",
    user: req.user
  });
});

app.listen(5001, () => {
  console.log("Mealix server running on http://localhost:5001");
});