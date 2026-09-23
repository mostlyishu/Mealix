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
        throw new Error(
          "Failed to fetch admin stats"
        );
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
      setLoading(true);

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
        throw new Error(
          "Access denied. Admins only."
        );
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

  async function updateStatus(
    orderId,
    newStatus
  ) {
    try {
      setError("");

      const token =
        localStorage.getItem("token");

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

      await fetchStats();
    } catch (error) {
      setError(error.message);
    }
  }

  // =========================
  // REFRESH DASHBOARD
  // =========================

  async function refreshDashboard() {
    setError("");

    await Promise.all([
      fetchOrders(),
      fetchStats()
    ]);
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
          customer_email:
            item.customer_email,
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

  const orderList = Object.values(
    groupedOrders
  ).sort(
    (a, b) =>
      new Date(b.created_at) -
      new Date(a.created_at)
  );

  const totalActiveOrders = stats
    ? Number(stats.pending_orders) +
      Number(stats.preparing_orders) +
      Number(stats.ready_orders)
    : 0;

  return (
    <main className="admin-dashboard-v2">

      {/* =========================
          PAGE HEADER
          ========================= */}

      <section className="admin-v2-header">
        <div>
          <span className="admin-v2-eyebrow">
            CANTEEN OPERATIONS
          </span>

          <h1>Admin Dashboard</h1>

          <p>
            Monitor incoming orders, manage kitchen
            progress and keep campus service moving.
          </p>
        </div>

        <button
          className="admin-v2-refresh"
          onClick={refreshDashboard}
          disabled={loading}
        >
          <span>↻</span>

          {loading
            ? "Refreshing..."
            : "Refresh Dashboard"}
        </button>
      </section>

      {/* =========================
          STATISTICS
          ========================= */}

      {stats && (
        <section className="admin-v2-overview">

          <div className="admin-v2-section-heading">
            <div>
              <h2>Today at a glance</h2>

              <p>
                Live overview of Mealix canteen
                activity.
              </p>
            </div>

            <span className="admin-active-summary">
              {totalActiveOrders} active orders
            </span>
          </div>

          <div className="admin-v2-stats-grid">

            <article className="admin-v2-stat-card">
              <div className="admin-stat-icon">
                #
              </div>

              <div>
                <span>Total Orders</span>

                <strong>
                  {stats.total_orders}
                </strong>

                <small>
                  All recorded orders
                </small>
              </div>
            </article>

            <article className="admin-v2-stat-card pending">
              <div className="admin-stat-icon">
                ◷
              </div>

              <div>
                <span>Pending</span>

                <strong>
                  {stats.pending_orders}
                </strong>

                <small>
                  Waiting for kitchen
                </small>
              </div>
            </article>

            <article className="admin-v2-stat-card preparing">
              <div className="admin-stat-icon">
                ◌
              </div>

              <div>
                <span>Preparing</span>

                <strong>
                  {stats.preparing_orders}
                </strong>

                <small>
                  Currently cooking
                </small>
              </div>
            </article>

            <article className="admin-v2-stat-card ready">
              <div className="admin-stat-icon">
                ✓
              </div>

              <div>
                <span>Ready</span>

                <strong>
                  {stats.ready_orders}
                </strong>

                <small>
                  Waiting for pickup
                </small>
              </div>
            </article>

            <article className="admin-v2-stat-card completed">
              <div className="admin-stat-icon">
                ✓
              </div>

              <div>
                <span>Completed</span>

                <strong>
                  {stats.completed_orders}
                </strong>

                <small>
                  Successfully collected
                </small>
              </div>
            </article>

            <article className="admin-v2-stat-card revenue">
              <div className="admin-stat-icon">
                ₹
              </div>

              <div>
                <span>Completed Revenue</span>

                <strong>
                  ₹
                  {Number(
                    stats.total_revenue
                  ).toFixed(0)}
                </strong>

                <small>
                  From completed orders
                </small>
              </div>
            </article>

          </div>
        </section>
      )}

      {/* =========================
          ORDERS
          ========================= */}

      <section className="admin-v2-orders">

        <div className="admin-v2-section-heading">
          <div>
            <h2>Recent Orders</h2>

            <p>
              Review orders and update their kitchen
              status.
            </p>
          </div>

          {!loading && (
            <span className="admin-order-count">
              {orderList.length} orders
            </span>
          )}
        </div>

        {error && (
          <div className="admin-v2-error">
            <span>!</span>
            <p>{error}</p>
          </div>
        )}

        {loading && (
          <div className="admin-v2-loading">
            <div className="admin-v2-loader"></div>

            <h3>Loading canteen orders...</h3>

            <p>
              Getting the latest Mealix activity.
            </p>
          </div>
        )}

        {!loading &&
          !error &&
          orderList.length === 0 && (
            <div className="admin-v2-empty">
              <div>🧾</div>

              <h3>No orders yet</h3>

              <p>
                New campus orders will appear here
                automatically.
              </p>
            </div>
          )}

        {!loading && !error && (
          <div className="admin-v2-orders-list">
            {orderList.map((order) => {
              const totalItems =
                order.items.reduce(
                  (sum, item) =>
                    sum +
                    Number(item.quantity),
                  0
                );

              return (
                <article
                  className="admin-v2-order-card"
                  key={order.order_id}
                >
                  {/* Order heading */}

                  <div className="admin-order-top">
                    <div>
                      <span className="admin-order-label">
                        MEALIX ORDER
                      </span>

                      <h3>
                        Order #{order.order_id}
                      </h3>

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

                  {/* Customer */}

                  <div className="admin-customer-block">
                    <div className="admin-customer-avatar">
                      {order.customer_name
                        ?.charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <span>Customer</span>

                      <strong>
                        {order.customer_name}
                      </strong>

                      <small>
                        {order.customer_email}
                      </small>
                    </div>
                  </div>

                  {/* Items */}

                  <div className="admin-order-items-v2">
                    <div className="admin-items-heading">
                      <span>ORDER ITEMS</span>

                      <small>
                        {totalItems}{" "}
                        {totalItems === 1
                          ? "item"
                          : "items"}
                      </small>
                    </div>

                    {order.items.map(
                      (item, index) => (
                        <div
                          className="admin-order-item-row"
                          key={index}
                        >
                          <span>
                            {item.food_name}
                          </span>

                          <strong>
                            ×{item.quantity}
                          </strong>
                        </div>
                      )
                    )}
                  </div>

                  {/* Total */}

                  <div className="admin-order-total-v2">
                    <span>Order Total</span>

                    <strong>
                      ₹
                      {Number(
                        order.total_amount
                      ).toFixed(0)}
                    </strong>
                  </div>

                  {/* Status */}

                  <div className="admin-status-control-v2">
                    <div>
                      <span>ORDER STATUS</span>

                      <small>
                        Update kitchen progress
                      </small>
                    </div>

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
              );
            })}
          </div>
        )}

      </section>
    </main>
  );
}

export default AdminOrders;