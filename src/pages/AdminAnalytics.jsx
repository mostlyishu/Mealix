import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

function AdminAnalytics() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [dailyAnalytics, setDailyAnalytics] = useState([]);
  const [hourlyAnalytics, setHourlyAnalytics] = useState([]);
  const [categoryAnalytics, setCategoryAnalytics] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  // =========================
  // LOAD COMPLETE DASHBOARD
  // =========================

  async function loadAnalytics(isRefresh = false) {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      await Promise.all([
        fetchAnalytics(),
        fetchStats(),
        fetchDailyAnalytics(),
        fetchHourlyAnalytics(),
        fetchCategoryAnalytics()
      ]);
    } catch (err) {
      setError(
        err.message ||
          "Failed to load analytics dashboard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // =========================
  // CATEGORY ANALYTICS
  // =========================

  async function fetchCategoryAnalytics() {
    const token = localStorage.getItem("token");

    const response = await fetch(
      "http://localhost:5001/api/admin/analytics/categories",
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to fetch category analytics"
      );
    }

    const formattedData = data.map(
      (category) => ({
        ...category,
        total_quantity_sold: Number(
          category.total_quantity_sold
        ),
        total_sales: Number(
          category.total_sales
        )
      })
    );

    setCategoryAnalytics(formattedData);
  }

  // =========================
  // HOURLY ANALYTICS
  // =========================

  async function fetchHourlyAnalytics() {
    const token = localStorage.getItem("token");

    const response = await fetch(
      "http://localhost:5001/api/admin/analytics/hourly",
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to fetch hourly analytics"
      );
    }

    const formattedData = data.map((item) => {
      const hour = Number(item.hour);

      const displayHour = new Date(
        2000,
        0,
        1,
        hour
      ).toLocaleTimeString("en-IN", {
        hour: "numeric",
        hour12: true
      });

      return {
        hour,
        displayHour,
        total_orders: Number(
          item.total_orders
        )
      };
    });

    setHourlyAnalytics(formattedData);
  }

  // =========================
  // DAILY ANALYTICS
  // =========================

  async function fetchDailyAnalytics() {
    const token = localStorage.getItem("token");

    const response = await fetch(
      "http://localhost:5001/api/admin/analytics/daily",
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to fetch daily analytics"
      );
    }

    const formattedData = data.map((day) => ({
      ...day,

      date: new Date(
        day.date
      ).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        timeZone: "UTC"
      }),

      total_orders: Number(
        day.total_orders
      ),

      total_revenue: Number(
        day.total_revenue
      )
    }));

    setDailyAnalytics(formattedData);
  }

  // =========================
  // FOOD ANALYTICS
  // =========================

  async function fetchAnalytics() {
    const token = localStorage.getItem("token");

    const response = await fetch(
      "http://localhost:5001/api/admin/analytics/foods",
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to fetch analytics"
      );
    }

    const formattedData = data.map((food) => ({
      ...food,

      total_quantity_sold: Number(
        food.total_quantity_sold
      ),

      total_sales: Number(
        food.total_sales
      )
    }));

    setFoods(formattedData);
  }

  // =========================
  // ADMIN STATS
  // =========================

  async function fetchStats() {
    const token = localStorage.getItem("token");

    const response = await fetch(
      "http://localhost:5001/api/admin/stats",
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to fetch stats"
      );
    }

    setStats(data);
  }

  // =========================
  // CALCULATED INSIGHTS
  // =========================

  const totalItemsSold = foods.reduce(
    (total, food) =>
      total +
      Number(food.total_quantity_sold),
    0
  );

  const totalSales = foods.reduce(
    (total, food) =>
      total + Number(food.total_sales),
    0
  );

  const highestQuantity =
    foods.length > 0
      ? Math.max(
          ...foods.map(
            (food) =>
              food.total_quantity_sold
          )
        )
      : 0;

  const mostPopularFoods = foods.filter(
    (food) =>
      food.total_quantity_sold ===
      highestQuantity
  );

  const mostPopularText =
    mostPopularFoods.length > 0
      ? mostPopularFoods
          .map((food) => food.name)
          .join(" & ")
      : "No data";

  const peakHourData =
    hourlyAnalytics.length > 0
      ? hourlyAnalytics.reduce(
          (peak, current) =>
            current.total_orders >
            peak.total_orders
              ? current
              : peak
        )
      : null;

  const highestCategoryQuantity =
    categoryAnalytics.length > 0
      ? Math.max(
          ...categoryAnalytics.map(
            (category) =>
              category.total_quantity_sold
          )
        )
      : 0;

  const topCategories =
    categoryAnalytics.filter(
      (category) =>
        category.total_quantity_sold ===
        highestCategoryQuantity
    );

  const topCategoryText =
    topCategories.length > 0
      ? topCategories
          .map(
            (category) =>
              category.category
          )
          .join(" & ")
      : "No data";

  // =========================
  // TOOLTIP STYLE
  // =========================

  const tooltipStyle = {
    border: "1px solid #e7e2dc",
    borderRadius: "10px",
    fontSize: "11px",
    boxShadow:
      "0 8px 25px rgba(65, 40, 25, 0.08)"
  };

  return (
    <main className="analytics-v2-page">

      {/* HEADER */}

      <section className="analytics-v2-header">
        <div>
          <span className="analytics-v2-eyebrow">
            BUSINESS INSIGHTS
          </span>

          <h1>Canteen Analytics</h1>

          <p>
            Understand sales, demand and menu
            performance using completed Mealix
            orders.
          </p>
        </div>

        <button
          className="analytics-v2-refresh"
          onClick={() =>
            loadAnalytics(true)
          }
          disabled={refreshing}
        >
          <span>↻</span>

          {refreshing
            ? "Refreshing..."
            : "Refresh Analytics"}
        </button>
      </section>

      {/* ERROR */}

      {error && (
        <div className="analytics-v2-error">
          <span>!</span>
          <p>{error}</p>
        </div>
      )}

      {/* LOADING */}

      {loading && (
        <div className="analytics-v2-loading">
          <div className="analytics-v2-loader"></div>

          <h3>Building your dashboard...</h3>

          <p>
            Analysing completed Mealix orders.
          </p>
        </div>
      )}

      {!loading && !error && (
        <>

          {/* KPI SUMMARY */}

          <section className="analytics-v2-summary">
            <article className="analytics-kpi-card">
              <span>Total Items Sold</span>

              <strong>{totalItemsSold}</strong>

              <small>
                Completed order items
              </small>
            </article>

            <article className="analytics-kpi-card revenue">
              <span>Food Sales</span>

              <strong>
                ₹{totalSales.toFixed(0)}
              </strong>

              <small>
                Completed order revenue
              </small>
            </article>

            <article className="analytics-kpi-card">
              <span>Average Order Value</span>

              <strong>
                ₹
                {stats
                  ? Number(
                      stats.average_order_value
                    ).toFixed(0)
                  : "0"}
              </strong>

              <small>
                Per completed order
              </small>
            </article>

            <article className="analytics-kpi-card">
              <span>Peak Ordering Hour</span>

              <strong>
                {peakHourData
                  ? peakHourData.displayHour
                  : "—"}
              </strong>

              <small>
                Highest completed volume
              </small>
            </article>

            <article className="analytics-kpi-card highlight">
              <span>Most Popular</span>

              <strong>
                {mostPopularText}
              </strong>

              <small>
                By quantity sold
              </small>
            </article>

            <article className="analytics-kpi-card">
              <span>Top Category</span>

              <strong>
                {topCategoryText}
              </strong>

              <small>
                By quantity sold
              </small>
            </article>
          </section>

          {/* REVENUE & ORDER TRENDS */}

          <section className="analytics-v2-group">
            <div className="analytics-v2-group-heading">
              <div>
                <span>PERFORMANCE</span>

                <h2>
                  Revenue & Order Trends
                </h2>

                <p>
                  Track how completed sales change
                  over time.
                </p>
              </div>
            </div>

            <div className="analytics-chart-grid">

              {/* DAILY REVENUE */}

              <article className="analytics-v2-chart-card">
                <div className="analytics-chart-heading">
                  <div>
                    <h3>
                      Daily Revenue
                    </h3>

                    <p>
                      Revenue generated from
                      completed orders.
                    </p>
                  </div>

                  <span>₹</span>
                </div>

                {dailyAnalytics.length === 0 ? (
                  <div className="analytics-chart-empty">
                    No daily revenue data yet.
                  </div>
                ) : (
                  <div className="analytics-v2-chart">
                    <ResponsiveContainer
                      width="100%"
                      height={280}
                    >
                      <LineChart
                        data={dailyAnalytics}
                        margin={{
                          top: 10,
                          right: 15,
                          left: 5,
                          bottom: 5
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#eee9e4"
                        />

                        <XAxis
                          dataKey="date"
                          tick={{
                            fontSize: 10,
                            fill: "#78716c"
                          }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <YAxis
                          tick={{
                            fontSize: 10,
                            fill: "#78716c"
                          }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <Tooltip
                          contentStyle={
                            tooltipStyle
                          }
                          formatter={(value) => [
                            `₹${Number(
                              value
                            ).toFixed(2)}`,
                            "Revenue"
                          ]}
                        />

                        <Line
                          type="monotone"
                          dataKey="total_revenue"
                          name="Revenue"
                          stroke="#e35336"
                          strokeWidth={3}
                          dot={{
                            r: 3,
                            fill: "#e35336"
                          }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </article>

              {/* DAILY ORDERS */}

              <article className="analytics-v2-chart-card">
                <div className="analytics-chart-heading">
                  <div>
                    <h3>
                      Daily Order Volume
                    </h3>

                    <p>
                      Completed orders received
                      each day.
                    </p>
                  </div>

                  <span>#</span>
                </div>

                {dailyAnalytics.length === 0 ? (
                  <div className="analytics-chart-empty">
                    No daily order data yet.
                  </div>
                ) : (
                  <div className="analytics-v2-chart">
                    <ResponsiveContainer
                      width="100%"
                      height={280}
                    >
                      <BarChart
                        data={dailyAnalytics}
                        margin={{
                          top: 10,
                          right: 15,
                          left: 0,
                          bottom: 5
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#eee9e4"
                        />

                        <XAxis
                          dataKey="date"
                          tick={{
                            fontSize: 10,
                            fill: "#78716c"
                          }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <YAxis
                          allowDecimals={false}
                          tick={{
                            fontSize: 10,
                            fill: "#78716c"
                          }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <Tooltip
                          contentStyle={
                            tooltipStyle
                          }
                        />

                        <Bar
                          dataKey="total_orders"
                          name="Completed Orders"
                          fill="#e35336"
                          radius={[
                            6,
                            6,
                            0,
                            0
                          ]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </article>

            </div>
          </section>

          {/* DEMAND PATTERNS */}

          <section className="analytics-v2-group">
            <div className="analytics-v2-group-heading">
              <div>
                <span>DEMAND</span>

                <h2>
                  Ordering Patterns
                </h2>

                <p>
                  See when students order and
                  which categories perform best.
                </p>
              </div>
            </div>

            <div className="analytics-chart-grid">

              {/* PEAK HOURS */}

              <article className="analytics-v2-chart-card">
                <div className="analytics-chart-heading">
                  <div>
                    <h3>
                      Peak Ordering Hours
                    </h3>

                    <p>
                      Completed orders grouped
                      by ordering hour.
                    </p>
                  </div>

                  <span>◷</span>
                </div>

                {hourlyAnalytics.length === 0 ? (
                  <div className="analytics-chart-empty">
                    No hourly order data yet.
                  </div>
                ) : (
                  <div className="analytics-v2-chart">
                    <ResponsiveContainer
                      width="100%"
                      height={280}
                    >
                      <BarChart
                        data={hourlyAnalytics}
                        margin={{
                          top: 10,
                          right: 15,
                          left: 0,
                          bottom: 5
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#eee9e4"
                        />

                        <XAxis
                          dataKey="displayHour"
                          tick={{
                            fontSize: 9,
                            fill: "#78716c"
                          }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <YAxis
                          allowDecimals={false}
                          tick={{
                            fontSize: 10,
                            fill: "#78716c"
                          }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <Tooltip
                          contentStyle={
                            tooltipStyle
                          }
                        />

                        <Bar
                          dataKey="total_orders"
                          name="Completed Orders"
                          fill="#f4a460"
                          radius={[
                            6,
                            6,
                            0,
                            0
                          ]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </article>

              {/* CATEGORY PERFORMANCE */}

              <article className="analytics-v2-chart-card">
                <div className="analytics-chart-heading">
                  <div>
                    <h3>
                      Category Performance
                    </h3>

                    <p>
                      Quantity sold across menu
                      categories.
                    </p>
                  </div>

                  <span>▦</span>
                </div>

                {categoryAnalytics.length === 0 ? (
                  <div className="analytics-chart-empty">
                    No category data yet.
                  </div>
                ) : (
                  <div className="analytics-v2-chart">
                    <ResponsiveContainer
                      width="100%"
                      height={280}
                    >
                      <BarChart
                        data={categoryAnalytics}
                        margin={{
                          top: 10,
                          right: 15,
                          left: 0,
                          bottom: 5
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#eee9e4"
                        />

                        <XAxis
                          dataKey="category"
                          tick={{
                            fontSize: 9,
                            fill: "#78716c"
                          }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <YAxis
                          allowDecimals={false}
                          tick={{
                            fontSize: 10,
                            fill: "#78716c"
                          }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <Tooltip
                          contentStyle={
                            tooltipStyle
                          }
                        />

                        <Bar
                          dataKey="total_quantity_sold"
                          name="Quantity Sold"
                          fill="#a0522d"
                          radius={[
                            6,
                            6,
                            0,
                            0
                          ]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </article>

            </div>
          </section>

          {/* MENU PERFORMANCE */}

          <section className="analytics-v2-group">
            <div className="analytics-v2-group-heading">
              <div>
                <span>MENU INSIGHTS</span>

                <h2>
                  Food Performance
                </h2>

                <p>
                  Compare popularity and sales
                  across individual menu items.
                </p>
              </div>
            </div>

            <div className="analytics-chart-grid">

              {/* POPULARITY */}

              <article className="analytics-v2-chart-card">
                <div className="analytics-chart-heading">
                  <div>
                    <h3>Food Popularity</h3>

                    <p>
                      Quantity sold from completed
                      orders.
                    </p>
                  </div>

                  <span>★</span>
                </div>

                {foods.length === 0 ? (
                  <div className="analytics-chart-empty">
                    No food sales data yet.
                  </div>
                ) : (
                  <div className="analytics-v2-chart">
                    <ResponsiveContainer
                      width="100%"
                      height={300}
                    >
                      <BarChart
                        data={foods}
                        margin={{
                          top: 10,
                          right: 15,
                          left: 0,
                          bottom: 45
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#eee9e4"
                        />

                        <XAxis
                          dataKey="name"
                          angle={-18}
                          textAnchor="end"
                          interval={0}
                          height={65}
                          tick={{
                            fontSize: 9,
                            fill: "#78716c"
                          }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <YAxis
                          allowDecimals={false}
                          tick={{
                            fontSize: 10,
                            fill: "#78716c"
                          }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <Tooltip
                          contentStyle={
                            tooltipStyle
                          }
                        />

                        <Bar
                          dataKey="total_quantity_sold"
                          name="Quantity Sold"
                          fill="#e35336"
                          radius={[
                            6,
                            6,
                            0,
                            0
                          ]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </article>

              {/* SALES */}

              <article className="analytics-v2-chart-card">
                <div className="analytics-chart-heading">
                  <div>
                    <h3>Food Sales</h3>

                    <p>
                      Revenue generated by each
                      food.
                    </p>
                  </div>

                  <span>₹</span>
                </div>

                {foods.length === 0 ? (
                  <div className="analytics-chart-empty">
                    No food sales data yet.
                  </div>
                ) : (
                  <div className="analytics-v2-chart">
                    <ResponsiveContainer
                      width="100%"
                      height={300}
                    >
                      <BarChart
                        data={foods}
                        margin={{
                          top: 10,
                          right: 15,
                          left: 5,
                          bottom: 45
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#eee9e4"
                        />

                        <XAxis
                          dataKey="name"
                          angle={-18}
                          textAnchor="end"
                          interval={0}
                          height={65}
                          tick={{
                            fontSize: 9,
                            fill: "#78716c"
                          }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <YAxis
                          tick={{
                            fontSize: 10,
                            fill: "#78716c"
                          }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <Tooltip
                          contentStyle={
                            tooltipStyle
                          }
                          formatter={(value) => [
                            `₹${Number(
                              value
                            ).toFixed(2)}`,
                            "Sales"
                          ]}
                        />

                        <Bar
                          dataKey="total_sales"
                          name="Sales"
                          fill="#a0522d"
                          radius={[
                            6,
                            6,
                            0,
                            0
                          ]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </article>

            </div>
          </section>

          {/* PERFORMANCE TABLE */}

          <section className="analytics-v2-table-section">
            <div className="analytics-v2-group-heading">
              <div>
                <span>DETAILED VIEW</span>

                <h2>
                  Menu Performance
                </h2>

                <p>
                  Food-level results from completed
                  Mealix orders.
                </p>
              </div>

              <span className="analytics-record-count">
                {foods.length} foods
              </span>
            </div>

            {foods.length === 0 ? (
              <div className="analytics-chart-empty">
                No completed order data yet.
              </div>
            ) : (
              <div className="analytics-v2-table-wrapper">
                <table className="analytics-v2-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Food</th>
                      <th>Category</th>
                      <th>Quantity Sold</th>
                      <th>Sales</th>
                    </tr>
                  </thead>

                  <tbody>
                    {foods.map(
                      (food, index) => (
                        <tr key={food.id}>
                          <td>
                            <span className="analytics-rank">
                              #{index + 1}
                            </span>
                          </td>

                          <td>
                            <strong>
                              {food.name}
                            </strong>
                          </td>

                          <td>
                            <span className="analytics-category-badge">
                              {food.category}
                            </span>
                          </td>

                          <td>
                            {
                              food.total_quantity_sold
                            }
                          </td>

                          <td>
                            <strong>
                              ₹
                              {Number(
                                food.total_sales
                              ).toFixed(2)}
                            </strong>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

        </>
      )}
    </main>
  );
}

export default AdminAnalytics;