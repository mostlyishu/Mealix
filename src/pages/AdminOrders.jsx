import { useEffect, useState } from "react";

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, []);

  // =========================
  // FETCH DASHBOARD STATS
  // =========================

  async function fetchStats() {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5001/api/admin/stats",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch admin stats");
      }

      const data = await response.json();

      setStats(data);
    } catch (error) {
      setError(error.message);
    }
  }

  // =========================
  // FETCH ALL ORDERS
  // =========================

  async function fetchOrders() {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5001/api/admin/orders",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error("Access denied. Admins only.");
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
  // UPDATE ORDER STATUS
  // =========================

  async function updateStatus(orderId, newStatus) {
    try {
      setError("");

      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5001/api/admin/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            status: newStatus
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      // Update order status on screen
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.order_id === orderId
            ? {
                ...order,
                status: newStatus
              }
            : order
        )
      );

      // Refresh dashboard numbers
      await fetchStats();
    } catch (error) {
      setError(error.message);
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
          customer_name: item.customer_name,
          customer_email: item.customer_email,
          total_amount: item.total_amount,
          status: item.status,
          created_at: item.created_at,
          items: []
        };
      }

      groups[item.order_id].items.push({
        food_name: item.food_name,
        quantity: item.quantity
      });

      return groups;
    },
    {}
  );

  const orderList = Object.values(groupedOrders);

  return (
    <main className="admin-dashboard">
      <div className="admin-header">
        <div>
          <h1>Canteen Dashboard</h1>
          <p>
            Manage Mealix orders and track canteen activity.
          </p>
        </div>
      </div>

      {/* Dashboard statistics */}

      {stats && (
        <section className="dashboard-overview">
          <h2>Dashboard Overview</h2>

          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Orders</h3>
              <p>{stats.total_orders}</p>
            </div>

            <div className="stat-card">
              <h3>Pending</h3>
              <p>{stats.pending_orders}</p>
            </div>

            <div className="stat-card">
              <h3>Preparing</h3>
              <p>{stats.preparing_orders}</p>
            </div>

            <div className="stat-card">
              <h3>Ready</h3>
              <p>{stats.ready_orders}</p>
            </div>

            <div className="stat-card">
              <h3>Completed</h3>
              <p>{stats.completed_orders}</p>
            </div>

            <div className="stat-card">
              <h3>Total Revenue</h3>
              <p>₹{Number(stats.total_revenue).toFixed(2)}</p>
            </div>
          </div>
        </section>
      )}

      {/* Orders */}

      <section className="admin-orders-section">
        <div className="section-header">
          <h2>Recent Orders</h2>

          <button
            className="refresh-button"
            onClick={() => {
              fetchOrders();
              fetchStats();
            }}
          >
            Refresh
          </button>
        </div>

        {loading && <p>Loading orders...</p>}

        {error && (
          <p className="admin-error">
            {error}
          </p>
        )}

        {!loading &&
          !error &&
          orderList.length === 0 && (
            <p>No orders yet.</p>
          )}

        <div className="admin-orders-list">
          {orderList.map((order) => (
            <article
              className="admin-order-card"
              key={order.order_id}
            >
              <div className="order-card-header">
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

              <div className="customer-details">
                <p>
                  <strong>Customer:</strong>{" "}
                  {order.customer_name}
                </p>

                <p>
                  <strong>Email:</strong>{" "}
                  {order.customer_email}
                </p>
              </div>

              <div className="order-items">
                <h3>Items</h3>

                {order.items.map(
                  (item, index) => (
                    <p key={index}>
                      {item.food_name} ×{" "}
                      {item.quantity}
                    </p>
                  )
                )}
              </div>

              <div className="order-total">
                <strong>Total</strong>
                <strong>
                  ₹{Number(
                    order.total_amount
                  ).toFixed(2)}
                </strong>
              </div>

              <div className="status-control">
                <label
                  htmlFor={`status-${order.order_id}`}
                >
                  Update Status
                </label>

                <select
                  id={`status-${order.order_id}`}
                  value={order.status}
                  onChange={(event) =>
                    updateStatus(
                      order.order_id,
                      event.target.value
                    )
                  }
                >
                  <option value="Pending">
                    Pending
                  </option>

                  <option value="Preparing">
                    Preparing
                  </option>

                  <option value="Ready">
                    Ready
                  </option>

                  <option value="Completed">
                    Completed
                  </option>
                </select>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default AdminOrders;