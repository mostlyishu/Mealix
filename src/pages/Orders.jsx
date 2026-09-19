import { useEffect, useState } from "react";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
  // ORDER STATUS STEPS
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
      <div className="orders-header">
        <div>
          <h1>My Orders</h1>

          <p>
            Track your Mealix orders and their current
            status.
          </p>
        </div>

        <button
          className="orders-refresh-button"
          onClick={fetchOrders}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {loading && <p>Loading orders...</p>}

      {error && (
        <p className="orders-error">
          {error}
        </p>
      )}

      {!loading &&
        !error &&
        orderList.length === 0 && (
          <div className="no-orders">
            <h2>No orders yet</h2>

            <p>
              Your Mealix orders will appear here after
              checkout.
            </p>
          </div>
        )}

      <div className="student-orders-list">
        {orderList.map((order) => {
          const currentStatusIndex =
            getStatusIndex(order.status);

          return (
            <article
              className="student-order-card"
              key={order.order_id}
            >
              <div className="student-order-header">
                <div>
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
                  {order.pickup_token && (
                      <div className="order-pickup-token">
                          <span>Pickup Token</span>
                          <strong>{order.pickup_token}</strong>
                      </div>
                  )}

                  <div className="estimated-pickup">
                      <span>Estimated Pickup</span>
                      <strong>
                          {order.estimated_pickup}
                      </strong>
                  </div>
                  {order.status === "Pending" && (
                      <div className="queue-info">
                          <span>Orders Ahead</span>
                          <strong>{order.orders_ahead}</strong>
                      </div>
                  )}

              {/* Order tracking */}

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

              {/* Items */}

              <div className="student-order-items">
                <h3>Items</h3>

                {order.items.map(
                  (item, index) => (
                    <div
                      className="student-order-item"
                      key={index}
                    >
                      <span>
                        {item.food_name} ×{" "}
                        {item.quantity}
                      </span>

                      <span>
                        ₹
                        {(
                          Number(item.price) *
                          Number(item.quantity)
                        ).toFixed(2)}
                      </span>
                    </div>
                  )
                )}
              </div>

              <div className="student-order-total">
                <span>Order Total</span>

                <strong>
                  ₹
                  {Number(
                    order.total_amount
                  ).toFixed(2)}
                </strong>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}

export default Orders;