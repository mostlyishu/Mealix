require("dotenv").config();

const mysql = require("mysql2");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("./middleware/authMiddleware");
const adminMiddleware = require("./middleware/adminMiddleware");

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

  // Count orders currently waiting in the kitchen
  const queueSql = `
    SELECT COUNT(*) AS active_orders
    FROM orders
    WHERE status IN ('Pending', 'Preparing')
  `;

  db.query(queueSql, (queueErr, queueResults) => {
    if (queueErr) {
      console.error(queueErr);

      return res.status(500).json({
        message: "Failed to check kitchen queue"
      });
    }

    const activeOrders = Number(queueResults[0].active_orders);

    // Initial approximation: 3 minutes per active order
    const queueDelay = activeOrders * 3;

    const foodSql = `
      SELECT
        id,
        name,
        price,
        category,
        image_url,
        meal_type,
        prep_time
      FROM foods
      WHERE available = 1
      ORDER BY prep_time ASC
    `;

    db.query(foodSql, (foodErr, foods) => {
      if (foodErr) {
        console.error(foodErr);

        return res.status(500).json({
          message: "Failed to find suitable meals"
        });
      }

      // Reserve 5 minutes for pickup and unexpected delays
      const safetyBuffer = 5;

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
        active_orders: activeOrders,
        queue_delay: queueDelay,
        safety_buffer: safetyBuffer,
        recommendations,
        message:
          recommendations.length > 0
            ? "Meals available within your break"
            : "No meals currently fit your break time"
      });
    });
  });
});

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
        [[cleanName, cleanEmail, hashedPassword]],
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

app.post("/api/orders", authMiddleware, (req, res) => {
  const { items } = req.body;

  // Check if cart is empty
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      message: "Cart is empty"
    });
  }

  // Validate food IDs and quantities
  const invalidItem = items.some(
    (item) =>
      !Number.isInteger(Number(item.food_id)) ||
      !Number.isInteger(Number(item.quantity)) ||
      Number(item.quantity) <= 0
  );

  if (invalidItem) {
    return res.status(400).json({
      message: "Invalid cart items"
    });
  }

  const userId = req.user.id;

  // =========================
  // NORMALIZE DUPLICATE ITEMS
  // =========================

  const itemMap = new Map();

  items.forEach((item) => {
    const foodId = Number(item.food_id);
    const quantity = Number(item.quantity);

    if (itemMap.has(foodId)) {
      itemMap.set(
        foodId,
        itemMap.get(foodId) + quantity
      );
    } else {
      itemMap.set(foodId, quantity);
    }
  });

  const normalizedItems = Array.from(
    itemMap,
    ([food_id, quantity]) => ({
      food_id,
      quantity
    })
  );

  // Get unique food IDs
  const foodIds = normalizedItems.map(
    (item) => item.food_id
  );

  // Get trusted food data directly from MySQL
  const foodCheckSql = `
    SELECT id, name, price, available
    FROM foods
    WHERE id IN (?)
  `;

  db.query(
    foodCheckSql,
    [foodIds],
    (err, foods) => {
      if (err) {
        console.error(err);

        return res.status(500).json({
          message: "Failed to check food availability"
        });
      }

      // Make sure every requested food exists
      if (foods.length !== foodIds.length) {
        return res.status(400).json({
          message: "One or more food items do not exist"
        });
      }

      // Check whether any requested food is unavailable
      const unavailableFoods = foods.filter(
        (food) => Number(food.available) !== 1
      );

      if (unavailableFoods.length > 0) {
        const names = unavailableFoods
          .map((food) => food.name)
          .join(", ");

        return res.status(409).json({
          message: `${names} is currently unavailable`
        });
      }

      // Calculate trusted total using MySQL prices
      const calculatedTotal = normalizedItems.reduce(
        (total, item) => {
          const food = foods.find(
            (food) => food.id === item.food_id
          );

          return (
            total +
            Number(food.price) * item.quantity
          );
        },
        0
      );

      // Start transaction
      db.beginTransaction((err) => {
        if (err) {
          console.error(err);

          return res.status(500).json({
            message: "Failed to start order transaction"
          });
        }

        const orderSql = `
          INSERT INTO orders (user_id, total_amount)
          VALUES (?, ?)
        `;

        // Create the order
        db.query(
          orderSql,
          [userId, calculatedTotal],
          (err, orderResult) => {
            if (err) {
              return db.rollback(() => {
                console.error(err);

                res.status(500).json({
                  message: "Failed to create order"
                });
              });
            }

            // Get newly created order ID
            const orderId = orderResult.insertId;

            // Generate pickup token
            // Example: order ID 18 -> MXL-018
            const pickupToken =
              `MXL-${String(orderId).padStart(3, "0")}`;

            // Save pickup token
            const tokenSql = `
              UPDATE orders
              SET pickup_token = ?
              WHERE id = ?
            `;

            db.query(
              tokenSql,
              [pickupToken, orderId],
              (err) => {
                if (err) {
                  return db.rollback(() => {
                    console.error(err);

                    res.status(500).json({
                      message:
                        "Failed to generate pickup token"
                    });
                  });
                }

                // Prepare NORMALIZED order items
// Store the price at the time the order is placed
const itemValues = normalizedItems.map((item) => {
  const food = foods.find(
    (food) => food.id === item.food_id
  );

  return [
    orderId,
    item.food_id,
    item.quantity,
    Number(food.price)
  ];
});

const itemSql = `
  INSERT INTO order_items
  (order_id, food_id, quantity, unit_price)
  VALUES ?
`;

                // Save all order items
                db.query(
                  itemSql,
                  [itemValues],
                  (err) => {
                    if (err) {
                      return db.rollback(() => {
                        console.error(err);

                        res.status(500).json({
                          message:
                            "Failed to save order items"
                        });
                      });
                    }

                    // Everything worked
                    db.commit((err) => {
                      if (err) {
                        return db.rollback(() => {
                          console.error(err);

                          res.status(500).json({
                            message:
                              "Failed to complete order"
                          });
                        });
                      }

                      res.status(201).json({
                        message:
                          "Order placed successfully",
                        orderId,
                        pickupToken
                      });
                    });
                  }
                );
              }
            );
          }
        );
      });
    }
  );
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
      meal_type
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
    const sql = `
  INSERT INTO foods
  (
    name,
    price,
    category,
    available,
    image_url,
    meal_type
  )
  VALUES (?, ?, ?, ?, ?, ?)
`;

db.query(
  sql,
  [
    cleanName,
    numericPrice,
    cleanCategory,
    available ?? true,
    image_url || null,
    meal_type
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
          meal_type
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

      const sql = `
  UPDATE foods
  SET
    name = ?,
    price = ?,
    category = ?,
    available = ?,
    image_url = ?,
    meal_type = ?

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
// START SERVER
// =========================

app.listen(5001, () => {
  console.log(
    "Mealix server running on http://localhost:5001"
  );
});