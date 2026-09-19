import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
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

  useEffect(() => {
  fetchAnalytics();
  fetchStats();
}, []);

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
              <strong>
                ₹{totalSales.toFixed(2)}
              </strong>
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