import { Link } from "react-router-dom";

function Home() {
  return (
    <main className="home-page">

      {/* =========================
          HERO
      ========================= */}

      <section className="home-hero">
        <div className="home-hero-content">
          <span className="home-eyebrow">
            GOOD FOOD, BRIGHTER DAYS.
          </span>

          <h1>
            Fresh Meals
            <span>Made for Campus Life.</span>
          </h1>

          <p className="home-hero-description">
            Delicious, affordable and convenient food,
            right here on campus. Order ahead, skip the
            queue and enjoy your meal.
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

          <div className="home-food-preview">
            <div className="home-food-preview-image">
              🍔
            </div>

            <div className="home-food-preview-content">
              <span>Burger</span>
              <h3>Paneer Tikka Burger</h3>
              <strong>₹60</strong>
            </div>
          </div>

          <div className="home-food-preview">
            <div className="home-food-preview-image">
              🥪
            </div>

            <div className="home-food-preview-content">
              <span>Sandwich</span>
              <h3>Veg Sandwich</h3>
              <strong>₹50</strong>
            </div>
          </div>

          <div className="home-food-preview">
            <div className="home-food-preview-image">
              🥤
            </div>

            <div className="home-food-preview-content">
              <span>Beverage</span>
              <h3>Cold Coffee</h3>
              <strong>₹70</strong>
            </div>
          </div>

          <div className="home-food-preview">
            <div className="home-food-preview-image">
              🍜
            </div>

            <div className="home-food-preview-content">
              <span>Snacks</span>
              <h3>Masala Maggi</h3>
              <strong>₹50</strong>
            </div>
          </div>

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