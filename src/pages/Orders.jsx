import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5001/api/orders",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();

      setOrders(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // GROUP ORDER ITEMS
  // =========================

  const groupedOrders = orders.reduce(
    (groups, item) => {
      if (!groups[item.order_id]) {
        groups[item.order_id] = {
          order_id: item.order_id,
          pickup_token: item.pickup_token,
          total_amount: item.total_amount,
          status: item.status,
          created_at: item.created_at,
          orders_ahead: item.orders_ahead,
          estimated_pickup: item.estimated_pickup,
          items: []
        };
      }

      groups[item.order_id].items.push({
        food_name: item.food_name,
        price: item.price,
        quantity: item.quantity
      });

      return groups;
    },
    {}
  );

  const orderList = Object.values(groupedOrders).sort(
    (a, b) =>
      new Date(b.created_at) - new Date(a.created_at)
  );

  // =========================
  // ORDER STATUS
  // =========================

  const statusSteps = [
    "Pending",
    "Preparing",
    "Ready",
    "Completed"
  ];

  function getStatusIndex(status) {
    return statusSteps.indexOf(status);
  }

  return (
    <main className="orders-page">

      {/* PAGE HEADER */}

      <section className="orders-header">
        <div>
          <span className="orders-eyebrow">
            ORDER TRACKING
          </span>

          <h1>My Orders</h1>

          <p>
            Follow your Mealix orders from the kitchen
            to pickup.
          </p>
        </div>

        <button
          className="orders-refresh-button"
          onClick={fetchOrders}
          disabled={loading}
        >
          <span>↻</span>
          {loading ? "Refreshing..." : "Refresh Orders"}
        </button>
      </section>

      {/* ERROR */}

      {error && (
        <div className="orders-error">
          <span>!</span>
          <p>{error}</p>
        </div>
      )}

      {/* LOADING */}

      {loading && (
        <div className="orders-loading">
          <div className="orders-loader"></div>

          <h3>Loading your orders...</h3>

          <p>
            Checking the latest status from the canteen.
          </p>
        </div>
      )}

      {/* EMPTY */}

      {!loading &&
        !error &&
        orderList.length === 0 && (
          <section className="no-orders">
            <div className="no-orders-icon">
              🧾
            </div>

            <span>NO ORDERS YET</span>

            <h2>Your Mealix journey starts with a meal.</h2>

            <p>
              Place your first campus order and track it
              here from preparation to pickup.
            </p>

            <button
              onClick={() => navigate("/menu")}
            >
              Explore Menu
              <span>→</span>
            </button>
          </section>
        )}

      {/* ORDERS */}

      {!loading && !error && (
        <section className="student-orders-list">
          {orderList.map((order) => {
            const currentStatusIndex =
              getStatusIndex(order.status);

            return (
              <article
                className="student-order-card"
                key={order.order_id}
              >

                {/* ORDER TOP */}

                <div className="student-order-header">
                  <div>
                    <span className="order-number-label">
                      MEALIX ORDER
                    </span>

                    <h2>
                      Order #{order.order_id}
                    </h2>

                    <p>
                      {new Date(
                        order.created_at
                      ).toLocaleString()}
                    </p>
                  </div>

                  <span
                    className={`order-status ${order.status.toLowerCase()}`}
                  >
                    {order.status}
                  </span>
                </div>

                {/* PICKUP INFORMATION */}

                <div className="order-info-grid">

                  {order.pickup_token && (
                    <div className="order-info-box pickup-info-box">
                      <span>Pickup Token</span>

                      <strong>
                        {order.pickup_token}
                      </strong>

                      <small>
                        Show this at the counter
                      </small>
                    </div>
                  )}

                  <div className="order-info-box">
                    <span>Estimated Pickup</span>

                    <strong>
                      {order.estimated_pickup ||
                        "Updating..."}
                    </strong>

                    <small>
                      Based on the current queue
                    </small>
                  </div>

                  {order.status === "Pending" && (
                    <div className="order-info-box">
                      <span>Orders Ahead</span>

                      <strong>
                        {order.orders_ahead ?? 0}
                      </strong>

                      <small>
                        Before your order
                      </small>
                    </div>
                  )}

                </div>

                {/* STATUS TRACKER */}

                <div className="order-tracking-section">
                  <div className="tracking-heading">
                    <h3>Order Progress</h3>

                    <span>
                      {order.status}
                    </span>
                  </div>

                  <div className="order-tracker">
                    {statusSteps.map(
                      (status, index) => {
                        const completed =
                          index < currentStatusIndex;

                        const active =
                          index === currentStatusIndex;

                        return (
                          <div
                            className="tracker-step"
                            key={status}
                          >
                            <div
                              className={`tracker-circle ${
                                completed
                                  ? "completed"
                                  : active
                                  ? "active"
                                  : ""
                              }`}
                            >
                              {completed
                                ? "✓"
                                : index + 1}
                            </div>

                            <span
                              className={
                                completed || active
                                  ? "tracker-label active"
                                  : "tracker-label"
                              }
                            >
                              {status}
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* ITEMS */}

                <div className="student-order-items">
                  <div className="order-items-heading">
                    <h3>Order Items</h3>

                    <span>
                      {order.items.reduce(
                        (sum, item) =>
                          sum +
                          Number(item.quantity),
                        0
                      )}{" "}
                      items
                    </span>
                  </div>

                  {order.items.map(
                    (item, index) => (
                      <div
                        className="student-order-item"
                        key={index}
                      >
                        <div>
                          <span className="order-item-quantity">
                            {item.quantity}×
                          </span>

                          <span>
                            {item.food_name}
                          </span>
                        </div>

                        <strong>
                          ₹
                          {(
                            Number(item.price) *
                            Number(item.quantity)
                          ).toFixed(0)}
                        </strong>
                      </div>
                    )
                  )}
                </div>

                {/* TOTAL */}

                <div className="student-order-total">
                  <span>Order Total</span>

                  <strong>
                    ₹
                    {Number(
                      order.total_amount
                    ).toFixed(0)}
                  </strong>
                </div>

              </article>
            );
          })}
        </section>
      )}

    </main>
  );
}

export default Orders;