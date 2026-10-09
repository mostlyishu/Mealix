
import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import API_URL from "../config/api";
import "./BreakSync.css";

function BreakSync() {
const {
  cart,
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  totalCartItems
} = useCart();

  const [breakMinutes, setBreakMinutes] = useState(10);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [searchedMinutes, setSearchedMinutes] = useState(null);

  async function findMeals() {
    try {
      setLoading(true);
      setError("");
      setResults([]);
      setSearched(true);
      setSearchedMinutes(breakMinutes);

      const response = await fetch(
        `${API_URL}/api/breaksync?minutes=${breakMinutes}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not find meals");
      }

      setResults(data.recommendations || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="breaksync">
      <div className="breaksync-header">
        <span className="breaksync-eyebrow">
          ⚡ MEALIX BREAKSYNC
        </span>

        <h2>Got a class coming up?</h2>

        <p>
          Tell us how much break time you have. We'll find meals
          that may be ready before your next lecture.
        </p>
      </div>

      <div className="breaksync-controls">
        <span className="breaksync-label">
          MY BREAK ENDS IN
        </span>

        <div className="breaksync-options">
          {[10, 15, 20, 30, 45].map((minutes) => (
            <button
              type="button"
              key={minutes}
              className={
                breakMinutes === minutes
                  ? "breaksync-time active"
                  : "breaksync-time"
              }
              onClick={() => setBreakMinutes(minutes)}
            >
              {minutes} min
            </button>
          ))}
        </div>

        <button
          type="button"
          className="breaksync-find-button"
          onClick={findMeals}
          disabled={loading}
        >
          {loading
            ? "Checking kitchen queue..."
            : "Find Meals for My Break →"}
        </button>
      </div>

      {searched && (
        <div className="breaksync-results">
          {loading && (
            <p className="breaksync-message">
              Finding meals that fit your break...
            </p>
          )}

          {!loading && error && (
            <p className="breaksync-error" role="alert">
              {error}
            </p>
          )}

          {!loading && !error && results.length === 0 && (
            <div className="breaksync-empty">
              <strong>No suitable meals right now</strong>
              <p>
                The kitchen may be busy. Try a longer break.
              </p>
            </div>
          )}

          {!loading && !error && results.length > 0 && (
            <>
              <div className="breaksync-results-heading">
                <div>
                  <span>READY BEFORE CLASS</span>
                  <h3>
                    Meals for your {searchedMinutes}-minute break
                  </h3>
                </div>

                <small>
                  Includes estimated kitchen wait and safety buffer
                </small>
              </div>

              <div className="breaksync-grid">
                {results.map((food) => {
                  const cartItem = cart.find(
                    (item) => Number(item.id) === Number(food.id)
                  );

                  const quantity = cartItem?.quantity || 0;

                  return (
                    <article className="breaksync-card" key={food.id}>
                      <div className="breaksync-image">
                        {food.image_url ? (
                          <img src={food.image_url} alt={food.name} />
                        ) : (
                          <span>🍽️</span>
                        )}
                      </div>

                      <div className="breaksync-card-info">
                        <span className="breaksync-category">
                          {food.category}
                        </span>

                        <h3>{food.name}</h3>

                        <div className="breaksync-estimate">
                          ⏱ Est. {food.estimated_minutes} min
                        </div>

                        <div className="breaksync-card-bottom">
                          <strong>
                            ₹{Number(food.price).toFixed(0)}
                          </strong>

                          {quantity > 0 ? (
                            <div className="breaksync-quantity">
                              <button
                                type="button"
                                onClick={() =>
                                  decreaseQuantity(food.id)
                                }
                                aria-label={`Remove one ${food.name}`}
                              >
                                −
                              </button>

                              <span>{quantity}</span>

                              <button
                                type="button"
                                onClick={() =>
                                  increaseQuantity(food.id)
                                }
                                aria-label={`Add one ${food.name}`}
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="breaksync-add-button"
                              onClick={() => addToCart(food)}
                            >
                              + Add
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <p className="breaksync-disclaimer">
                Estimates are approximate and may change with kitchen
                workload. Pickup before class is not guaranteed.
              </p>
            </>
          )}
        </div>
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

              <span>Your campus meal is waiting</span>
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
    </section>
  );
}

export default BreakSync;
