import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API_URL from "../config/api";
import BreakSync from "../components/BreakSync";
import { useAuth } from "../context/AuthContext";

function Home() {
    const { isLoggedIn, user } = useAuth();
    const isStudent = isLoggedIn && user?.role === "student";
    const [popularFoods, setPopularFoods] = useState([]);
const heroPhrases = [
  "Better breaks.",
  "Faster bites.",
  "Happier cravings.",
  "Smarter dining."
];

const [heroSlide, setHeroSlide] = useState({
  current: 0,
  previous: null,
  sequence: 0,
});

useEffect(() => {
  const timer = setInterval(() => {
    setHeroSlide((slide) => ({
      current: (slide.current + 1) % heroPhrases.length,
      previous: slide.current,
      sequence: slide.sequence + 1,
    }));
  }, 2500);

  return () => clearInterval(timer);
}, []);

useEffect(() => {
  async function fetchPopularFoods() {
    try {
      const response = await fetch(
        `${API_URL}/api/foods`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error("Failed to fetch foods");
      }

      const availableFoods = data
        .filter((food) => Number(food.available) === 1)
        .slice(0, 4);

      setPopularFoods(availableFoods);
    } catch (error) {
      console.error("Home foods error:", error);
    }
  }

  fetchPopularFoods();
}, []);

function getFoodEmoji(name) {
  const foodName = name.toLowerCase();

  if (foodName.includes("burger")) return "🍔";
  if (foodName.includes("sandwich")) return "🥪";
  if (foodName.includes("coffee")) return "🥤";
  if (foodName.includes("maggi")) return "🍜";

  return "🍽️";
}

  return (
    <main className="home-page">

      {/* =========================
          HERO
      ========================= */}

      <section className="home-hero">
        <div className="home-hero-content">
                  <span className="home-eyebrow">
                      A BETTER WAY TO EAT ON CAMPUS
                  </span>

          <h1>
            Good food.

            <span className="home-rotating-line">
              {heroSlide.previous !== null && (
                <span
                  key={`exit-${heroSlide.sequence}`}
                  className="home-phrase home-phrase-exit"
                  aria-hidden="true"
                >
                  {heroPhrases[heroSlide.previous]}
                </span>
              )}

              <span
                key={`enter-${heroSlide.sequence}`}
                className={`home-phrase ${heroSlide.previous !== null ? "home-phrase-enter" : ""
                  }`}
              >
                {heroPhrases[heroSlide.current]}
              </span>
            </span>
          </h1>
                  <p className="home-hero-description">
                      Your campus favourites, freshly prepared and
                      just a few taps away. Skip the queue, savour
                      the moment.
                  </p>

          <div className="home-hero-actions">
            <Link
              to="/menu"
              className="home-primary-button"
            >
              Order Now
              <span>→</span>
            </Link>

                      <Link
                          to="/orders"
                          className="home-secondary-button"
                      >
                          Track Order
                      </Link>
          </div>
        </div>

        <div className="home-hero-visual">
          <div className="hero-food-circle">
            <span className="hero-food-emoji">🍔</span>
          </div>

          <div className="hero-floating-card hero-card-top">
            <span>★</span>

            <div>
              <strong>Campus Favourite</strong>
              <small>Fresh & delicious</small>
            </div>
          </div>

          <div className="hero-floating-card hero-card-bottom">
            <span>⚡</span>

            <div>
              <strong>Quick Ordering</strong>
              <small>Skip the queue</small>
            </div>
          </div>
        </div>
      </section>
      
      {/* =========================
          BREAKSYNC
      ========================= */}

      <BreakSync />
      {/* =========================
    GROUPBITE FEATURE
========================= */}

{!isLoggedIn || isStudent ? (
  <section className="home-groupbite">
    <div className="home-groupbite-content">
      <div className="home-groupbite-tag">
        <span className="home-groupbite-tag-dot" />
        INTRODUCING GROUPBITE
      </div>

                      <h2>
                          One Squad. One Cart.
                          <span> Endless Cravings.</span>
                      </h2>

      <p>
        Ordering with friends? Create a group, share
        your invite code, and let everyone add their
        favourite food to one shared cart.
      </p>

      <div className="home-groupbite-features">
        <div>
          <span>✓</span>
          Shared cart
        </div>

        <div>
          <span>✓</span>
          One combined order
        </div>

        <div>
          <span>✓</span>
          One pickup token
        </div>
      </div>

      <Link
        to={isStudent ? "/groupbite" : "/login"}
        className="home-groupbite-button"
      >
        {isStudent ? "Start Group Order" : "Login to Start"}
        <span>→</span>
      </Link>
    </div>

    <div className="home-groupbite-visual">
      <div className="home-groupbite-demo">
        <div className="home-groupbite-demo-top">
          <span>GROUP ORDER</span>
          <span className="home-groupbite-demo-status">
            ● OPEN
          </span>
        </div>

        <div className="home-groupbite-demo-code">
          <small>INVITE YOUR FRIENDS</small>
          <strong>AB7K2Q</strong>
          <span>Example group code</span>
        </div>

        <div className="home-groupbite-demo-members">
          <div className="home-groupbite-avatars">
            <span>A</span>
            <span>R</span>
            <span>S</span>
          </div>

          <p>Everyone adds their favourites</p>
        </div>

        <div className="home-groupbite-demo-order">
          <div>
            <span>🍔</span>
            <div>
              <strong>Paneer Tikka Burger</strong>
              <small>Added by A</small>
            </div>
          </div>

          <span>× 2</span>
        </div>

        <div className="home-groupbite-demo-order">
          <div>
            <span>🥤</span>
            <div>
              <strong>Cold Coffee</strong>
              <small>Added by R</small>
            </div>
          </div>

          <span>× 1</span>
        </div>

        <div className="home-groupbite-demo-footer">
          <span>One cart. One checkout.</span>
          <span>↗</span>
        </div>
      </div>

      <div className="home-groupbite-floating">
        <span>✦</span>
        Group ordering, simplified
      </div>
    </div>
  </section>
) : null}

      {/* =========================
          BENEFITS
      ========================= */}

      <section className="home-benefits">
        <div className="benefit-item">
          <div className="benefit-icon">⚡</div>

          <div>
            <strong>Quick Ordering</strong>
            <p>Order your meal in seconds.</p>
          </div>
        </div>

        <div className="benefit-divider"></div>

        <div className="benefit-item">
          <div className="benefit-icon">✓</div>

          <div>
            <strong>Fresh & Hygienic</strong>
            <p>Prepared fresh on campus.</p>
          </div>
        </div>

        <div className="benefit-divider"></div>

        <div className="benefit-item">
          <div className="benefit-icon">₹</div>

          <div>
            <strong>Student Friendly</strong>
            <p>Affordable campus meals.</p>
          </div>
        </div>
      </section>


      {/* =========================
          POPULAR FOODS
      ========================= */}

      <section className="home-popular">
        <div className="home-section-header">
          <div>
            <span className="section-eyebrow">
              CAMPUS FAVOURITES
            </span>

            <h2>Popular on Campus</h2>

            <p>
              Quick picks students keep coming back for.
            </p>
          </div>

          <Link to="/menu" className="view-menu-link">
            View Full Menu
            <span>→</span>
          </Link>
        </div>

              <div className="home-food-preview-grid">
                  {popularFoods.map((food) => (
                      <div
                          className="home-food-preview"
                          key={food.id}
                      >
                          <div className="home-food-preview-image">
                              {food.image_url ? (
                                  <>
                                      <img
                                          src={food.image_url}
                                          alt={food.name}
                                          className="home-food-real-image"
                                          onError={(event) => {
                                              event.currentTarget.style.display = "none";
                                              event.currentTarget
                                                  .nextElementSibling
                                                  ?.classList.remove("hidden");
                                          }}
                                      />

                                      <span className="home-food-fallback hidden">
                                          {getFoodEmoji(food.name)}
                                      </span>
                                  </>
                              ) : (
                                  <span className="home-food-fallback">
                                      {getFoodEmoji(food.name)}
                                  </span>
                              )}
                          </div>

                          <div className="home-food-preview-content">
                              <span>{food.category}</span>

                              <h3>{food.name}</h3>

                              <strong>
                                  ₹{Number(food.price).toFixed(0)}
                              </strong>
                          </div>
                      </div>
                  ))}
              </div>
      </section>


      {/* =========================
          MEALIX EXPERIENCE
      ========================= */}

      <section className="home-experience">
        <div className="experience-content">
          <span className="section-eyebrow">
            MORE THAN JUST FOOD
          </span>

          <h2>Your campus meal, without the wait.</h2>

          <p>
            Mealix brings ordering, pickup tracking and
            campus food discovery together in one simple
            experience.
          </p>

          <Link
            to="/menu"
            className="experience-link"
          >
            Start your order
            <span>→</span>
          </Link>
        </div>

        <div className="experience-stats">
          <div>
            <strong>Fast</strong>
            <span>Ordering</span>
          </div>

          <div>
            <strong>Live</strong>
            <span>Tracking</span>
          </div>

          <div>
            <strong>Easy</strong>
            <span>Pickup</span>
          </div>
        </div>
      </section>


      {/* =========================
          FINAL CTA
      ========================= */}

      <section className="home-final-cta">
        <div>
          <span>READY WHEN YOU ARE</span>

          <h2>Hungry? Your next meal is a few clicks away.</h2>
        </div>

        <Link to="/menu" className="home-cta-button">
          Explore Menu
          <span>→</span>
        </Link>
      </section>

    </main>
  );
}

export default Home;