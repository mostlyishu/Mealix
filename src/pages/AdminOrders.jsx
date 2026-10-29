import { useEffect, useState } from "react";
import API_URL from "../config/api";
import KitchenPulse from "../components/KitchenPulse";

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [pulseRefreshKey, setPulseRefreshKey] = useState(0);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [coupons, setCoupons] = useState([]);
const [couponsLoading, setCouponsLoading] = useState(false);
const [couponError, setCouponError] = useState("");
const [couponMessage, setCouponMessage] = useState("");
const [showCouponForm, setShowCouponForm] = useState(false);
const [savingCoupon, setSavingCoupon] = useState(false);
const [updatingCouponId, setUpdatingCouponId] = useState(null);
const [deletingCouponId, setDeletingCouponId] = useState(null);

const [couponForm, setCouponForm] = useState({
  code: "",
  discount_type: "percentage",
  discount_value: "",
  min_order_amount: "0",
  max_discount: "",
  usage_limit: "",
  expires_at: "",
});

useEffect(() => {
  fetchOrders();
  fetchStats();
  fetchCoupons();
}, []);

// =========================
// FETCH ALL ORDERS
// =========================

async function fetchOrders() {
  try {
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");

    const response = await fetch(
      `${API_URL}/api/admin/orders`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to fetch admin orders"
      );
    }

    setOrders(data);
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
}

  // =========================
  // FETCH DASHBOARD STATS
  // =========================

  async function fetchStats() {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/admin/stats`,
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
// FETCH ADMIN COUPONS
// =========================

async function fetchCoupons() {
  try {
    setCouponsLoading(true);
    setCouponError("");

    const token = localStorage.getItem("token");

    const response = await fetch(
      `${API_URL}/api/admin/coupons`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to fetch coupons"
      );
    }

    setCoupons(data);
  } catch (error) {
    setCouponError(error.message);
  } finally {
    setCouponsLoading(false);
  }
}

// =========================
// ENABLE / DISABLE COUPON
// =========================

async function toggleCouponStatus(coupon) {
  if (updatingCouponId !== null) return;

  setUpdatingCouponId(coupon.id);
  setCouponError("");
  setCouponMessage("");

  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `${API_URL}/api/admin/coupons/${coupon.id}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          is_active: !coupon.is_active,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to update coupon"
      );
    }

    setCouponMessage(data.message);
    await fetchCoupons();
  } catch (error) {
    setCouponError(error.message);
  } finally {
    setUpdatingCouponId(null);
  }
}


async function deleteCoupon(coupon) {
  if (updatingCouponId !== null || deletingCouponId !== null) {
    return;
  }

  const confirmed = window.confirm(
    `Are you sure you want to permanently delete coupon "${coupon.code}"?`
  );

  if (!confirmed) return;

  setDeletingCouponId(coupon.id);
  setCouponError("");
  setCouponMessage("");

  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `${API_URL}/api/admin/coupons/${coupon.id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to delete coupon");
    }

    setCouponMessage(data.message);
    await fetchCoupons();
  } catch (error) {
    setCouponError(error.message);
  } finally {
    setDeletingCouponId(null);
  }
}


  // =========================
  // UPDATE ORDER STATUS
  // =========================

  async function updateStatus(
  orderId,
  newStatus
) {
      if (updatingOrderId !== null || !newStatus) return;
      setUpdatingOrderId(orderId);
  try {
    setError("");

    const token =
      localStorage.getItem("token");

    const response = await fetch(
      `${API_URL}/api/admin/orders/${orderId}/status`,
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
    setPulseRefreshKey((previous) => previous + 1);
  } catch (error) {
    setError(error.message);
  }
  finally {
  setUpdatingOrderId(null);
}
}


async function handleCreateCoupon(event) {
  event.preventDefault();

  if (savingCoupon) return;

  setSavingCoupon(true);
  setCouponError("");
  setCouponMessage("");

  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `${API_URL}/api/admin/coupons`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...couponForm,
          code: couponForm.code.trim().toUpperCase(),
          discount_value: Number(couponForm.discount_value),
          min_order_amount: Number(couponForm.min_order_amount || 0),
          max_discount:
            couponForm.max_discount === ""
              ? null
              : Number(couponForm.max_discount),
          usage_limit:
            couponForm.usage_limit === ""
              ? null
              : Number(couponForm.usage_limit),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to create coupon");
    }

    setCouponMessage(`Coupon ${data.code} created successfully!`);
    setCouponForm({
      code: "",
      discount_type: "percentage",
      discount_value: "",
      min_order_amount: "0",
      max_discount: "",
      usage_limit: "",
      expires_at: "",
    });
    setShowCouponForm(false);

    await fetchCoupons();
  } catch (error) {
    setCouponError(error.message);
  } finally {
    setSavingCoupon(false);
  }
}

function getNextStatus(status) {
  const transitions = {
    Pending: "Preparing",
    Preparing: "Ready",
    Ready: "Completed"
  };

  return transitions[status] || null;
}

function getStatusActionLabel(status) {
  const labels = {
    Pending: "Start Preparing",
    Preparing: "Mark as Ready",
    Ready: "Complete Order"
  };

  return labels[status] || "";
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

  setPulseRefreshKey((previous) => previous + 1);
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
              kitchen_note: item.kitchen_note,
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
  const filteredOrders = orderList.filter((order) => {
  const search = searchTerm.trim().toLowerCase();

  const matchesSearch =
    search === "" ||
    String(order.order_id).includes(search) ||
    order.customer_name
      ?.toLowerCase()
      .includes(search) ||
    order.customer_email
      ?.toLowerCase()
      .includes(search);

  const matchesStatus =
    statusFilter === "All" ||
    order.status === statusFilter;

  return matchesSearch && matchesStatus;
});

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

        
<div className="admin-header-actions">
  <button
    type="button"
    className="admin-live-board-btn"
    onClick={() =>
      window.open(
        "/pickup-board",
        "_blank",
        "noopener,noreferrer"
      )
    }
  >
    <span>▣</span>
    Open Live Board ↗
  </button>

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
</div>

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
         KITCHEN PULSE
         ========================= */}

     <KitchenPulse refreshKey={pulseRefreshKey} />
         

{/* =========================
    COUPON MANAGEMENT
========================= */}

<section className="admin-v2-orders admin-coupon-management">
  <div className="admin-v2-section-heading">
    <div>
      <h2>Coupon Management</h2>
      <p>Create discounts and manage promotional codes.</p>
    </div>

    <button
      type="button"
      className="admin-v2-refresh"
      onClick={() => {
        setCouponMessage("");
        fetchCoupons();
      }}
      disabled={couponsLoading}
    >
      {couponsLoading ? "Loading..." : "↻ Refresh Coupons"}
    </button>
  </div>

  <div className="admin-coupon-summary">
    <article>
      <span>Total Coupons</span>
      <strong>{coupons.length}</strong>
    </article>
    <article>
      <span>Active Coupons</span>
      <strong>
        {coupons.filter((coupon) => Boolean(coupon.is_active)).length}
      </strong>
    </article>
    <article>
      <span>Total Redemptions</span>
      <strong>
        {coupons.reduce(
          (total, coupon) => total + Number(coupon.used_count || 0),
          0
        )}
      </strong>
    </article>
  </div>

  <div className="admin-coupon-toolbar">
    <div>
      <h3>All Coupons</h3>
      <p>Review usage, validity and status.</p>
    </div>

    <button
      type="button"
      className="admin-status-action-button"
      onClick={() => {
        setCouponError("");
        setCouponMessage("");
        setShowCouponForm((previous) => !previous);
      }}
    >
      {showCouponForm ? "Cancel" : "+ Create Coupon"}
    </button>
  </div>

  {couponError && (
    <div className="admin-v2-error">
      <span>!</span>
      <p>{couponError}</p>
    </div>
  )}

  {couponMessage && (
    <div className="admin-coupon-message" role="status">
      {couponMessage}
    </div>
  )}

  {showCouponForm && (
    <form
      className="admin-coupon-form"
      onSubmit={handleCreateCoupon}
    >
      <h3>Create New Coupon</h3>

      <div className="admin-coupon-form-grid">
        <label>
          Coupon Code *
          <input
            type="text"
            required
            maxLength={30}
            pattern="[A-Za-z0-9_-]+"
            placeholder="e.g. CAMPUS15"
            value={couponForm.code}
            onChange={(event) =>
              setCouponForm({
                ...couponForm,
                code: event.target.value.toUpperCase(),
              })
            }
          />
        </label>

        <label>
          Discount Type *
          <select
            value={couponForm.discount_type}
            onChange={(event) =>
              setCouponForm({
                ...couponForm,
                discount_type: event.target.value,
              })
            }
          >
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed amount (₹)</option>
          </select>
        </label>

        <label>
          Discount Value *
          <input
            type="number"
            required
            min="0.01"
            max={couponForm.discount_type === "percentage" ? "100" : undefined}
            step="0.01"
            value={couponForm.discount_value}
            onChange={(event) =>
              setCouponForm({
                ...couponForm,
                discount_value: event.target.value,
              })
            }
          />
        </label>

        <label>
          Minimum Order (₹)
          <input
            type="number"
            min="0"
            step="0.01"
            value={couponForm.min_order_amount}
            onChange={(event) =>
              setCouponForm({
                ...couponForm,
                min_order_amount: event.target.value,
              })
            }
          />
        </label>

        <label>
          Maximum Discount (₹)
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Optional"
            value={couponForm.max_discount}
            onChange={(event) =>
              setCouponForm({
                ...couponForm,
                max_discount: event.target.value,
              })
            }
          />
        </label>

        <label>
          Usage Limit
          <input
            type="number"
            min="1"
            step="1"
            placeholder="Unlimited"
            value={couponForm.usage_limit}
            onChange={(event) =>
              setCouponForm({
                ...couponForm,
                usage_limit: event.target.value,
              })
            }
          />
        </label>

        <label className="admin-coupon-expiry">
          Expiry Date & Time *
          <input
            type="datetime-local"
            required
            min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
              .toISOString()
              .slice(0, 16)}
            value={couponForm.expires_at}
            onChange={(event) =>
              setCouponForm({
                ...couponForm,
                expires_at: event.target.value,
              })
            }
          />
        </label>
      </div>

      <button
        type="submit"
        className="admin-status-action-button"
        disabled={savingCoupon}
      >
        {savingCoupon ? "Creating..." : "Create Coupon"}
      </button>
    </form>
  )}

  {couponsLoading ? (
    <div className="admin-v2-loading">
      <div className="admin-v2-loader" />
      <h3>Loading coupons...</h3>
    </div>
  ) : coupons.length === 0 ? (
    <div className="admin-v2-empty">
      <h3>No coupons found</h3>
      <p>Create your first promotional coupon.</p>
    </div>
  ) : (
    <div className="admin-coupon-list">
      {coupons.map((coupon) => {
        const active = Boolean(coupon.is_active);
        const usageLimit = coupon.usage_limit;
        const expired = new Date(coupon.expires_at).getTime() <= Date.now();
        const exhausted =
          usageLimit !== null &&
          Number(coupon.used_count) >= Number(usageLimit);

        return (
          <article className="admin-coupon-card" key={coupon.id}>
            <div className="admin-coupon-card-top">
              <div>
                <span className="admin-order-label">COUPON CODE</span>
                <h3>{coupon.code}</h3>
                <p>
                  {coupon.discount_type === "percentage"
                    ? `${Number(coupon.discount_value)}% off`
                    : `₹${Number(coupon.discount_value)} off`}
                </p>
              </div>

              <span
                className={`admin-coupon-status ${
                  active && !expired && !exhausted ? "active" : "inactive"
                }`}
              >
                {!active
                  ? "Disabled"
                  : expired
                    ? "Expired"
                    : exhausted
                      ? "Limit Reached"
                      : "Active"}
              </span>
            </div>

            <div className="admin-coupon-details">
              <div>
                <span>Minimum Order</span>
                <strong>₹{Number(coupon.min_order_amount || 0).toFixed(0)}</strong>
              </div>

              <div>
                <span>Max Discount</span>
                <strong>
                  {coupon.max_discount == null
                    ? "No cap"
                    : `₹${Number(coupon.max_discount).toFixed(0)}`}
                </strong>
              </div>

              <div>
                <span>Redemptions</span>
                <strong>
                  {coupon.used_count}
                  {usageLimit == null ? " / ∞" : ` / ${usageLimit}`}
                </strong>
              </div>

              <div>
                <span>Expires</span>
                <strong>
                  {new Date(coupon.expires_at).toLocaleDateString()}
                </strong>
              </div>
            </div>


<div className="admin-coupon-actions">
  <button
    type="button"
    className="admin-status-action-button"
    disabled={
      updatingCouponId !== null ||
      deletingCouponId !== null
    }
    onClick={() => toggleCouponStatus(coupon)}
  >
    {updatingCouponId === coupon.id
      ? "Updating..."
      : active
        ? "Disable Coupon"
        : "Enable Coupon"}
  </button>

  <button
    type="button"
    className="admin-coupon-delete-button"
    onClick={() => deleteCoupon(coupon)}
    disabled={
      deletingCouponId !== null ||
      updatingCouponId !== null
    }
  >
    {deletingCouponId === coupon.id
      ? "Deleting..."
      : "Delete Coupon"}
  </button>
</div>

          </article>
        );
      })}
    </div>
  )}
</section>


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
                          {filteredOrders.length === orderList.length
                              ? `${orderList.length} orders`
                              : `${filteredOrders.length} of ${orderList.length} orders`}
            </span>
          )}
        </div>

        {/* ORDER SEARCH + FILTER */}

<div className="admin-order-tools">
  <div className="admin-order-search">
    <span>⌕</span>

    <input
      type="text"
      placeholder="Search order, student or email..."
      value={searchTerm}
      onChange={(event) =>
        setSearchTerm(event.target.value)
      }
    />

    {searchTerm && (
      <button
        type="button"
        onClick={() => setSearchTerm("")}
        aria-label="Clear search"
      >
        ×
      </button>
    )}
  </div>

  <div className="admin-status-filter">
    <span>Filter by</span>

    <select
      value={statusFilter}
      onChange={(event) =>
        setStatusFilter(event.target.value)
      }
    >
      <option value="All">All Statuses</option>
      <option value="Pending">Pending</option>
      <option value="Preparing">Preparing</option>
      <option value="Ready">Ready</option>
      <option value="Completed">Completed</option>
      <option value="Cancelled">Cancelled</option>
    </select>
  </div>
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
          {!loading &&
  !error &&
  orderList.length > 0 &&
  filteredOrders.length === 0 && (
    <div className="admin-filter-empty">
      <div>⌕</div>

      <h3>No matching orders</h3>

      <p>
        Try another search or change the status filter.
      </p>

      <button
        type="button"
        onClick={() => {
          setSearchTerm("");
          setStatusFilter("All");
        }}
      >
        Clear Filters
      </button>
    </div>
  )}
        {!loading && !error && (
          <div className="admin-v2-orders-list">
            {filteredOrders.map((order) => {
              const totalItems =
                order.items.reduce(
                  (sum, item) =>
                    sum +
                    Number(item.quantity),
                  0
                );

              return (
                  <article
                      className={`admin-v2-order-card ${order.status === "Cancelled"
                              ? "admin-order-cancelled"
                              : ""
                          }`}
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
          {/* Kitchen Instructions */}

{order.kitchen_note?.trim() && (
  <div className="admin-kitchen-instructions">
    <div className="admin-kitchen-icon">
      👨‍🍳
    </div>

    <div className="admin-kitchen-content">
      <div className="admin-kitchen-header">
        <strong>Special Instructions</strong>
        <span>FROM STUDENT</span>
      </div>

      <p>{order.kitchen_note}</p>
    </div>
  </div>
)}
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

             {order.status === "Cancelled" ? (
                          <div className="admin-cancelled-notice">
                              <div className="admin-cancelled-notice-icon">
                                  ×
                              </div>

                              <div>
                                  <span>CANCELLED ORDER</span>

                                  <strong>
                                      No kitchen action required
                                  </strong>

                                  <small>
                                      This order was cancelled by the student before
                                      preparation started.
                                  </small>
                              </div>
                          </div>
                    ) : order.status === "Completed" ? (
  <div className="admin-completed-notice">
    <div className="admin-completed-icon">
      ✓
    </div>

    <div>
      <span>ORDER COMPLETED</span>

      <strong>
        Order successfully collected
      </strong>

      <small>
        No further kitchen action is required.
      </small>
    </div>
  </div>
) : (
  <div className="admin-status-control-v2">
    <div>
      <span>ORDER STATUS</span>

      <small>
        Current: {order.status}
      </small>
    </div>

    <button
  type="button"
  className="admin-status-action-button"
  disabled={updatingOrderId !== null}
  onClick={() =>
    updateStatus(
      order.order_id,
      getNextStatus(order.status)
    )
  }
>
  {updatingOrderId === order.order_id
    ? "Updating..."
    : getStatusActionLabel(order.status)}
  <span>→</span>
</button>
  </div>
)}

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