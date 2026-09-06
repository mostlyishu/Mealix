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

app.post("/api/orders", authMiddleware, (req, res) => {
  const { items, total_amount } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({
      message: "Cart is empty"
    });
  }

  if (!total_amount || total_amount <= 0) {
    return res.status(400).json({
      message: "Invalid order total"
    });
  }

  const userId = req.user.id;

  const orderSql = `
    INSERT INTO orders (user_id, total_amount)
    VALUES (?, ?)
  `;

  db.query(
    orderSql,
    [userId, total_amount],
    (err, orderResult) => {
      if (err) {
        console.error(err);

        return res.status(500).json({
          message: "Failed to create order"
        });
      }

      const orderId = orderResult.insertId;

      const itemValues = items.map((item) => [
        orderId,
        item.food_id,
        item.quantity
      ]);

      const itemSql = `
        INSERT INTO order_items
        (order_id, food_id, quantity)
        VALUES ?
      `;

      db.query(
        itemSql,
        [itemValues],
        (err) => {
          if (err) {
            console.error(err);

            return res.status(500).json({
              message: "Failed to save order items"
            });
          }

          res.status(201).json({
            message: "Order placed successfully",
            orderId
          });
        }
      );
    }
  );
});

app.get("/api/orders", authMiddleware, (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT
      orders.id AS order_id,
      orders.total_amount,
      orders.status,
      orders.created_at,
      foods.name AS food_name,
      foods.price,
      order_items.quantity
    FROM orders
    JOIN order_items
      ON orders.id = order_items.order_id
    JOIN foods
      ON order_items.food_id = foods.id
    WHERE orders.user_id = ?
    ORDER BY orders.created_at DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error(err);

      return res.status(500).json({
        message: "Failed to fetch orders"
      });
    }

    res.json(results);
  });
});

app.get("/api/admin/orders", (req, res) => {
  const sql = `
    SELECT
      orders.id AS order_id,
      users.name AS customer_name,
      users.email AS customer_email,
      orders.total_amount,
      orders.status,
      orders.created_at,
      foods.name AS food_name,
      foods.price,
      order_items.quantity
    FROM orders
    JOIN users
      ON orders.user_id = users.id
    JOIN order_items
      ON orders.id = order_items.order_id
    JOIN foods
      ON order_items.food_id = foods.id
    ORDER BY orders.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);

      return res.status(500).json({
        message: "Failed to fetch admin orders"
      });
    }

    res.json(results);
  });
});

app.listen(5001, () => {
  console.log("Mealix server running on http://localhost:5001");
});