
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import FoodCard from "../components/FoodCard";
import { useCart } from "../context/CartContext";
import API_URL from "../config/api";

const FAVORITES_KEY = "mealix_favorites";

function readFavorites() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(FAVORITES_KEY) || "[]"
    );

    return Array.isArray(saved) ? saved.map(String) : [];
  } catch {
    return [];
  }
}

function Favourites() {
  const { cart, addToCart, increaseQuantity, decreaseQuantity } =
    useCart();

  const [foods, setFoods] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(readFavorites);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadFoods() {
      try {
        const response = await fetch(`${API_URL}/api/foods`);

        if (!response.ok) {
          throw new Error("Couldn't load your saved dishes.");
        }

        const data = await response.json();

        if (active) setFoods(data);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadFoods();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function syncFavorites() {
      setFavoriteIds(readFavorites());
    }

    window.addEventListener(
      "mealix-favorites-updated",
      syncFavorites
    );

    window.addEventListener("storage", syncFavorites);

    return () => {
      window.removeEventListener(
        "mealix-favorites-updated",
        syncFavorites
      );
      window.removeEventListener("storage", syncFavorites);
    };
  }, []);

  const favoriteFoods = foods.filter((food) =>
    favoriteIds.includes(String(food.id))
  );

  return (
    <main className="favorites-page">
      <Link to="/menu" className="favorites-back-link">
        <ArrowLeft size={16} />
        Back to menu
      </Link>

      <motion.header
        className="favorites-header"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <span className="favorites-eyebrow">
          YOUR PERSONAL COLLECTION
        </span>

        <div className="favorites-title-row">
          <span className="favorites-title-icon">
            <Heart size={25} strokeWidth={1.7} />
          </span>

          <h1>My Favourites</h1>

          <span className="favorites-count">
            {favoriteIds.length}
          </span>
        </div>

        <p>
          Your go-to campus dishes, all in one place.
        </p>
      </motion.header>

      {loading ? (
        <div className="favorites-state">
          <span className="favorites-loader" />
          <p>Finding your favourite dishes...</p>
        </div>
      ) : error ? (
        <div className="favorites-state">
          <h2>Couldn't load your favourites</h2>
          <p>{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      ) : favoriteFoods.length === 0 ? (
        <motion.section
          className="favorites-empty"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <motion.div
            className="favorites-empty-icon"
            animate={{ y: [0, -5, 0] }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Heart size={34} strokeWidth={1.4} />
          </motion.div>

          <h2>Save the food you love.</h2>

          <p>
            Tap the heart on any dish to keep it here for
            your next campus craving.
          </p>

          <Link to="/menu" className="favorites-browse-button">
            Explore Menu <span>→</span>
          </Link>
        </motion.section>
      ) : (
        <>
          <div className="favorites-results-heading">
            <p>
              <strong>{favoriteFoods.length}</strong>{" "}
              {favoriteFoods.length === 1 ? "dish" : "dishes"} saved
            </p>
          </div>

          <section className="food-grid">
            {favoriteFoods.map((food) => {
              const cartItem = cart.find(
                (item) => String(item.id) === String(food.id)
              );

              return (
                <FoodCard
                  key={food.id}
                  id={food.id}
                  name={food.name}
                  price={food.price}
                  category={food.category}
                  description={food.description}
                  available={Number(food.available) === 1}
                  imageUrl={food.image_url}
                  quantity={cartItem?.quantity || 0}
                  onAdd={() => addToCart(food)}
                  onIncrease={increaseQuantity}
                  onDecrease={decreaseQuantity}
                />
              );
            })}
          </section>
        </>
      )}
    </main>
  );
}

export default Favourites;
