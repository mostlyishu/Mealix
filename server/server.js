const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const foods = [
  {
    id: 1,
    name: "Paneer Tikka Burger",
    price: 60,
    category: "Burger"
  },
  {
    id: 2,
    name: "Veg Sandwich",
    price: 50,
    category: "Sandwich"
  },
  {
    id: 3,
    name: "Cold Coffee",
    price: 70,
    category: "Beverage"
  },
  {
    id: 4,
    name: "Masala Maggi",
    price: 50,
    category: "Snacks"
  }
];

app.get("/api/foods", (req, res) => {
  res.json(foods);
});

app.get("/", (req, res) => {
  res.send("Mealix API is running!");
});

app.listen(5001, () => {
  console.log("Mealix server running on http://localhost:5001");
});