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
  ResponsiveContainer,
  Legend
} from "recharts";

function AdminAnalytics() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [dailyAnalytics, setDailyAnalytics] = useState([]);
  const [hourlyAnalytics, setHourlyAnalytics] = useState([]);
  const [categoryAnalytics, setCategoryAnalytics] = useState([]);

  useEffect(() => {
  fetchAnalytics();
  fetchStats();
  fetchDailyAnalytics();
  fetchHourlyAnalytics();
  fetchCategoryAnalytics();
}, []);

async function fetchCategoryAnalytics() {
  try {
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
        data.message || "Failed to fetch category analytics"
      );
    }

    const formattedData = data.map((category) => ({
      ...category,
      total_quantity_sold: Number(
        category.total_quantity_sold
      ),
      total_sales: Number(category.total_sales)
    }));

    setCategoryAnalytics(formattedData);
  } catch (err) {
    console.error("Category analytics error:", err);
  }
}

async function fetchHourlyAnalytics() {
  try {
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
        data.message || "Failed to fetch hourly analytics"
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
        total_orders: Number(item.total_orders)
      };
    });

    setHourlyAnalytics(formattedData);
  } catch (err) {
    console.error("Hourly analytics error:", err);
  }
}

async function fetchDailyAnalytics() {
  try {
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
        data.message || "Failed to fetch daily analytics"
      );
    }

    const formattedData = data.map((day) => ({
      ...day,

      date: new Date(day.date).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          timeZone: "UTC"
        }
      ),

      total_orders: Number(day.total_orders),
      total_revenue: Number(day.total_revenue)
    }));

    setDailyAnalytics(formattedData);
  } catch (err) {
    console.error("Daily analytics error:", err);
  }
}

  async function fetchAnalytics() {
    try {
      setLoading(true);
      setError("");

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
          data.message || "Failed to fetch analytics"
        );
      }

      const formattedData = data.map((food) => ({
  ...food,
  total_quantity_sold: Number(
    food.total_quantity_sold
  ),
  total_sales: Number(food.total_sales)
}));

setFoods(formattedData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to fetch stats"
      );
    }

    setStats(data);
  } catch (err) {
    console.error("Stats error:", err);
  }
}

  const totalItemsSold = foods.reduce(
    (total, food) =>
      total + Number(food.total_quantity_sold),
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
          (food) => food.total_quantity_sold
        )
      )
    : 0;

const mostPopularFoods = foods.filter(
  (food) =>
    food.total_quantity_sold === highestQuantity
);

const mostPopularText =
  mostPopularFoods.length > 0
    ? mostPopularFoods
        .map((food) => food.name)
        .join(" & ")
    : "No data";

    const peakHourData =
  hourlyAnalytics.length > 0
    ? hourlyAnalytics.reduce((peak, current) =>
        current.total_orders > peak.total_orders
          ? current
          : peak
      )
    : null;

    const highestCategoryQuantity =
  categoryAnalytics.length > 0
    ? Math.max(
        ...categoryAnalytics.map(
          (category) => category.total_quantity_sold
        )
      )
    : 0;

const topCategories = categoryAnalytics.filter(
  (category) =>
    category.total_quantity_sold === highestCategoryQuantity
);

const topCategoryText =
  topCategories.length > 0
    ? topCategories
        .map((category) => category.category)
        .join(" & ")
    : "No data";

  return (
    <main className="analytics-page">
      <div className="analytics-header">
        <div>
          <h1>Canteen Analytics</h1>
          <p>
            Insights from completed Mealix orders.
          </p>
        </div>

        <button
          className="analytics-refresh-button"
                  onClick={() => {
                      fetchAnalytics();
                      fetchStats();
                      fetchDailyAnalytics();
                      fetchHourlyAnalytics();
                      fetchCategoryAnalytics();
                  }}
        >
          Refresh
        </button>
      </div>

      {loading && (
        <p className="analytics-message">
          Loading analytics...
        </p>
      )}

      {error && (
        <p className="analytics-error">
          {error}
        </p>
      )}

      {!loading && !error && (
        <>
          <section className="analytics-summary">
  <div className="analytics-stat-card">
    <span>Total Items Sold</span>
    <strong>{totalItemsSold}</strong>
  </div>

  <div className="analytics-stat-card">
    <span>Food Sales</span>
    <strong>₹{totalSales.toFixed(2)}</strong>
  </div>

  <div className="analytics-stat-card">
    <span>Most Popular</span>
    <strong>{mostPopularText}</strong>
  </div>

  <div className="analytics-stat-card">
    <span>Average Order Value</span>
    <strong>
      ₹
      {stats
        ? Number(stats.average_order_value).toFixed(2)
        : "0.00"}
    </strong>
  </div>

  <div className="analytics-stat-card">
    <span>Peak Ordering Hour</span>
    <strong>
      {peakHourData
        ? peakHourData.displayHour
        : "No data"}
    </strong>
  </div>

  <div className="analytics-stat-card">
  <span>Top Category</span>
  <strong>{topCategoryText}</strong>
</div>
</section>

          <section className="analytics-chart-section">
  <div className="section-heading">
    <h2>Daily Revenue Trend</h2>

    <p>
      Revenue generated from completed orders by day.
    </p>
  </div>

  {dailyAnalytics.length === 0 ? (
    <p className="analytics-message">
      No daily sales data available yet.
    </p>
  ) : (
    <div className="food-chart">
      <ResponsiveContainer width="100%" height={320}>
        <LineChart
          data={dailyAnalytics}
          margin={{
            top: 10,
            right: 20,
            left: 10,
            bottom: 10
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="date" />

          <YAxis />

          <Tooltip
            formatter={(value) => [
              `₹${Number(value).toFixed(2)}`,
              "Revenue"
            ]}
          />

          <Legend />

          <Line
            type="monotone"
            dataKey="total_revenue"
            name="Revenue"
            stroke="#111827"
            strokeWidth={3}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )}
</section>

<section className="analytics-chart-section">
  <div className="section-heading">
    <h2>Daily Order Volume</h2>

    <p>
      Number of completed orders received each day.
    </p>
  </div>

  {dailyAnalytics.length === 0 ? (
    <p className="analytics-message">
      No daily order data available yet.
    </p>
  ) : (
    <div className="food-chart">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={dailyAnalytics}
          margin={{
            top: 10,
            right: 20,
            left: 0,
            bottom: 10
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="date" />

          <YAxis allowDecimals={false} />

          <Tooltip />

          <Bar
            dataKey="total_orders"
            name="Completed Orders"
            fill="#111827"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )}
</section>

<section className="analytics-chart-section">
  <div className="section-heading">
    <h2>Peak Ordering Hours</h2>

    <p>
      Completed orders grouped by the hour they were placed.
    </p>
  </div>

  {hourlyAnalytics.length === 0 ? (
    <p className="analytics-message">
      No hourly order data available yet.
    </p>
  ) : (
    <div className="food-chart">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={hourlyAnalytics}
          margin={{
            top: 10,
            right: 20,
            left: 0,
            bottom: 10
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="displayHour" />

          <YAxis allowDecimals={false} />

          <Tooltip />

          <Bar
            dataKey="total_orders"
            name="Completed Orders"
            fill="#111827"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )}
</section>

<section className="analytics-chart-section">
  <div className="section-heading">
    <h2>Category Performance</h2>

    <p>
      Quantity sold across different food categories.
    </p>
  </div>

  {categoryAnalytics.length === 0 ? (
    <p className="analytics-message">
      No category sales data available yet.
    </p>
  ) : (
    <div className="food-chart">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={categoryAnalytics}
          margin={{
            top: 10,
            right: 20,
            left: 0,
            bottom: 10
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="category" />

          <YAxis allowDecimals={false} />

          <Tooltip />

          <Bar
            dataKey="total_quantity_sold"
            name="Quantity Sold"
            fill="#111827"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )}
</section>

                  <section className="analytics-chart-section">
                      <div className="section-heading">
                          <h2>Food Popularity</h2>

                          <p>
                              Quantity sold from completed orders.
                          </p>
                      </div>

                      {foods.length === 0 ? (
                          <p className="analytics-message">
                              No sales data available yet.
                          </p>
                      ) : (
                          <div className="food-chart">
                              <ResponsiveContainer width="100%" height={320}>
                                  <BarChart
                                      data={foods}
                                      margin={{
                                          top: 10,
                                          right: 20,
                                          left: 0,
                                          bottom: 30
                                      }}
                                  >
                                      <CartesianGrid strokeDasharray="3 3" />

                                      <XAxis
                                          dataKey="name"
                                          angle={-15}
                                          textAnchor="end"
                                          interval={0}
                                          height={70}
                                      />

                                      <YAxis
                                          allowDecimals={false}
                                      />

                                      <Tooltip />

                                      <Bar
                                          dataKey="total_quantity_sold"
                                          name="Quantity Sold"
                                          fill="#111827"
                                          radius={[6, 6, 0, 0]}
                                      />
                                  </BarChart>
                              </ResponsiveContainer>
                          </div>
                      )}
                  </section>

                  <section className="analytics-chart-section">
  <div className="section-heading">
    <h2>Food Sales</h2>

    <p>
      Sales generated by each food from completed orders.
    </p>
  </div>

  {foods.length === 0 ? (
    <p className="analytics-message">
      No sales data available yet.
    </p>
  ) : (
    <div className="food-chart">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={foods}
          margin={{
            top: 10,
            right: 20,
            left: 10,
            bottom: 30
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="name"
            angle={-15}
            textAnchor="end"
            interval={0}
            height={70}
          />

          <YAxis />

          <Tooltip
            formatter={(value) => [
              `₹${Number(value).toFixed(2)}`,
              "Sales"
            ]}
          />

          <Bar
            dataKey="total_sales"
            name="Sales"
            fill="#111827"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )}
</section>

          <section className="food-performance-section">
            <div className="section-heading">
              <h2>Food Performance</h2>

              <p>
                Ranked by quantity sold from completed
                orders.
              </p>
            </div>

            {foods.length === 0 ? (
              <p className="analytics-message">
                No completed order data available yet.
              </p>
            ) : (
              <div className="analytics-table-wrapper">
                <table className="analytics-table">
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
                    {foods.map((food, index) => (
                      <tr key={food.id}>
                        <td>#{index + 1}</td>

                        <td>
                          <strong>{food.name}</strong>
                        </td>

                        <td>{food.category}</td>

                        <td>
                          {food.total_quantity_sold}
                        </td>

                        <td>
                          ₹
                          {Number(
                            food.total_sales
                          ).toFixed(2)}
                        </td>
                      </tr>
                    ))}
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