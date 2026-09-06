import { Link, useLocation } from "react-router-dom";

function OrderSuccess() {
  const location = useLocation();

  const orderId = location.state?.orderId;

  return (
    <main>
      <h1>🎉 Order Placed Successfully!</h1>

      <p>Your food order has been placed.</p>

      {orderId && (
        <p>
          <strong>Order #{orderId}</strong>
        </p>
      )}

      <Link to="/orders">
        <button>View My Orders</button>
      </Link>

      <Link to="/menu">
        <button>Order More Food</button>
      </Link>
    </main>
  );
}

export default OrderSuccess;