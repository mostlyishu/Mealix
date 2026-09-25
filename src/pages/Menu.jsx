import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import FoodCard from "../components/FoodCard";
import { useCart } from "../context/CartContext";

function Menu() {
  const {
  cart,
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  totalCartItems
} = useCart();

  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  

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

  const categories = [
    "All",
    ...new Set(
      foods.map((food) => food.category)
    )
  ];

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
    <main className="menu-page">

      {/* MENU INTRO */}

      <section className="menu-header">
  <span className="menu-eyebrow">
    TODAY'S CAMPUS MENU
  </span>

  <h1>What are you craving?</h1>

  <p>
    Fresh campus favourites, ready when you are.
    Find your meal and skip the queue.
  </p>
</section>


      {/* SEARCH + FILTER */}

      <section className="menu-controls">
        <div className="menu-search">
          <span className="menu-search-icon">
            ⌕
          </span>

          <input
            type="text"
            placeholder="Search burgers, coffee, snacks..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          {search && (
            <button
              className="clear-search-button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

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
      </section>


      {/* MENU RESULTS INFO */}

      {!loading && !error && (
        <div className="menu-results-header">
          <p>
            <strong>{filteredFoods.length}</strong>{" "}
            {filteredFoods.length === 1
              ? "item"
              : "items"}{" "}
            available to explore
          </p>

          {selectedCategory !== "All" && (
            <button
              onClick={() =>
                setSelectedCategory("All")
              }
            >
              Clear filter
            </button>
          )}
        </div>
      )}


      {/* LOADING */}

      {loading && (
        <div className="menu-state-card">
          <div className="menu-loader"></div>

          <h3>Preparing the menu...</h3>

          <p>
            Fetching today's campus favourites.
          </p>
        </div>
      )}


      {/* ERROR */}

      {error && (
        <div className="menu-state-card menu-error-state">
          <span>!</span>

          <h3>We couldn't load the menu.</h3>

          <p>{error}</p>
        </div>
      )}


      {/* EMPTY SEARCH */}

      {!loading &&
        !error &&
        filteredFoods.length === 0 && (
          <div className="menu-state-card">
            <span className="empty-search-icon">
              ⌕
            </span>

            <h3>No food found</h3>

            <p>
              Try another search or choose a different
              category.
            </p>

            <button
              className="reset-menu-button"
              onClick={() => {
                setSearch("");
                setSelectedCategory("All");
              }}
            >
              View all food
            </button>
          </div>
        )}


      {/* FOOD GRID */}

      {!loading &&
        !error &&
        filteredFoods.length > 0 && (
          <section className="food-grid">
                  {filteredFoods.map((food) => {
                      const cartItem = cart.find(
                          (item) => item.id === food.id
                      );

                      return (
                          <FoodCard
                              key={food.id}
                              id={food.id}
                              name={food.name}
                              price={food.price}
                              category={food.category}
                              available={Number(food.available) === 1}
                              quantity={cartItem?.quantity || 0}
                              onAdd={() => addToCart(food)}
                              onIncrease={increaseQuantity}
                              onDecrease={decreaseQuantity}
                          />
                      );
                  })}
          </section>
        )}
      {totalCartItems > 0 && (
  <div className="menu-cart-popup">
    <div className="menu-cart-popup-info">
      <div className="menu-cart-popup-icon">
        🛒
      </div>

      <div>
        <strong>
          {totalCartItems}{" "}
          {totalCartItems === 1 ? "item" : "items"} in your cart
        </strong>

        <span>
          Your campus meal is waiting
        </span>
      </div>
    </div>

    <Link
      to="/cart"
      className="menu-cart-popup-button"
    >
      Go to Cart
      <span>→</span>
    </Link>
  </div>
)}

    </main>
  );
}

export default Menu;