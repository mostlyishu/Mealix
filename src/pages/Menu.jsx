import { useEffect, useState } from "react";
import FoodCard from "../components/FoodCard";
import { useCart } from "../context/CartContext";

function Menu() {
  const { addToCart } = useCart();

  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
  fetch("http://localhost:5001/api/foods")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch foods");
      }

      return response.json();
    })
    .then((data) => {
      setFoods(data);
      setLoading(false);
    })
    .catch((error) => {
      setError(error.message);
      setLoading(false);
    });
}, []);

  return (
    <main>
      <section className="menu-section">
        <h1>Campus Menu</h1>

        <p>Fresh food available on campus today.</p>

        {loading && <p>Loading menu...</p>}

        {error && <p>{error}</p>}

        <div className="food-grid">
          {foods.map((food) => (
            <FoodCard
              key={food.id}
              name={food.name}
              price={food.price}
              category={food.category}
              onAdd={() => addToCart(food)}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

export default Menu;

