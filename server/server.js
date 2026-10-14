require("dotenv").config();

const mysql = require("mysql2");
const mysqlPromise = require("mysql2/promise");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("./middleware/authMiddleware");
const adminMiddleware = require("./middleware/adminMiddleware");
const crypto = require("node:crypto");

const app = express();

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME || "mealix"
};

const db = mysql.createConnection(dbConfig);

const transactionPool = mysqlPromise.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
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



// =========================
// FOOD MENU
// =========================

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

// =========================
// BREAKSYNC RECOMMENDATIONS
// =========================

app.get("/api/breaksync", (req, res) => {
  const breakMinutes = Number(req.query.minutes);

  if (
    !Number.isInteger(breakMinutes) ||
    breakMinutes < 5 ||
    breakMinutes > 180
  ) {
    return res.status(400).json({
      message: "Break time must be between 5 and 180 minutes"
    });
  }

  calculateKitchenWorkload((err, workload) => {
    if (err) {
      console.error("BreakSync workload error:", err);

      return res.status(500).json({
        message: "Failed to calculate kitchen workload"
      });
    }

    const queueDelay =
      workload.estimated_workload_minutes;

    const safetyBuffer = 5;

    db.query(
      `SELECT id, name, price, category, image_url,
              meal_type, prep_time
       FROM foods
       WHERE available = 1
       ORDER BY prep_time ASC`,
      (foodErr, foods) => {
        if (foodErr) {
          return res.status(500).json({
            message: "Failed to find suitable meals"
          });
        }

        const recommendations = foods
          .map((food) => {
            const estimatedMinutes =
              Number(food.prep_time) +
              queueDelay +
              safetyBuffer;

            return {
              ...food,
              estimated_minutes: estimatedMinutes,
              fits_break: estimatedMinutes <= breakMinutes
            };
          })
          .filter((food) => food.fits_break)
          .sort(
            (a, b) =>
              a.estimated_minutes - b.estimated_minutes
          )
          .slice(0, 5);

        res.json({
          break_minutes: breakMinutes,
          ...workload,
          queue_delay: queueDelay,
          safety_buffer: safetyBuffer,
          recommendations,
          message:
            recommendations.length > 0
              ? "Meals available within your break"
              : "No meals currently fit your break time"
        });
      }
    );
  });
});

// =========================
// SHARED KITCHEN WORKLOAD ENGINE
// =========================

function calculateKitchenWorkload(callback) {
  const sql = `
    SELECT
      o.id AS order_id,
      oi.quantity,
      f.prep_time
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN foods f ON oi.food_id = f.id
    WHERE o.status IN ('Pending', 'Preparing')
  `;

  db.query(sql, (err, items) => {
    if (err) {
      return callback(err);
    }

    const kitchenCapacity = 2;

    const totalWorkMinutes = items.reduce(
      (sum, item) =>
        sum + Number(item.prep_time) * Number(item.quantity),
      0
    );

    const activeOrders = new Set(
      items.map((item) => item.order_id)
    ).size;

    const activeItems = items.reduce(
      (sum, item) => sum + Number(item.quantity),
      0
    );

    const estimatedWorkloadMinutes = Math.ceil(
      totalWorkMinutes / kitchenCapacity
    );

    const kitchenStatus =
      estimatedWorkloadMinutes >= 30
        ? "Busy"
        : estimatedWorkloadMinutes >= 15
        ? "Moderate"
        : "Relaxed";

    callback(null, {
      active_orders: activeOrders,
      active_items: activeItems,
      total_work_minutes: totalWorkMinutes,
      kitchen_capacity: kitchenCapacity,
      estimated_workload_minutes: estimatedWorkloadMinutes,
      kitchen_status: kitchenStatus
    });
  });
}

// =========================
// KITCHEN PULSE - WORKLOAD API
// =========================

app.get(
  "/api/kitchen-pulse",
  authMiddleware,
  adminMiddleware,
  (req, res) => {
    calculateKitchenWorkload((err, workload) => {
      if (err) {
        console.error("Kitchen Pulse error:", err);

        return res.status(500).json({
          message: "Failed to calculate kitchen workload"
        });
      }

      res.json(workload);
    });
  }
);

// =========================
// SMART MEAL RECOMMENDATION
// =========================

app.get("/api/recommendations", (req, res) => {
  const maxPrice = Number(req.query.maxPrice);

  const preference =
    typeof req.query.preference === "string"
      ? req.query.preference.toLowerCase()
      : "popular";

  const allowedPreferences = [
    "popular",
    "quick",
    "filling",
    "beverage"
  ];

  if (
    !Number.isFinite(maxPrice) ||
    maxPrice <= 0
  ) {
    return res.status(400).json({
      message: "Please provide a valid budget"
    });
  }

  if (!allowedPreferences.includes(preference)) {
    return res.status(400).json({
      message: "Invalid meal preference"
    });
  }

  let sql = `
    SELECT
      foods.id,
      foods.name,
      foods.price,
      foods.category,
      foods.meal_type,
      foods.available,
      foods.image_url,

      COALESCE(
        SUM(
          CASE
            WHEN orders.status = 'Completed'
            THEN order_items.quantity
            ELSE 0
          END
        ),
        0
      ) AS popularity

    FROM foods

    LEFT JOIN order_items
      ON foods.id = order_items.food_id

    LEFT JOIN orders
      ON order_items.order_id = orders.id

    WHERE foods.available = 1
      AND foods.price <= ?
  `;

  const queryValues = [maxPrice];

  // Popular can use foods from every meal type.
  // Other preferences filter by meal_type.
  if (preference !== "popular") {
    sql += `
      AND foods.meal_type = ?
    `;

    queryValues.push(preference);
  }

  sql += `
    GROUP BY
      foods.id,
      foods.name,
      foods.price,
      foods.category,
      foods.meal_type,
      foods.available,
      foods.image_url

    ORDER BY
      popularity DESC,
      foods.price DESC

    LIMIT 5
  `;

  db.query(
    sql,
    queryValues,
    (err, results) => {
      if (err) {
        console.error(err);

        return res.status(500).json({
          message:
            "Failed to generate meal recommendations"
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          message:
            "No available meals match your preference and budget"
        });
      }

      res.json({
        budget: maxPrice,
        preference,
        recommendations: results
      });
    }
  );
});

// =========================
// ROOT
// =========================

app.get("/", (req, res) => {
  res.send("Mealix API is running!");
});


// =========================
// REGISTER
// =========================

app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;

const cleanName =
  typeof name === "string" ? name.trim() : "";

const cleanEmail =
  typeof email === "string"
    ? email.trim().toLowerCase()
    : "";

if (!cleanName || !cleanEmail || !password) {
  return res.status(400).json({
    message: "All fields are required"
  });
}

if (cleanName.length < 2) {
  return res.status(400).json({
    message: "Name must be at least 2 characters"
  });
}

if (cleanName.length > 50) {
  return res.status(400).json({
    message: "Name must be 50 characters or less"
  });
}

const emailPattern =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailPattern.test(cleanEmail)) {
  return res.status(400).json({
    message: "Please enter a valid email address"
  });
}

if (
  typeof password !== "string" ||
  password.length < 6
) {
  return res.status(400).json({
    message: "Password must be at least 6 characters"
  });
}

if (password.length > 72) {
  return res.status(400).json({
    message: "Password is too long"
  });
}

  try {
    const checkSql = "SELECT * FROM users WHERE email = ?";

    db.query(
  checkSql,
  [cleanEmail],
  async (err, results) => {
    try {  

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

      const hashedPassword = await bcrypt.hash(password, 10);

      const insertSql =
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";

        db.query(
            insertSql,
            [cleanName, cleanEmail, hashedPassword],
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
      } catch (error) {
      console.error("Registration error:", error);

      if (!res.headersSent) {
        return res.status(500).json({
          message: "Failed to register user"
        });
      }
    }
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});



// =========================
// LOGIN
// =========================

app.post("/api/login", (req, res) => {
 const { email, password } = req.body;

const cleanEmail =
  typeof email === "string"
    ? email.trim().toLowerCase()
    : "";

if (!cleanEmail || !password) {
  return res.status(400).json({
    message: "Email and password are required"
  });
}

const emailPattern =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailPattern.test(cleanEmail)) {
  return res.status(400).json({
    message: "Please enter a valid email address"
  });
}

if (typeof password !== "string") {
  return res.status(400).json({
    message: "Invalid password"
  });
}

  const sql = "SELECT * FROM users WHERE email = ?";

  db.query(
  sql,
  [cleanEmail],
  async (err, results) => {
    try {
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
        email: user.email,
        role: user.role
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
        email: user.email,
        role: user.role
      }
    });
    } catch (error) {
      console.error("Login error:", error);

      if (!res.headersSent) {
        return res.status(500).json({
          message: "Login failed. Please try again."
        });
      }
    }
  });
});



// =========================
// PROFILE
// =========================

app.get("/api/profile", authMiddleware, (req, res) => {
  res.json({
    message: "You are authenticated!",
    user: req.user
  });
});



// =========================
// CREATE ORDER
// =========================


app.post("/api/orders", authMiddleware, async (req, res) => {
  const { items, kitchen_note } = req.body;

if (
  kitchen_note != null &&
  typeof kitchen_note !== "string"
) {
  return res.status(400).json({
    message: "Invalid kitchen instructions"
  });
}

const cleanKitchenNote =
  typeof kitchen_note === "string"
    ? kitchen_note.trim()
    : "";

if (cleanKitchenNote.length > 300) {
  return res.status(400).json({
    message: "Kitchen instructions must be 300 characters or less"
  });
}

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      message: "Cart is empty"
    });
  }

  const invalidItem = items.some(
    (item) =>
      !item ||
      !Number.isSafeInteger(Number(item.food_id)) ||
      Number(item.food_id) <= 0 ||
      !Number.isSafeInteger(Number(item.quantity)) ||
      Number(item.quantity) <= 0 ||
      Number(item.quantity) > 20
  );

  if (invalidItem) {
    return res.status(400).json({
      message: "Invalid cart items"
    });
  }

  // Merge duplicate food IDs
  const itemMap = new Map();

  for (const item of items) {
    const foodId = Number(item.food_id);
    const quantity = Number(item.quantity);

    itemMap.set(
      foodId,
      (itemMap.get(foodId) || 0) + quantity
    );
  }

  const normalizedItems = Array.from(
    itemMap,
    ([food_id, quantity]) => ({ food_id, quantity })
  );

  if (
    normalizedItems.length > 30 ||
    normalizedItems.some((item) => item.quantity > 20)
  ) {
    return res.status(400).json({
      message: "Maximum 20 of each food and 30 different foods per order"
    });
  }

  let connection;

  try {
    connection = await transactionPool.getConnection();

    await connection.beginTransaction();

    const foodIds = normalizedItems
      .map((item) => item.food_id)
      .sort((a, b) => a - b);

    const placeholders = foodIds.map(() => "?").join(",");

    // Lock food rows until checkout finishes
    const [foods] = await connection.query(
      `SELECT id, name, price, available
       FROM foods
       WHERE id IN (${placeholders})
       ORDER BY id
       FOR UPDATE`,
      foodIds
    );

    if (foods.length !== foodIds.length) {
      await connection.rollback();

      return res.status(400).json({
        message: "One or more food items do not exist"
      });
    }

    const unavailableFoods = foods.filter(
      (food) => Number(food.available) !== 1
    );

    if (unavailableFoods.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        message: `${unavailableFoods.map((f) => f.name).join(", ")} is currently unavailable`
      });
    }

    const foodMap = new Map(
      foods.map((food) => [Number(food.id), food])
    );

    // Never trust prices sent from the frontend
    const calculatedTotal = normalizedItems.reduce(
      (total, item) =>
        total +
        Number(foodMap.get(item.food_id).price) * item.quantity,
      0
    );

    const [orderResult] = await connection.query(
  `INSERT INTO orders (user_id, total_amount, kitchen_note)
   VALUES (?, ?, ?)`,
  [
    req.user.id,
    calculatedTotal,
    cleanKitchenNote || null
  ]
);

    const orderId = orderResult.insertId;

    const pickupToken =
      `MXL-${String(orderId).padStart(3, "0")}`;

    await connection.query(
      `UPDATE orders SET pickup_token = ? WHERE id = ?`,
      [pickupToken, orderId]
    );

    const itemValues = normalizedItems.map((item) => [
      orderId,
      item.food_id,
      item.quantity,
      Number(foodMap.get(item.food_id).price)
    ]);

    await connection.query(
      `INSERT INTO order_items
       (order_id, food_id, quantity, unit_price)
       VALUES ?`,
      [itemValues]
    );

    await connection.commit();

    return res.status(201).json({
      message: "Order placed successfully",
      orderId,
      pickupToken
    });

  } catch (error) {
    console.error("Checkout error:", error);

    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Rollback error:", rollbackError);
      }
    }

    return res.status(500).json({
      message: "Failed to place order"
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
});


// =========================
// STUDENT ORDERS
// =========================

app.get("/api/orders", authMiddleware, (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT
      orders.id AS order_id,
      orders.pickup_token,
      orders.total_amount,
      orders.status,
      orders.created_at,
      foods.name AS food_name,
order_items.unit_price AS price,
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

    // Get all currently active orders in the canteen
    const queueSql = `
      SELECT id, status, created_at
      FROM orders
      WHERE status IN ('Pending', 'Preparing')
      ORDER BY created_at ASC, id ASC
    `;

    db.query(queueSql, (err, activeOrders) => {
      if (err) {
        console.error(err);

        return res.status(500).json({
          message: "Failed to calculate pickup time"
        });
      }

      // Add queue information to every returned row
      const ordersWithEstimate = results.map((item) => {
        let ordersAhead = 0;
        let estimatedPickup = "";

        if (item.status === "Pending") {
          const currentPosition = activeOrders.findIndex(
            (order) => order.id === item.order_id
          );

          ordersAhead =
            currentPosition >= 0
              ? currentPosition
              : 0;

          const minimumMinutes =
            5 + ordersAhead * 5;

          const maximumMinutes =
            minimumMinutes + 5;

          estimatedPickup =
            `${minimumMinutes}–${maximumMinutes} minutes`;
        } else if (item.status === "Preparing") {
          estimatedPickup = "5–10 minutes";
        } else if (item.status === "Ready") {
          estimatedPickup = "Ready for pickup";
        } else if (item.status === "Completed") {
          estimatedPickup = "Order collected";
        } else if (item.status === "Cancelled") {
          estimatedPickup = "Order cancelled";
        } else {
          estimatedPickup = "Calculating...";
        }

        return {
          ...item,
          orders_ahead: ordersAhead,
          estimated_pickup: estimatedPickup
        };
      });

      res.json(ordersWithEstimate);
    });
  });
});

// =========================
// CANCEL STUDENT ORDER
// =========================

app.patch("/api/orders/:id/cancel", authMiddleware, (req, res) => {
  const orderId = req.params.id;
  const userId = req.user.id;

  const sql = `
    UPDATE orders
    SET status = 'Cancelled'
    WHERE id = ?
      AND user_id = ?
      AND status = 'Pending'
  `;

  db.query(sql, [orderId, userId], (err, result) => {
    if (err) {
      console.error(err);

      return res.status(500).json({
        message: "Failed to cancel order"
      });
    }

    if (result.affectedRows === 0) {
      return res.status(400).json({
        message: "Order cannot be cancelled"
      });
    }

    res.json({
      message: "Order cancelled successfully"
    });
  });
});

// =========================
// ADMIN ORDERS
// =========================

app.get(
  "/api/admin/orders",
  authMiddleware,
  adminMiddleware,
  (req, res) => {
    const sql = `
      SELECT
        orders.id AS order_id,
        users.name AS customer_name,
        users.email AS customer_email,
        orders.total_amount,
    orders.status,
    orders.kitchen_note,
    orders.created_at,
        foods.name AS food_name,
order_items.unit_price AS price,
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
  }
);



// =========================
// ADMIN STATS
// =========================

app.get(
  "/api/admin/stats",
  authMiddleware,
  adminMiddleware,
  (req, res) => {
    const sql = `
      SELECT
        COUNT(DISTINCT orders.id) AS total_orders,

        COUNT(
          DISTINCT CASE
            WHEN orders.status = 'Pending'
            THEN orders.id
          END
        ) AS pending_orders,

        COUNT(
          DISTINCT CASE
            WHEN orders.status = 'Preparing'
            THEN orders.id
          END
        ) AS preparing_orders,

        COUNT(
          DISTINCT CASE
            WHEN orders.status = 'Ready'
            THEN orders.id
          END
        ) AS ready_orders,

        COUNT(
          DISTINCT CASE
            WHEN orders.status = 'Completed'
            THEN orders.id
          END
        ) AS completed_orders,

        COALESCE(
  SUM(
    CASE
      WHEN orders.status = 'Completed'
      THEN orders.total_amount
      ELSE 0
    END
  ),
  0
) AS total_revenue,

COALESCE(
  AVG(
    CASE
      WHEN orders.status = 'Completed'
      THEN orders.total_amount
      ELSE NULL
    END
  ),
  0
) AS average_order_value

      FROM orders
    `;

    db.query(sql, (err, results) => {
      if (err) {
        console.error(err);

        return res.status(500).json({
          message: "Failed to fetch admin stats"
        });
      }

      res.json(results[0]);
    });
  }
);

// =========================
// ADMIN FOOD ANALYTICS
// =========================

app.get(
  "/api/admin/analytics/foods",
  authMiddleware,
  adminMiddleware,
  (req, res) => {
    const sql = `
      SELECT
        foods.id,
        foods.name,
        foods.category,

        COALESCE(
          SUM(order_items.quantity),
          0
        ) AS total_quantity_sold,

        COALESCE(
          SUM(
            order_items.quantity * order_items.unit_price
          ),
          0
        ) AS total_sales

      FROM foods

      JOIN order_items
        ON foods.id = order_items.food_id

      JOIN orders
        ON order_items.order_id = orders.id

      WHERE orders.status = 'Completed'

      GROUP BY
        foods.id,
        foods.name,
        foods.category

      ORDER BY total_quantity_sold DESC
    `;

    db.query(sql, (err, results) => {
      if (err) {
        console.error(err);

        return res.status(500).json({
          message: "Failed to fetch food analytics"
        });
      }

      res.json(results);
    });
  }
);

// =========================
// ADMIN DAILY ANALYTICSf
// =========================

app.get(
  "/api/admin/analytics/daily",
  authMiddleware,
  adminMiddleware,
  (req, res) => {
    const sql = `
      SELECT
        DATE_FORMAT(created_at, '%Y-%m-%d') AS date,

        COUNT(id) AS total_orders,

        COALESCE(
          SUM(total_amount),
          0
        ) AS total_revenue

      FROM orders

      WHERE status = 'Completed'

      GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')

ORDER BY DATE_FORMAT(created_at, '%Y-%m-%d') ASC
    `;

    db.query(sql, (err, results) => {
      if (err) {
        console.error(err);

        return res.status(500).json({
          message: "Failed to fetch daily analytics"
        });
      }

      res.json(results);
    });
  }
);

// =========================
// ADMIN HOURLY ANALYTICS
// =========================

app.get(
  "/api/admin/analytics/hourly",
  authMiddleware,
  adminMiddleware,
  (req, res) => {
    const sql = `
      SELECT
        HOUR(created_at) AS hour,
        COUNT(id) AS total_orders

      FROM orders

      WHERE status = 'Completed'

      GROUP BY HOUR(created_at)

      ORDER BY HOUR(created_at) ASC
    `;

    db.query(sql, (err, results) => {
      if (err) {
        console.error(err);

        return res.status(500).json({
          message: "Failed to fetch hourly analytics"
        });
      }

      res.json(results);
    });
  }
);

// =========================
// ADMIN CATEGORY ANALYTICS
// =========================

app.get(
  "/api/admin/analytics/categories",
  authMiddleware,
  adminMiddleware,
  (req, res) => {
    const sql = `
      SELECT
        foods.category,

        SUM(order_items.quantity) AS total_quantity_sold,

        COALESCE(
          SUM(
            order_items.quantity * order_items.unit_price
          ),
          0
        ) AS total_sales

      FROM order_items

      JOIN foods
        ON order_items.food_id = foods.id

      JOIN orders
        ON order_items.order_id = orders.id

      WHERE orders.status = 'Completed'

      GROUP BY foods.category

      ORDER BY total_quantity_sold DESC
    `;

    db.query(sql, (err, results) => {
      if (err) {
        console.error(err);

        return res.status(500).json({
          message: "Failed to fetch category analytics"
        });
      }

      res.json(results);
    });
  }
);

// =========================
// ADMIN ADD FOOD
// =========================

app.post(
  "/api/admin/foods",
  authMiddleware,
  adminMiddleware,
  (req, res) => {
    const {
      name,
      price,
      category,
      available,
      image_url,
      meal_type,
      description
    } = req.body;

    const cleanName =
  typeof name === "string" ? name.trim() : "";

const cleanCategory =
  typeof category === "string"
    ? category.trim()
    : "";

const numericPrice = Number(price);

if (!cleanName || !cleanCategory || price === "") {
  return res.status(400).json({
    message: "Name, price and category are required"
  });
}

if (cleanName.length < 2) {
  return res.status(400).json({
    message: "Food name must be at least 2 characters"
  });
}

if (
  !Number.isFinite(numericPrice) ||
  numericPrice <= 0
) {
  return res.status(400).json({
    message: "Price must be greater than 0"
  });
}
const allowedMealTypes = [
  "quick",
  "filling",
  "beverage"
];

if (!allowedMealTypes.includes(meal_type)) {
  return res.status(400).json({
    message: "Please select a valid meal type"
  });
}
const cleanDescription =
  typeof description === "string"
    ? description.trim()
    : "";

if (cleanDescription.length > 500) {
  return res.status(400).json({
    message: "Description must be 500 characters or less"
  });
}
    const sql = `
  INSERT INTO foods
  (
INSERT INTO foods
  (
    name,
    price,
    category,
    available,
    image_url,
    meal_type,
    description
  )
  VALUES (?, ?, ?, ?, ?, ?, ?)
`;

db.query(
  sql,
  [
    cleanName,
    numericPrice,
    cleanCategory,
    available ?? true,
    image_url || null,
    meal_type,
    cleanDescription
  ],
  (err, result) => {
    if (err) {
      console.error(err);

      return res.status(500).json({
        message: "Failed to add food"
      });
    }

    res.status(201).json({
      message: "Food added successfully",
      foodId: result.insertId
    });
  }
);
  }
);



// =========================
// ADMIN EDIT FOOD
// =========================

app.put(
  "/api/admin/foods/:id",
  authMiddleware,
  adminMiddleware,
  (req, res) => {
    const foodId = req.params.id;

      const {
          name,
          price,
          category,
          available,
          image_url,
          meal_type,
          description
      } = req.body;

    const cleanName =
  typeof name === "string" ? name.trim() : "";

const cleanCategory =
  typeof category === "string"
    ? category.trim()
    : "";

const numericPrice = Number(price);

if (!cleanName || !cleanCategory || price === "") {
  return res.status(400).json({
    message: "Name, price and category are required"
  });
}

if (cleanName.length < 2) {
  return res.status(400).json({
    message: "Food name must be at least 2 characters"
  });
}

if (
  !Number.isFinite(numericPrice) ||
  numericPrice <= 0
) {
  return res.status(400).json({
    message: "Price must be greater than 0"
  });
}
const allowedMealTypes = [
  "quick",
  "filling",
  "beverage"
];

if (!allowedMealTypes.includes(meal_type)) {
  return res.status(400).json({
    message: "Please select a valid meal type"
  });
}
const cleanDescription =
  typeof description === "string"
    ? description.trim()
    : "";

if (cleanDescription.length > 500) {
  return res.status(400).json({
    message: "Description must be 500 characters or less"
  });
}
      const sql = `
  UPDATE foods
  SET
    name = ?,
    price = ?,
    category = ?,
    available = ?,
    image_url = ?,
    meal_type = ?,
    description = ?

  WHERE id = ?
`;

    db.query(
      sql,
        [
            cleanName,
            numericPrice,
            cleanCategory,
            available,
            image_url || null,
            meal_type,
            cleanDescription,
            foodId
        ],
      (err, result) => {
        if (err) {
          console.error(err);

          return res.status(500).json({
            message: "Failed to update food"
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            message: "Food not found"
          });
        }

        res.json({
          message: "Food updated successfully"
        });
      }
    );
  }
);



// =========================
// ADMIN DELETE FOOD
// =========================

app.delete(
  "/api/admin/foods/:id",
  authMiddleware,
  adminMiddleware,
  (req, res) => {
    const foodId = req.params.id;

    const sql = `
      DELETE FROM foods
      WHERE id = ?
    `;

    db.query(
      sql,
      [foodId],
      (err, result) => {
        if (err) {
          console.error(err);

          return res.status(500).json({
            message: "Failed to delete food"
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            message: "Food not found"
          });
        }

        res.json({
          message: "Food deleted successfully"
        });
      }
    );
  }
);



// =========================
// ADMIN UPDATE ORDER STATUS
// =========================

app.patch(
  "/api/admin/orders/:id/status",
  authMiddleware,
  adminMiddleware,
  (req, res) => {
    const orderId = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({
        message: "Invalid order ID"
      });
    }

    const allowedTransitions = {
      Pending: "Preparing",
      Preparing: "Ready",
      Ready: "Completed"
    };

    const sql = `
      SELECT status
      FROM orders
      WHERE id = ?
    `;

    db.query(sql, [orderId], (err, results) => {
      if (err) {
        console.error(err);

        return res.status(500).json({
          message: "Failed to check order status"
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          message: "Order not found"
        });
      }

      const currentStatus = results[0].status;

      if (currentStatus === "Cancelled") {
        return res.status(409).json({
          message: "Cancelled orders cannot be updated"
        });
      }

      if (currentStatus === "Completed") {
        return res.status(409).json({
          message: "Completed orders cannot be updated"
        });
      }

      const expectedNextStatus =
        allowedTransitions[currentStatus];

      if (status !== expectedNextStatus) {
        return res.status(400).json({
          message:
            `Order must move from ${currentStatus} to ${expectedNextStatus}`
        });
      }

      const updateSql = `
        UPDATE orders
        SET status = ?
        WHERE id = ?
          AND status = ?
      `;

      db.query(
        updateSql,
        [status, orderId, currentStatus],
        (err, result) => {
          if (err) {
            console.error(err);

            return res.status(500).json({
              message: "Failed to update order status"
            });
          }

          if (result.affectedRows === 0) {
            return res.status(409).json({
              message:
                "Order status changed. Please refresh and try again."
            });
          }

          res.json({
            message: "Order status updated successfully",
            status
          });
        }
      );
    });
  }
);

 // =========================
 // GROUPBITE - CREATE GROUP
 // =========================


app.post("/api/groups", authMiddleware, async (req, res) => {
  const hostUserId = req.user.id;

  if (!hostUserId) {
    return res.status(401).json({
      message: "Please log in to create a group"
    });
  }

  function generateGroupCode() {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";

    for (let i = 0; i < 6; i++) {
      code += characters[crypto.randomInt(characters.length)];
    }

    return code;
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    let connection;

    try {
      connection = await transactionPool.getConnection();
      await connection.beginTransaction();

      const groupCode = generateGroupCode();

      const [groupResult] = await connection.query(
        `INSERT INTO group_orders (group_code, host_user_id)
         VALUES (?, ?)`,
        [groupCode, hostUserId]
      );

      const groupId = groupResult.insertId;

      await connection.query(
        `INSERT INTO group_members (group_id, user_id)
         VALUES (?, ?)`,
        [groupId, hostUserId]
      );

      await connection.commit();

      return res.status(201).json({
        message: "Group created successfully",
        group: {
          id: groupId,
          group_code: groupCode,
          host_user_id: hostUserId,
          status: "Open"
        }
      });

    } catch (error) {
      if (connection) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error("Group rollback error:", rollbackError);
        }
      }

      // Retry only if the generated code already exists.
      if (error.code === "ER_DUP_ENTRY") {
        if (attempt < 4) continue;

        return res.status(503).json({
          message: "Could not generate a unique group code. Try again."
        });
      }

      console.error("GroupBite create error:", error);

      return res.status(500).json({
        message: "Failed to create group"
      });

    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
});

 // =========================
 // GROUPBITE - JOIN GROUP
 // =========================


app.post("/api/groups/join", authMiddleware, async (req, res) => {
  const userId = req.user.id;

  const groupCode =
    typeof req.body?.group_code === "string"
      ? req.body.group_code.trim().toUpperCase()
      : "";

  if (!/^[A-Z0-9]{6}$/.test(groupCode)) {
    return res.status(400).json({
      message: "Enter a valid 6-character group code"
    });
  }

  let connection;

  try {
    connection = await transactionPool.getConnection();
    await connection.beginTransaction();

    const [groups] = await connection.query(
      `SELECT id, group_code, host_user_id, status
       FROM group_orders
       WHERE group_code = ?
       FOR UPDATE`,
      [groupCode]
    );

    if (groups.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        message: "Group not found"
      });
    }

    const group = groups[0];

    if (group.status !== "Open") {
      await connection.rollback();
      return res.status(409).json({
        message: "This group is no longer accepting members"
      });
    }

    const [result] = await connection.query(
      `INSERT IGNORE INTO group_members (group_id, user_id)
       VALUES (?, ?)`,
      [group.id, userId]
    );

    await connection.commit();

    return res.json({
      message:
        result.affectedRows === 0
          ? "You are already a member of this group"
          : "Joined group successfully",
      group: {
        id: group.id,
        group_code: group.group_code,
        host_user_id: group.host_user_id,
        status: group.status
      }
    });

  } catch (error) {
    console.error("GroupBite join error:", error);

    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Rollback error:", rollbackError);
      }
    }

    return res.status(500).json({
      message: "Failed to join group"
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
});

async function withOpenGroupCart(req, res, groupId, action) {
  let connection;
  let started = false;

  try {
    connection = await transactionPool.getConnection();
    await connection.beginTransaction();
    started = true;

    // Checkout locks this same group row.
    const [groups] = await connection.query(
      `SELECT id, status
       FROM group_orders
       WHERE id = ?
       FOR UPDATE`,
      [groupId]
    );

    if (groups.length === 0 || groups[0].status !== "Open") {
      await connection.rollback();
      started = false;
      return res.status(409).json({
        message: "Group not found or already closed"
      });
    }

    const [members] = await connection.query(
      `SELECT id
       FROM group_members
       WHERE group_id = ? AND user_id = ?`,
      [groupId, req.user.id]
    );

    if (members.length === 0) {
      await connection.rollback();
      started = false;
      return res.status(403).json({
        message: "You are not a group member"
      });
    }

    const result = await action(connection);

    if (result.status >= 400) {
      await connection.rollback();
      started = false;
    } else {
      await connection.commit();
      started = false;
    }

    return res.status(result.status).json(result.body);

  } catch (error) {
    console.error("GroupBite cart transaction:", error);

    if (connection && started) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Cart rollback failed:", rollbackError);
      }
    }

    return res.status(500).json({
      message: "Failed to update group cart"
    });

  } finally {
    if (connection) connection.release();
  }
}


 // =========================
 // GROUPBITE - ADD TO SHARED CART
 // =========================


app.post("/api/groups/:groupId/items", authMiddleware, async (req, res) => {
  const groupId = Number(req.params.groupId);
  const foodId = Number(req.body?.food_id);
  const quantity = Number(req.body?.quantity);
  const userId = Number(req.user.id);

  if (
    !Number.isSafeInteger(groupId) || groupId <= 0 ||
    !Number.isSafeInteger(foodId) || foodId <= 0 ||
    !Number.isSafeInteger(quantity) ||
    quantity < 1 || quantity > 20
  ) {
    return res.status(400).json({
      message: "Invalid group, food, or quantity"
    });
  }

  return withOpenGroupCart(req, res, groupId, async (connection) => {
    const [foods] = await connection.query(
      `SELECT id FROM foods
       WHERE id = ? AND available = 1`,
      [foodId]
    );

    if (foods.length === 0) {
      return {
        status: 409,
        body: { message: "Food is unavailable" }
      };
    }

    // Lock any existing item before updating its quantity.
    const [existing] = await connection.query(
      `SELECT id, quantity
       FROM group_cart_items
       WHERE group_id = ? AND user_id = ? AND food_id = ?
       FOR UPDATE`,
      [groupId, userId, foodId]
    );

    if (existing.length > 0) {
      const newQuantity = Number(existing[0].quantity) + quantity;

      if (newQuantity > 20) {
        return {
          status: 409,
          body: { message: "Maximum 20 of the same food per student" }
        };
      }

      await connection.query(
        `UPDATE group_cart_items
         SET quantity = ?
         WHERE id = ?`,
        [newQuantity, existing[0].id]
      );
    } else {
      await connection.query(
        `INSERT INTO group_cart_items
         (group_id, user_id, food_id, quantity)
         VALUES (?, ?, ?, ?)`,
        [groupId, userId, foodId, quantity]
      );
    }

    return {
      status: 201,
      body: { message: "Food added to group cart" }
    };
  });
});

 // =========================
 // GROUPBITE - VIEW SHARED CART
 // =========================

app.get("/api/groups/:groupId/cart", authMiddleware, (req, res) => {
  const groupId = Number(req.params.groupId);
  const userId = req.user.id;

  if (!Number.isSafeInteger(groupId) || groupId <= 0) {
    return res.status(400).json({
      message: "Invalid group ID"
    });
  }

  db.query(
    `SELECT g.id, g.group_code, g.host_user_id, g.status
     FROM group_orders g
     JOIN group_members gm ON gm.group_id = g.id
     WHERE g.id = ? AND gm.user_id = ?`,
    [groupId, userId],
    (memberErr, groups) => {
      if (memberErr) {
        return res.status(500).json({
          message: "Failed to verify group membership"
        });
      }

      if (groups.length === 0) {
        return res.status(403).json({
          message: "You are not a member of this group"
        });
      }

      db.query(
        `SELECT
           gci.id,
           gci.user_id,
           u.name AS added_by,
           gci.food_id,
           f.name AS food_name,
           f.price,
           f.available,
           gci.quantity,
           (f.price * gci.quantity) AS subtotal
         FROM group_cart_items gci
         JOIN users u ON u.id = gci.user_id
         JOIN foods f ON f.id = gci.food_id
         WHERE gci.group_id = ?
         ORDER BY gci.id ASC`,
        [groupId],
        (cartErr, items) => {
          if (cartErr) {
            console.error("Group cart fetch error:", cartErr);

            return res.status(500).json({
              message: "Failed to fetch group cart"
            });
          }

          const total = items.reduce(
            (sum, item) => sum + Number(item.subtotal),
            0
          );

          res.json({
            group: groups[0],
            items,
            total_amount: Number(total.toFixed(2))
          });
        }
      );
    }
  );
});

 // =========================
 // GROUPBITE - UPDATE CART ITEM
 // =========================


app.patch("/api/groups/:groupId/items/:itemId", authMiddleware, async (req, res) => {
  const groupId = Number(req.params.groupId);
  const itemId = Number(req.params.itemId);
  const quantity = Number(req.body?.quantity);
  const userId = Number(req.user.id);

  if (
    !Number.isSafeInteger(groupId) || groupId <= 0 ||
    !Number.isSafeInteger(itemId) || itemId <= 0 ||
    !Number.isSafeInteger(quantity) ||
    quantity < 1 || quantity > 20
  ) {
    return res.status(400).json({
      message: "Invalid group, item, or quantity"
    });
  }

  return withOpenGroupCart(req, res, groupId, async (connection) => {
    const [result] = await connection.query(
      `UPDATE group_cart_items
       SET quantity = ?
       WHERE id = ?
         AND group_id = ?
         AND user_id = ?`,
      [quantity, itemId, groupId, userId]
    );

    if (result.affectedRows === 0) {
      return {
        status: 403,
        body: {
          message: "Item not found or permission denied"
        }
      };
    }

    return {
      status: 200,
      body: {
        message: "Item quantity updated",
        quantity
      }
    };
  });
});

 // =========================
 // GROUPBITE - REMOVE CART ITEM
 // =========================


app.delete("/api/groups/:groupId/items/:itemId", authMiddleware, async (req, res) => {
  const groupId = Number(req.params.groupId);
  const itemId = Number(req.params.itemId);
  const userId = Number(req.user.id);

  if (
    !Number.isSafeInteger(groupId) || groupId <= 0 ||
    !Number.isSafeInteger(itemId) || itemId <= 0
  ) {
    return res.status(400).json({
      message: "Invalid group or item ID"
    });
  }

  return withOpenGroupCart(req, res, groupId, async (connection) => {
    const [result] = await connection.query(
      `DELETE FROM group_cart_items
       WHERE id = ?
         AND group_id = ?
         AND user_id = ?`,
      [itemId, groupId, userId]
    );

    if (result.affectedRows === 0) {
      return {
        status: 403,
        body: {
          message: "Item not found or permission denied"
        }
      };
    }

    return {
      status: 200,
      body: { message: "Item removed from group cart" }
    };
  });
});



 // =========================
 // GROUPBITE - HOST CHECKOUT
 // =========================


app.post("/api/groups/:groupId/checkout", authMiddleware, async (req, res) => {

  const groupId = Number(req.params.groupId);
  const userId = Number(req.user.id);
  const { kitchen_note } = req.body;

if (kitchen_note != null && typeof kitchen_note !== "string") {
  return res.status(400).json({
    message: "Invalid kitchen instructions"
  });
}

const cleanKitchenNote =
  typeof kitchen_note === "string" ? kitchen_note.trim() : "";

if (cleanKitchenNote.length > 300) {
  return res.status(400).json({
    message: "Kitchen instructions must be 300 characters or less"
  });
}

  if (!Number.isSafeInteger(groupId) || groupId <= 0) {
    return res.status(400).json({
      message: "Invalid group ID"
    });
  }

  let connection;
  let transactionStarted = false;

  try {
    // Dedicated connection for this checkout.
    connection = await transactionPool.getConnection();

    await connection.beginTransaction();
    transactionStarted = true;

    // Lock the group to prevent two simultaneous checkouts.
    const [groups] = await connection.query(
      `SELECT id, host_user_id, status
       FROM group_orders
       WHERE id = ?
       FOR UPDATE`,
      [groupId]
    );

    if (groups.length === 0) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(404).json({
        message: "Group not found"
      });
    }

    const group = groups[0];

    if (Number(group.host_user_id) !== userId) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(403).json({
        message: "Only the group host can checkout"
      });
    }

    if (group.status !== "Open") {
      await connection.rollback();
      transactionStarted = false;
      return res.status(409).json({
        message: "This group has already been closed"
      });
    }

    // Read the cart while holding the group lock.
    // Aggregate quantities in JavaScript to avoid
    // combining GROUP BY with FOR UPDATE.
    const [cartRows] = await connection.query(
      `SELECT food_id, quantity
       FROM group_cart_items
       WHERE group_id = ?
       FOR UPDATE`,
      [groupId]
    );

    if (cartRows.length === 0) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(400).json({
        message: "The group cart is empty"
      });
    }

    const quantities = new Map();

    for (const row of cartRows) {
      const foodId = Number(row.food_id);
      const qty = Number(row.quantity);

      quantities.set(
        foodId,
        (quantities.get(foodId) || 0) + qty
      );
    }

    const foodIds = [...quantities.keys()];

    // Use current database prices, not frontend prices.
    const [foods] = await connection.query(
      `SELECT id, name, price, available
       FROM foods
       WHERE id IN (?)
       FOR UPDATE`,
      [foodIds]
    );

    if (foods.length !== foodIds.length) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(409).json({
        message: "Some food items no longer exist"
      });
    }

    const invalid = foods.some((food) => {
      const qty = quantities.get(Number(food.id));

      return (
        Number(food.available) !== 1 ||
        !Number.isSafeInteger(qty) ||
        qty <= 0 ||
        qty > 100 ||
        !Number.isFinite(Number(food.price)) ||
        Number(food.price) <= 0
      );
    });

    if (invalid) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(409).json({
        message: "Some items are unavailable or have invalid quantities"
      });
    }

    const totalAmount = Number(
      foods.reduce(
        (sum, food) =>
          sum +
          Number(food.price) *
          quantities.get(Number(food.id)),
        0
      ).toFixed(2)
    );

    // Create one order owned by the group host.
   const [orderResult] = await connection.query(
  `INSERT INTO orders (user_id, total_amount, kitchen_note)
   VALUES (?, ?, ?)`,
  [userId, totalAmount, cleanKitchenNote || null]
);

    const orderId = orderResult.insertId;

    // Same token format as normal Mealix orders.
    const pickupToken =
      `MXL-${String(orderId).padStart(3, "0")}`;

    await connection.query(
      `UPDATE orders
       SET pickup_token = ?
       WHERE id = ?`,
      [pickupToken, orderId]
    );

    const itemValues = foods.map((food) => [
      orderId,
      food.id,
      quantities.get(Number(food.id)),
      Number(food.price)
    ]);

    await connection.query(
      `INSERT INTO order_items
       (order_id, food_id, quantity, unit_price)
       VALUES ?`,
      [itemValues]
    );

    const [updateResult] = await connection.query(
      `UPDATE group_orders
       SET status = 'Placed',
           final_order_id = ?
       WHERE id = ?
         AND status = 'Open'`,
      [orderId, groupId]
    );

    if (updateResult.affectedRows !== 1) {
      throw new Error("Failed to finalize group");
    }

    await connection.commit();
    transactionStarted = false;

    return res.status(201).json({
      message: "Group order placed successfully",
      group_id: groupId,
      order_id: orderId,
      pickup_token: pickupToken,
      total_amount: totalAmount,
      status: "Placed"
    });

  } catch (error) {
    console.error("GroupBite checkout error:", error);

    if (connection && transactionStarted) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Checkout rollback failed:", rollbackError);
      }
    }

    return res.status(500).json({
      message: "Failed to complete group checkout"
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
});
// LIVE PICKUP BOARD — PUBLIC READ-ONLY API

app.get("/api/pickup-board", (req, res) => {
  const sql = `
    SELECT
      pickup_token,
      status,
      created_at
    FROM orders
    WHERE status IN ('Preparing', 'Ready')
      AND pickup_token IS NOT NULL
    ORDER BY created_at ASC, id ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Pickup board error:", err);
      return res.status(500).json({
        message: "Failed to load pickup board"
      });
    }

    res.json(results);
  });
});


// =========================
// START SERVER
// =========================

app.listen(5001, () => {
  console.log(
    "Mealix server running on http://localhost:5001"
  );
});