import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import API_URL from "../config/api";
import { motion } from "motion/react";

function Cart() {
  const {
    cart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart
  } = useCart();

  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [message, setMessage] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [kitchenNote, setKitchenNote] = useState("");
  const [rewardPoints, setRewardPoints] = useState(0);
const [pointsBalance, setPointsBalance] = useState(0);
const [rewardsLoading, setRewardsLoading] = useState(false);
const [rewardsOpen, setRewardsOpen] = useState(false);
const [pendingReward, setPendingReward] = useState(0);
const [couponInput, setCouponInput] = useState("");
const [appliedCoupon, setAppliedCoupon] = useState(null);
const [couponLoading, setCouponLoading] = useState(false);

  const totalItems = cart.reduce(
    (sum, food) => sum + food.quantity,
    0
  );

  const total = cart.reduce(
  (sum, food) =>
    sum + Number(food.price) * food.quantity,
  0
);

// CLEAR COUPON WHEN CART CHANGES
const cartSignature = JSON.stringify(
  cart.map((food) => [
    food.id,
    food.quantity,
    food.price
  ])
);

useEffect(() => {
  // Reset the coupon whenever cart contents change.
  // This state update is intentional.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  setAppliedCoupon(null);
}, [cartSignature]);
 
  useEffect(() => {
  if (!isLoggedIn) {
  // Reset rewards when the user logs out.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  setPointsBalance(0);
  setRewardPoints(0);
  return;
}

  let active = true;

  async function fetchRewards() {
    setRewardsLoading(true);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/rewards`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Unable to load rewards");
      }

      const data = await response.json();

      if (active) {
        setPointsBalance(Number(data.wallet.points_balance));
      }
    } catch {
      if (active) {
        setPointsBalance(0);
        setRewardPoints(0);
      }
    } finally {
      if (active) setRewardsLoading(false);
    }
  }

  fetchRewards();

  return () => {
    active = false;
  };
}, [isLoggedIn]);

const rewardOptions = [
  { points: 50, discount: 10 },
  { points: 100, discount: 25 }
];

function canUseReward(points, discount) {
  return (
    isLoggedIn &&
    !rewardsLoading &&
    pointsBalance >= points &&
    total >= 100 &&
    discount <= total * 0.25
  );
}

const selectedReward = rewardOptions.find(
  (option) => option.points === rewardPoints
);

const rewardIsValid =
  selectedReward &&
  canUseReward(
    selectedReward.points,
    selectedReward.discount
  );

const rewardDiscount = rewardIsValid
  ? selectedReward.discount
  : 0;

const couponDiscount = appliedCoupon
  ? appliedCoupon.discount
  : 0;

const discount = couponDiscount || rewardDiscount;
const payableTotal = Math.max(0, total - discount);

const appliedRewardPoints =
  appliedCoupon ? 0 : rewardIsValid ? rewardPoints : 0;

async function handleApplyCoupon() {
  if (couponLoading || placingOrder) return;

  if (!isLoggedIn) {
    setMessage("Please log in to apply a coupon.");
    return;
  }

  const code = couponInput.trim().toUpperCase();

  if (!code) {
    setMessage("Please enter a coupon code.");
    return;
  }

  if (appliedRewardPoints > 0) {
    setMessage("Remove your Rewards discount before applying a coupon.");
    return;
  }

  try {
    setCouponLoading(true);
    setMessage("");

    const token = localStorage.getItem("token");

    const response = await fetch(
      `${API_URL}/api/coupons/validate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          code,
          subtotal: total
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Invalid coupon");
    }

    setAppliedCoupon({
      code: data.code,
      discount: Number(data.discount)
    });

    setCouponInput(data.code);
    setMessage("Coupon applied successfully!");

  } catch (error) {
    setAppliedCoupon(null);
    setMessage(error.message);
  } finally {
    setCouponLoading(false);
  }
}

  async function handlePlaceOrder() {
    if (placingOrder) return;
    if (couponLoading) {
      setMessage("Please wait for coupon validation.");
      return;
    }
    if (cart.length === 0) {
      setMessage("Your cart is empty.");
      return;
    }

    if (!isLoggedIn) {
      setMessage("Please login before placing an order.");
      return;
    }

    const confirmOrder = window.confirm(
  `Place this order for ₹${payableTotal.toFixed(2)}?` +
  (appliedRewardPoints > 0
    ? `\nReward: ${appliedRewardPoints} points redeemed`
    : "")
);

    if (!confirmOrder) {
      return;
    }

    try {
      setPlacingOrder(true);
      setMessage("");

      const token = localStorage.getItem("token");

      const orderItems = cart.map((food) => ({
        food_id: food.id,
        quantity: food.quantity
      }));

      const response = await fetch(
        `${API_URL}/api/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            items: orderItems,
            kitchen_note: kitchenNote.trim(),
            reward_points: appliedRewardPoints,
            coupon_code: appliedCoupon ? appliedCoupon.code : ""
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      clearCart();

      navigate("/order-success", {
        state: {
          orderId: data.orderId,
          pickupToken: data.pickupToken
        }
      });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setPlacingOrder(false);
    }
  }

  function handleClearCart() {
    const confirmClear = window.confirm(
      "Remove all items from your cart?"
    );

    if (confirmClear) {
      clearCart();
      setMessage("");
    }
  }

  return (
    <main className="cart-page">

      {/* CART HEADER */}

      <section className="cart-header">
        <span className="cart-eyebrow">
          YOUR ORDER
        </span>

        <h1>Your Cart</h1>

        <p>
          Review your meal, adjust quantities and place
          your campus order when you're ready.
        </p>
      </section>

      {message && (
        <div className="cart-message">
          <span>!</span>
          <p>{message}</p>
        </div>
      )}

      {cart.length === 0 ? (


        /* EMPTY CART */

        <motion.section
          className="empty-cart"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <div className="empty-cart-visual">
            <motion.span
              className="empty-food empty-food-one"
              aria-hidden="true"
              animate={{ y: [0, -10, 0], rotate: [-8, 5, -8] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              🍔
            </motion.span>

            <motion.span
              className="empty-food empty-food-two"
              aria-hidden="true"
              animate={{ y: [0, 9, 0], rotate: [8, -6, 8] }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.3
              }}
            >
              🍟
            </motion.span>

            <motion.span
              className="empty-food empty-food-three"
              aria-hidden="true"
              animate={{ y: [0, -7, 0], rotate: [0, 12, 0] }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.6
              }}
            >
              🥤
            </motion.span>

            <motion.div
              className="empty-cart-icon"
              initial={{ scale: 0.7, rotate: -8 }}
              animate={{ scale: [1, 1.06, 1], rotate: [0, 2, 0] }}
              transition={{
                scale: {
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeInOut"
                },
                rotate: {
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
            >
              🛒
            </motion.div>
          </div>

          <motion.span
            className="empty-cart-label"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            NOTHING HERE YET
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.45 }}
          >
            Your cart is waiting for something delicious.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.45 }}
          >
            Explore today's campus menu and add your
            favourites to get started.
          </motion.p>

          <motion.button
            className="browse-menu-button"
            onClick={() => navigate("/menu")}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 350, damping: 18 }}
          >
            Browse Menu
            <motion.span
              aria-hidden="true"
              animate={{ x: [0, 4, 0] }}
              transition={{
                duration: 1.3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              →
            </motion.span>
          </motion.button>
        </motion.section>

      ) : (
        <div className="cart-layout">

          {/* CART ITEMS */}

          <section className="cart-items-section">

            <div className="cart-section-header">
              <div>
                <h2>Your Items</h2>
                <p>
                  {totalItems}{" "}
                  {totalItems === 1 ? "item" : "items"} in
                  your cart
                </p>
              </div>

              <button
                className="cart-clear-link"
                onClick={handleClearCart}
                disabled={placingOrder}
              >
                Clear cart
              </button>
            </div>

            <div className="cart-items-list">
              {cart.map((food) => {
                const subtotal =
                  Number(food.price) * food.quantity;

                return (
                  <article
                    className="cart-item-card"
                    key={food.id}
                  >
                    <div className="cart-item-main">

                            <div className="cart-item-image">
                                {food.image_url ? (
                                    <img
                                        src={food.image_url}
                                        alt={food.name}
                                        className="cart-food-image"
                                        onError={(event) => {
                                            event.currentTarget.style.display = "none";
                                            event.currentTarget.nextElementSibling?.classList.remove("hidden");
                                        }}
                                    />
                                ) : null}

                                <span
                                    className={`cart-food-fallback ${food.image_url ? "hidden" : ""
                                        }`}
                                >
                                    🍽️
                                </span>
                            </div>

                      <div className="cart-item-info">
                        <span className="cart-item-category">
                          {food.category}
                        </span>

                        <h3>{food.name}</h3>

                        <p>
                          ₹{Number(food.price).toFixed(0)}
                          {" "}per item
                        </p>
                      </div>
                    </div>

                    <div className="cart-item-actions">

                      <div className="quantity-control">
                                <button
                                    type="button"
                                    onClick={() => decreaseQuantity(food.id)}
                                    disabled={placingOrder}
                                    aria-label={`Decrease ${food.name}`}
                                >
                                    −
                                </button>

                        <span>{food.quantity}</span>

                                <button
                                    type="button"
                                    onClick={() => increaseQuantity(food.id)}
                                    disabled={placingOrder}
                                    aria-label={`Increase ${food.name}`}
                                >
                                    +
                                </button>
                      </div>

                      <strong className="item-subtotal">
                        ₹{subtotal.toFixed(0)}
                      </strong>

                            <button
                                type="button"
                                className="remove-item-button"
                                onClick={() => removeFromCart(food.id)}
                                disabled={placingOrder}
                            >
                                Remove
                            </button>
                    </div>
                  </article>
                );
              })}
                      </div>

          <div className="cart-add-more">
            <button
              className="cart-add-more-button"
              onClick={() => navigate("/menu")}
            >
              <span>＋</span>
              Add More Items
            </button>
          </div>

        </section>

          {/* ORDER SUMMARY */}

          <aside className="order-summary">

            <div className="summary-heading">
              <span>ORDER SUMMARY</span>
              <h2>Ready to order?</h2>
            </div>

            <div className="summary-details">
              <div className="summary-row">
                <span>Items</span>
                <strong>{totalItems}</strong>
              </div>

              <div className="summary-row">
                <span>Subtotal</span>
                <strong>₹{total.toFixed(0)}</strong>
              </div>

              <div className="summary-row">
                <span>Pickup</span>
                <strong>Campus Canteen</strong>
              </div>
            </div>

            <div className="summary-divider" />



<div className="cart-rewards compact-rewards">
  <button
    type="button"
    className="rewards-toggle"
                  onClick={() => {
                    if (appliedCoupon && pendingReward > 0) {
                      setMessage("Remove your coupon before using Rewards.");
                      return;
                    }

                    setRewardPoints(pendingReward);
                    setRewardsOpen(false);
                  }}
    aria-expanded={rewardsOpen}
    disabled={placingOrder}
  >
    <span className="rewards-toggle-left">
      <span className="rewards-gift">✦</span>
      <span className="rewards-toggle-info">
        <strong>Mealix Rewards</strong>
        <small>
          {rewardsLoading
            ? "Loading points..."
            : `${pointsBalance} points available`}
        </small>
      </span>
    </span>

    <span className="rewards-toggle-right">
      {appliedRewardPoints > 0 && (
        <span className="rewards-applied-tag">
          ₹{discount} saved
        </span>
      )}
      <span className="rewards-chevron">
        {rewardsOpen ? "⌃" : "⌄"}
      </span>
    </span>
  </button>

  {rewardsOpen && (
    <div className="rewards-dropdown">
      {!isLoggedIn ? (
        <p>Log in to use your rewards.</p>
      ) : (
        <>
          <p className="rewards-dropdown-intro">
            Choose a reward for this order.
          </p>

          <div className="rewards-select-options">
            <label className="rewards-select-item">
              <input
                type="radio"
                name="pending-mealix-reward"
                checked={pendingReward === 0}
                onChange={() => setPendingReward(0)}
                disabled={placingOrder}
              />
              <span>No reward</span>
            </label>

            {rewardOptions.map((option) => {
              const eligible = canUseReward(
                option.points,
                option.discount
              );

              return (
                <label
                  key={option.points}
                  className={`rewards-select-item ${
                    !eligible ? "reward-unavailable" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="pending-mealix-reward"
                    checked={pendingReward === option.points}
                    onChange={() =>
                      setPendingReward(option.points)
                    }
                    disabled={!eligible || placingOrder}
                  />

                  <span>{option.points} points</span>
                  <strong>₹{option.discount} OFF</strong>
                </label>
              );
            })}
          </div>

          <button
            type="button"
            className="apply-rewards-button"
            disabled={
              placingOrder ||
              (pendingReward !== 0 &&
                !rewardOptions.some(
                  (option) =>
                    option.points === pendingReward &&
                    canUseReward(
                      option.points,
                      option.discount
                    )
                ))
            }
            onClick={() => {
              setRewardPoints(pendingReward);
              setRewardsOpen(false);
            }}
          >
            {pendingReward === 0
              ? "Apply Selection"
              : "Use Reward Points →"}
          </button>

          <small className="rewards-rules">
            Min. order ₹100 · Max. 25% discount ·
            One reward per order
          </small>
        </>
      )}
    </div>
  )}
</div>


{/* MEALIX COUPONS */}
<div className="cart-coupons">
  <div className="coupon-heading">
    <div className="coupon-title-row">
      <span className="coupon-icon">🏷️</span>
      <div>
        <strong>Offers & Coupons</strong>
        <p>Unlock savings on your order</p>
      </div>
    </div>
  </div>

  {appliedCoupon ? (
    <div className="coupon-applied">
      <div className="coupon-applied-info">
        <span className="coupon-success-icon">✓</span>
        <div>
          <strong>{appliedCoupon.code}</strong>
          <p>You're saving ₹{appliedCoupon.discount.toFixed(2)}</p>
        </div>
      </div>

      <button
        type="button"
        className="coupon-remove-button"
        onClick={() => {
          setAppliedCoupon(null);
          setCouponInput("");
          setMessage("");
        }}
        disabled={placingOrder}
      >
        Remove
      </button>
    </div>
  ) : (
    <>
      <div className="coupon-input-row">
        <input
          type="text"
          className="coupon-code-input"
          placeholder="Enter coupon code"
          value={couponInput}
          onChange={(e) =>
            setCouponInput(e.target.value.toUpperCase())
          }
          maxLength={30}
          disabled={couponLoading || placingOrder}
        />

        <button
          type="button"
          className="coupon-apply-button"
          onClick={handleApplyCoupon}
          disabled={
            couponLoading ||
            placingOrder ||
            !couponInput.trim()
          }
        >
          {couponLoading ? "Applying..." : "Apply"}
        </button>
      </div>

      <p className="coupon-rules">
        One coupon per order. Cannot combine with Rewards.
      </p>
    </>
  )}
</div>



<div className="summary-divider" />

<div className="cart-payment-breakdown">
{discount > 0 && (
  <div className="summary-row">
    <span>
      {appliedCoupon
        ? `Coupon (${appliedCoupon.code})`
        : "Rewards discount"}
    </span>

    <strong className="cart-discount-amount">
      −₹{discount.toFixed(2)}
    </strong>
  </div>
)}

  <div className="summary-row">
    <span>Amount to pay</span>
    <strong>₹{payableTotal.toFixed(2)}</strong>
  </div>
</div>

<div className="summary-divider" />


            <div className="kitchen-instructions">
  <label htmlFor="kitchen-note">
    Special Instructions <span>(Optional)</span>
  </label>

  <textarea
    id="kitchen-note"
    placeholder="e.g. Less spicy, no onions, extra crispy..."
    value={kitchenNote}
    onChange={(e) => setKitchenNote(e.target.value)}
    maxLength={300}
    rows={3}
    disabled={placingOrder}
  />

  <small>{kitchenNote.length}/300 characters</small>
</div>

            <button
              className="place-order-button"
              onClick={handlePlaceOrder}
              disabled={placingOrder || couponLoading}
            >
              {placingOrder
                ? "Placing Order..."
                : "Confirm & Place Order"}

              {!placingOrder && <span>→</span>}
            </button>

            <p className="summary-note">
              You'll receive a pickup token after your
              order is confirmed.
            </p>

          </aside>
        </div>
      )}
    </main>
  );
}

export default Cart;