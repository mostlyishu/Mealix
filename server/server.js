const mysql = require("mysql2");
const express = require("express");
const cors = require("cors");

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

app.listen(5001, () => {
  console.log("Mealix server running on http://localhost:5001");
});