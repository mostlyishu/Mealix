import { Link, useLocation } from "react-router-dom";

function OrderSuccess() {
  const location = useLocation();

  const orderId = location.state?.orderId;
  const pickupToken = location.state?.pickupToken;

  return (
    <main className="order-success-page">
      <div className="order-success-card">
        <div className="success-icon">✓</div>

        <h1>Order Placed Successfully!</h1>

        <p className="success-message">
          Your food order has been received by the canteen.
        </p>

        {orderId && (
          <p className="success-order-id">
            Order #{orderId}
          </p>
        )}

        {pickupToken && (
          <div className="pickup-token-box">
            <span>Your Pickup Token</span>

            <strong>{pickupToken}</strong>

            <p>
              Keep this token ready when collecting your food.
            </p>
          </div>
        )}

        <div className="success-actions">
          <Link to="/orders">
            <button className="track-order-button">
              Track My Order
            </button>
          </Link>

          <Link to="/menu">
            <button className="order-more-button">
              Back to Menu
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}

export default OrderSuccess;