import { useEffect, useState } from "react";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch("http://localhost:5001/api/orders", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch orders");
        }

        return response.json();
      })
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  }, []);

  return (
    <main>
      <h1>My Orders</h1>

      {loading && <p>Loading orders...</p>}

      {error && <p>{error}</p>}

      {!loading && !error && orders.length === 0 && (
        <p>You haven't placed any orders yet.</p>
      )}

      {orders.map((order) => (
        <div key={`${order.order_id}-${order.food_name}`}>
          <h3>Order #{order.order_id}</h3>

          <p>
            {order.food_name} × {order.quantity}
          </p>

          <p>Price: ₹{order.price}</p>

          <p>Total: ₹{order.total_amount}</p>

          <p>Status: {order.status}</p>

          <p>
            Date:{" "}
            {new Date(order.created_at).toLocaleString()}
          </p>

          <hr />
        </div>
      ))}
    </main>
  );
}

export default Orders;