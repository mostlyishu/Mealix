import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import FoodCard from "../components/FoodCard";
import { useCart } from "../context/CartContext";
import API_URL from "../config/api";

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
    const [recommendationBudget, setRecommendationBudget] =
        useState(100);
    const [recommendations, setRecommendations] =
        useState([]);
    const [recommendationLoading, setRecommendationLoading] =
        useState(false);
    const [recommendationError, setRecommendationError] =
        useState("");
    const [showRecommendations, setShowRecommendations] =
        useState(false);
    const [mealPreference, setMealPreference] =
        useState("popular");
        const recommendationResultsRef = useRef(null);
        // BREAKSYNC STATE
const [breakMinutes, setBreakMinutes] = useState(10);
const [breakResults, setBreakResults] = useState([]);
const [breakLoading, setBreakLoading] = useState(false);
const [breakError, setBreakError] = useState("");
const [breakSearched, setBreakSearched] = useState(false);
const [breakSearchMinutes, setBreakSearchMinutes] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/foods`)
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
  async function findMeal() {
  try {
    setRecommendationLoading(true);
    setRecommendationError("");
    setRecommendations([]);
    setShowRecommendations(true);

      const response = await fetch(
          `${API_URL}/api/recommendations?maxPrice=${recommendationBudget}&preference=${mealPreference}`
      );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to find meal recommendations"
      );
    }

setRecommendations(
  Array.isArray(data.recommendations)
    ? data.recommendations
    : []
);
  } catch (error) {
    setRecommendations([]);
    setRecommendationError(error.message);
  } finally {
    setRecommendationLoading(false);
  }
}
function getRecommendationReason(food) {
  if (mealPreference === "popular") {
    if (Number(food.popularity) > 0) {
      return "Popular with students";
    }

    return "Available within your budget";
  }

  if (mealPreference === "quick") {
    return "Great for a quick campus bite";
  }

  if (mealPreference === "filling") {
    return "A filling meal within your budget";
  }

  if (mealPreference === "beverage") {
    return "A refreshing pick within your budget";
  }

  return "Recommended for you";
}
async function findBreakMeals() {
  try {
    setBreakLoading(true);
    setBreakError("");
    setBreakResults([]);
    setBreakSearched(true);
    setBreakSearchMinutes(breakMinutes);

    const response = await fetch(
      `${API_URL}/api/breaksync?minutes=${breakMinutes}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to find break-friendly meals"
      );
    }

    setBreakResults(data.recommendations || []);
  } catch (error) {
    setBreakError(error.message);
  } finally {
    setBreakLoading(false);
  }
}

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


{/* BREAKSYNC */}
<section className="breaksync">
  <div className="breaksync-header">
    <span className="breaksync-eyebrow">
      ⚡ MEALIX BREAKSYNC
    </span>

    <h2>Got a class coming up?</h2>

    <p>
      Tell us how much break time you have.
      We'll find meals that may be ready before your next lecture.
    </p>
  </div>

  <div className="breaksync-controls">
    <span className="meal-control-label">
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
      onClick={findBreakMeals}
      disabled={breakLoading}
    >
      {breakLoading
        ? "Checking kitchen queue..."
        : "Find Meals for My Break →"}
    </button>
  </div>

  {breakSearched && (
    <div className="breaksync-results">
      {breakLoading && (
        <p className="breaksync-message">
          Finding meals that fit your break...
        </p>
      )}

      {!breakLoading && breakError && (
        <p className="breaksync-error" role="alert">
          {breakError}
        </p>
      )}

      {!breakLoading &&
        !breakError &&
        breakResults.length === 0 && (
          <div className="breaksync-empty">
            <strong>No suitable meals right now</strong>
            <p>
              The kitchen may be busy. Try selecting a
              longer break.
            </p>
          </div>
        )}

      {!breakLoading &&
        !breakError &&
        breakResults.length > 0 && (
          <>
            <div className="breaksync-results-heading">
              <div>
                <span>READY BEFORE CLASS</span>
                <h3>
                  Meals for your {breakSearchMinutes}-minute break
                </h3>
              </div>

              <small>
                Includes estimated kitchen wait and safety buffer
              </small>
            </div>

            <div className="breaksync-grid">
              {breakResults.map((food) => {
                const cartItem = cart.find(
                  (item) => Number(item.id) === Number(food.id)
                );

                const quantity = cartItem?.quantity || 0;

                return (
                  <article
                    className="breaksync-card"
                    key={food.id}
                  >
                    <div className="breaksync-image">
                      {food.image_url ? (
                        <img
                          src={food.image_url}
                          alt={food.name}
                        />
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
              Estimates are approximate and may change with
              kitchen workload. Pickup before class is not guaranteed.
            </p>
          </>
        )}
    </div>
  )}
</section>

{/* SMART MEAL RECOMMENDER */}

<section className="meal-recommender">
  <div className="meal-recommender-content">
    <span className="meal-recommender-eyebrow">
      ✦ SMART MEAL PICK
    </span>

    <h2>Can't decide what to eat?</h2>

    <p>
      Set your budget and let Mealix find popular
      campus picks that fit it.
    </p>
  </div>

  <div className="meal-recommender-controls">
    <div className="meal-preference-section">
  <span className="meal-control-label">
    WHAT ARE YOU LOOKING FOR?
  </span>

  <div className="meal-preference-options">
    {[
      {
        value: "quick",
        icon: "⚡",
        label: "Quick Bite"
      },
      {
        value: "filling",
        icon: "🍽️",
        label: "Filling"
      },
      {
        value: "beverage",
        icon: "🥤",
        label: "Beverage"
      },
      {
        value: "popular",
        icon: "🔥",
        label: "Popular"
      }
    ].map((option) => (
      <button
        type="button"
        key={option.value}
        className={
          mealPreference === option.value
            ? "meal-preference-button active"
            : "meal-preference-button"
        }
        onClick={() =>
          setMealPreference(option.value)
        }
      >
        <span>{option.icon}</span>
        {option.label}
      </button>
    ))}
  </div>
</div>

<span className="meal-control-label">
  YOUR BUDGET
</span>

    <div className="meal-budget-options">
      {[50, 75, 100, 150].map((budget) => (
        <button
          type="button"
          key={budget}
          className={
            recommendationBudget === budget
              ? "meal-budget-button active"
              : "meal-budget-button"
          }
          onClick={() =>
            setRecommendationBudget(budget)
          }
        >
          ₹{budget}
        </button>
      ))}
    </div>

    <button
      type="button"
      className="find-meal-button"
      onClick={findMeal}
      disabled={recommendationLoading}
    >
      {recommendationLoading
        ? "Finding your meal..."
        : "Find My Meal"}

      {!recommendationLoading && <span>→</span>}
    </button>
  </div>
</section>
{showRecommendations && (
  <section
    ref={recommendationResultsRef}
    className="meal-recommendation-results"
  >
        {recommendationLoading && (
      <p className="meal-recommendation-loading">
        Finding the best meals for your budget...
      </p>
    )}

    {recommendationError && (
      <div className="meal-recommendation-empty">
        <span>🍽️</span>

        <div>
          <strong>No meal found</strong>
          <p>{recommendationError}</p>
        </div>
      </div>
    )}
    {!recommendationLoading &&
  !recommendationError &&
  recommendations.length === 0 && (
    <div className="meal-recommendation-empty">
      <span>🍽️</span>
      <div>
        <strong>No matching meals found</strong>
        <p>
          Try increasing your budget or choosing another preference.
        </p>
      </div>
    </div>
)}

    {!recommendationLoading &&
      !recommendationError &&
      recommendations.length > 0 && (
        <>
          <div className="meal-recommendation-heading">
            <div>
              <span>MEALIX RECOMMENDS</span>

                                  <h3>
                                      {mealPreference === "popular"
                                          ? "Popular campus picks"
                                          : mealPreference === "quick"
                                              ? "Quick bites"
                                              : mealPreference === "filling"
                                                  ? "Filling meal picks"
                                                  : "Refreshing beverage picks"}
                                      {" "}under ₹{recommendationBudget}
                                  </h3>
            </div>

            <small>
              Ranked using campus order popularity
            </small>
          </div>

          <div className="meal-recommendation-grid">
            {recommendations
              .slice(0, 3)
              .map((food, index) => {
                const cartItem = cart.find(
                  (item) => item.id === food.id
                );

                const quantity =
                  cartItem?.quantity || 0;

                return (
                  <article
                    className="meal-recommendation-card"
                    key={food.id}
                  >
                    {index === 0 && (
                      <span className="best-pick-badge">
                        ★ BEST PICK
                      </span>
                    )}

                    <div className="meal-recommendation-image">
                      {food.image_url ? (
                        <img
                          src={food.image_url}
                          alt={food.name}
                        />
                      ) : (
                        <span>🍽️</span>
                      )}
                    </div>

                    <div className="meal-recommendation-info">
                      <span>{food.category}</span>

                      <h3>{food.name}</h3>

                      <div className="meal-recommendation-meta">
                        <strong>
                          ₹{Number(food.price).toFixed(0)}
                        </strong>

                        <span>
                          🔥 {Number(food.popularity)} ordered
                        </span>
                      </div>
                            <div className="meal-recommendation-reason">
                                <span>✓</span>
                                {getRecommendationReason(food)}
                            </div>

                      {quantity > 0 ? (
                        <div className="recommendation-quantity-control">
                          <button
                            type="button"
                            onClick={() =>
                              decreaseQuantity(food.id)
                            }
                          >
                            −
                          </button>

                          <span>{quantity}</span>

                          <button
                            type="button"
                            onClick={() =>
                              increaseQuantity(food.id)
                            }
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            addToCart(food)
                          }
                        >
                          + Add to Cart
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
          </div>
        </>
      )}
  </section>
)}

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