import { useEffect, useState } from "react";
import FoodCard from "../components/FoodCard";
import { useCart } from "../context/CartContext";

function Menu() {
  const { addToCart } = useCart();

  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search and filter states
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("All");

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

  // Create category list automatically from foods
  const categories = [
    "All",
    ...new Set(foods.map((food) => food.category))
  ];

  // Filter foods using search + selected category
  const filteredFoods = foods.filter((food) => {
    const matchesSearch = food.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" ||
      food.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <main>
      <section className="menu-section">
        <div className="menu-header">
          <h1>Campus Menu</h1>

          <p>
            Fresh food available on campus today.
          </p>
        </div>

        {/* Search */}

        <div className="menu-search">
          <input
            type="text"
            placeholder="Search food..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        {/* Category filters */}

        <div className="category-filters">
          {categories.map((category) => (
            <button
              key={category}
              className={
                selectedCategory === category
                  ? "category-button active"
                  : "category-button"
              }
              onClick={() =>
                setSelectedCategory(category)
              }
            >
              {category}
            </button>
          ))}
        </div>

        {/* Loading / error */}

        {loading && <p>Loading menu...</p>}

        {error && <p>{error}</p>}

        {/* Food cards */}

        {!loading &&
          !error &&
          filteredFoods.length === 0 && (
            <p className="no-food-message">
              No food items found.
            </p>
          )}

        <div className="food-grid">
          {filteredFoods.map((food) => (
            <FoodCard
              key={food.id}
              name={food.name}
              price={food.price}
              category={food.category}
              available={food.available}
              onAdd={() => addToCart(food)}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

export default Menu;