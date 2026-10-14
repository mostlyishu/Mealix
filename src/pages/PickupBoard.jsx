import { useEffect, useState } from "react";
import API_URL from "../config/api";
import "./PickupBoard.css";
import CookingMotion from "../components/CookingMotion";


function PickupBoard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const [isFullscreen, setIsFullscreen] = useState(false);

useEffect(() => {
  const updateFullscreen = () => {
    setIsFullscreen(Boolean(document.fullscreenElement));
  };

  document.addEventListener("fullscreenchange", updateFullscreen);

  return () => {
    document.removeEventListener(
      "fullscreenchange",
      updateFullscreen
    );
  };
}, []);

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
    await document.querySelector(".pickup-board").requestFullscreen();    }
  } catch (err) {
    console.error("Fullscreen unavailable:", err);
  }
}

  useEffect(() => {
    let active = true;
    let fetching = false;

    async function fetchPickupBoard() {
      if (fetching) return;
      fetching = true;

      try {
        const response = await fetch(
          `${API_URL}/api/pickup-board`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error("Unable to update pickup board");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Invalid pickup board response");
        }

        if (active) {
          setOrders(data);
          setError("");
          setLastUpdated(new Date());
        }
      } catch (err) {
        if (active) {
          setError(err.message);
        }
      } finally {
        fetching = false;
        if (active) setLoading(false);
      }
    }

    fetchPickupBoard();

    const interval = setInterval(fetchPickupBoard, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const preparing = orders.filter(
    (order) => order.status === "Preparing"
  );

  const ready = orders.filter(
    (order) => order.status === "Ready"
  );

  return (
    <main className="pickup-board">
      <header className="pickup-header">
        <div>
          <span className="pickup-eyebrow">
            MEALIX / CAMPUS CANTEEN
          </span>

          <h1>
            Your order, <em>on the move.</em>
          </h1>

          <p>
            Keep an eye on your token.
            We'll let you know when it's ready.
          </p>
        </div>

        <div className="pickup-header-actions">
  <div className="pickup-live-badge">
    <span className="pickup-live-dot" />
    LIVE UPDATES
  </div>

  <button
    type="button"
    className="pickup-fullscreen-btn"
    onClick={toggleFullscreen}
    title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
  >
    <span aria-hidden="true">
      {isFullscreen ? "⊟" : "⛶"}
    </span>
    {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
  </button>
</div>
      </header>

      {error && (
        <div className="pickup-error" role="alert">
          Connection interrupted. Showing the latest
          available information.
        </div>
      )}

      <div className="pickup-columns">
        <section className="pickup-panel pickup-preparing">
          <div className="pickup-panel-heading">
            <div>
              <span className="pickup-panel-label">
                IN THE KITCHEN
              </span>
              <h2>Now Preparing</h2>
              <p>Your food is being freshly prepared.</p>
            </div>

            <span className="pickup-count">
              {preparing.length}
            </span>
          </div>

          <div className="pickup-token-grid">
            {preparing.map((order) => (
              <div
                className="pickup-token"
                key={order.pickup_token}
              >
                {order.pickup_token}
              </div>
            ))}

            {!loading && preparing.length === 0 && (
              <div className="pickup-empty">
                No orders being prepared right now.
              </div>
            )}
          </div>
        </section>

        <section className="pickup-panel pickup-ready">
          <div className="pickup-panel-heading">
            <div>
              <span className="pickup-panel-label">
                TIME TO COLLECT
              </span>
              <h2>Ready for Pickup</h2>
              <p>Your delicious order is waiting!</p>
            </div>

            <span className="pickup-count">
              {ready.length}
            </span>
          </div>

          <div className="pickup-token-grid">
            {ready.map((order) => (
              <div
                className="pickup-token"
                key={order.pickup_token}
              >
                {order.pickup_token}
              </div>
            ))}

            {!loading && ready.length === 0 && (
              <div className="pickup-empty">
                Ready orders will appear here.
              </div>
            )}
          </div>
        </section>
      </div>

{/* Animated Mealix Kitchen Experience */}

    <CookingMotion />
      <footer className="pickup-footer">
        <span>
          {loading
            ? "Connecting to kitchen..."
            : error
            ? "Updates temporarily unavailable"
            : "Automatically refreshing every 5 seconds"}
        </span>

        <span>
          {lastUpdated
            ? `Last updated ${lastUpdated.toLocaleTimeString()}`
            : "Waiting for first update"}
        </span>
      </footer>
    </main>
  );
}

export default PickupBoard;