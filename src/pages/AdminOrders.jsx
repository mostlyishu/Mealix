import { useEffect, useState } from "react";

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:5001/api/admin/orders")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch admin orders");
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

  // Group items belonging to the same order
  const groupedOrders = orders.reduce((groups, item) => {
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
  }, {});

  const orderList = Object.values(groupedOrders);

  return (
    <main>
      <h1>Canteen Dashboard</h1>

      {loading && <p>Loading orders...</p>}

      {error && <p>{error}</p>}

      {!loading && !error && orderList.length === 0 && (
        <p>No orders yet.</p>
      )}

      {orderList.map((order) => (
        <div key={order.order_id}>
          <h2>Order #{order.order_id}</h2>

          <p>
            <strong>Customer:</strong> {order.customer_name}
          </p>

          <p>
            <strong>Email:</strong> {order.customer_email}
          </p>

          <h3>Items</h3>

          {order.items.map((item, index) => (
            <p key={index}>
              {item.food_name} × {item.quantity}
            </p>
          ))}

          <p>
            <strong>Total:</strong> ₹{order.total_amount}
          </p>

          <p>
            <strong>Status:</strong> {order.status}
          </p>

          <p>
            <strong>Placed:</strong>{" "}
            {new Date(order.created_at).toLocaleString()}
          </p>

          <hr />
        </div>
      ))}
    </main>
  );
}

export default AdminOrders;