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

  // Group all rows belonging to the same order
  const groupedOrders = orders.reduce((groups, item) => {
    if (!groups[item.order_id]) {
      groups[item.order_id] = {
        order_id: item.order_id,
        total_amount: item.total_amount,
        status: item.status,
        created_at: item.created_at,
        items: []
      };
    }

    groups[item.order_id].items.push({
      food_name: item.food_name,
      price: item.price,
      quantity: item.quantity
    });

    return groups;
  }, {});

  const orderList = Object.values(groupedOrders);

  return (
    <main>
      <h1>My Orders</h1>

      {loading && <p>Loading orders...</p>}

      {error && <p>{error}</p>}

      {!loading && !error && orderList.length === 0 && (
        <p>You haven't placed any orders yet.</p>
      )}

      {orderList.map((order) => (
        <div key={order.order_id}>
          <h2>Order #{order.order_id}</h2>

          {order.items.map((item, index) => (
            <p key={index}>
              {item.food_name} × {item.quantity}
            </p>
          ))}

          <p>
            <strong>Total: ₹{order.total_amount}</strong>
          </p>

          <p>Status: {order.status}</p>

          <p>
            Date: {new Date(order.created_at).toLocaleString()}
          </p>

          <hr />
        </div>
      ))}
    </main>
  );
}

export default Orders;