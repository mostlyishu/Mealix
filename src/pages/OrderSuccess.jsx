import { Link, useLocation } from "react-router-dom";

function OrderSuccess() {
  const location = useLocation();

  const orderId = location.state?.orderId;
  const pickupToken = location.state?.pickupToken;

  return (
    <main className="order-success-page">
      <section className="order-success-card">

        {/* Success heading */}

        <div className="success-icon">
          ✓
        </div>

        <span className="success-eyebrow">
          ORDER CONFIRMED
        </span>

        <h1>Your meal is on its way!</h1>

        <p className="success-message">
          Your order has been sent to the campus
          canteen. We&apos;ll keep you updated as it
          moves through preparation.
        </p>

        {/* Order reference */}

        {orderId && (
          <div className="success-order-reference">
            <span>MEALIX ORDER</span>
            <strong>#{orderId}</strong>
          </div>
        )}

        {/* Pickup token */}

        {pickupToken && (
          <div className="pickup-token-box">
            <span className="pickup-token-label">
              YOUR PICKUP TOKEN
            </span>

            <strong>{pickupToken}</strong>

            <p>
              Show this token at the canteen counter
              when your order is ready.
            </p>
          </div>
        )}

        {/* What happens next */}

        <div className="success-next-section">
          <span className="success-next-label">
            WHAT HAPPENS NEXT?
          </span>

          <div className="success-steps">
            <div className="success-step">
              <div className="success-step-icon">
                1
              </div>

              <div>
                <strong>Order received</strong>
                <p>
                  The canteen has received your order.
                </p>
              </div>
            </div>

            <div className="success-step-line"></div>

            <div className="success-step">
              <div className="success-step-icon">
                2
              </div>

              <div>
                <strong>Track preparation</strong>
                <p>
                  Follow your live order status in
                  My Orders.
                </p>
              </div>
            </div>

            <div className="success-step-line"></div>

            <div className="success-step">
              <div className="success-step-icon">
                3
              </div>

              <div>
                <strong>Collect your meal</strong>
                <p>
                  Show your pickup token at the counter.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}

        <div className="success-actions">
          <Link
            to="/orders"
            className="track-order-button"
          >
            Track My Order
            <span>→</span>
          </Link>

          <Link
            to="/menu"
            className="order-more-button"
          >
            Back to Menu
          </Link>
        </div>

        <p className="success-footer-note">
          You can always find your pickup token and
          latest order status in My Orders.
        </p>

      </section>
    </main>
  );
}

export default OrderSuccess;