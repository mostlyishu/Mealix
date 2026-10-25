
import { Link, useLocation } from "react-router-dom";
import { motion } from "motion/react";

function OrderSuccess() {
  const location = useLocation();

  const orderId = location.state?.orderId;
  const pickupToken = location.state?.pickupToken;

  return (
    <main className="order-success-page">
      <motion.section
        className="order-success-card"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        {/* Animated success heading */}

        <motion.div
          className="success-icon"
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 220,
            damping: 14,
            delay: 0.15,
          }}
        >
          <motion.span
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.35 }}
          >
            ✓
          </motion.span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
        >
          <span className="success-eyebrow">
            ORDER CONFIRMED
          </span>

          <h1>Your meal is on its way!</h1>

          <p className="success-message">
            Your order has been sent to the campus
            canteen. We&apos;ll keep you updated as it
            moves through preparation.
          </p>
        </motion.div>

        {/* Order reference */}

        {orderId && (
          <motion.div
            className="success-order-reference"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.35 }}
          >
            <span>MEALIX ORDER</span>
            <strong>#{orderId}</strong>
          </motion.div>
        )}

        {/* Pickup token */}

        {pickupToken && (
          <motion.div
            className="pickup-token-box"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.35 }}
          >
            <span className="pickup-token-label">
              YOUR PICKUP TOKEN
            </span>

            <motion.strong
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.55, type: "spring" }}
            >
              {pickupToken}
            </motion.strong>

            <p>
              Show this token at the canteen counter
              when your order is ready.
            </p>
          </motion.div>
        )}

        {/* What happens next */}

        <motion.div
          className="success-next-section"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
        >
          <span className="success-next-label">
            WHAT HAPPENS NEXT?
          </span>

          <div className="success-steps">
            <div className="success-step">
              <div className="success-step-icon">1</div>
              <div>
                <strong>Order received</strong>
                <p>The canteen has received your order.</p>
              </div>
            </div>

            <div className="success-step-line"></div>

            <div className="success-step">
              <div className="success-step-icon">2</div>
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
              <div className="success-step-icon">3</div>
              <div>
                <strong>Collect your meal</strong>
                <p>
                  Show your pickup token at the counter.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Actions */}

        <motion.div
          className="success-actions"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.35 }}
        >
          <Link to="/orders" className="track-order-button">
            Track My Order
            <span>→</span>
          </Link>

          <Link to="/menu" className="order-more-button">
            Back to Menu
          </Link>
        </motion.div>

        <p className="success-footer-note">
          You can always find your pickup token and
          latest order status in My Orders.
        </p>
      </motion.section>
    </main>
  );
}

export default OrderSuccess;
