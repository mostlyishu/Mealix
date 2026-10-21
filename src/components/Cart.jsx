import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import API_URL from "../config/api";

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

  const totalItems = cart.reduce(
    (sum, food) => sum + food.quantity,
    0
  );

  const total = cart.reduce(
    (sum, food) =>
      sum + Number(food.price) * food.quantity,
    0
  );
   
  useEffect(() => {
  if (!isLoggedIn) {
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
    } catch (error) {
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

const discount = rewardIsValid ? selectedReward.discount : 0;
const payableTotal = total - discount;
const appliedRewardPoints = rewardIsValid ? rewardPoints : 0;

  async function handlePlaceOrder() {
    if (placingOrder) return;
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
            reward_points: appliedRewardPoints
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

        <section className="empty-cart">
          <div className="empty-cart-icon">
            🛒
          </div>

          <span className="empty-cart-label">
            NOTHING HERE YET
          </span>

          <h2>Your cart is waiting for something delicious.</h2>

          <p>
            Explore today's campus menu and add your
            favourites to get started.
          </p>

          <button
            className="browse-menu-button"
            onClick={() => navigate("/menu")}
          >
            Browse Menu
            <span>→</span>
          </button>
        </section>
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
      setRewardsOpen((open) => !open);
      setPendingReward(appliedRewardPoints);
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


<div className="summary-divider" />

<div className="cart-payment-breakdown">
  {discount > 0 && (
    <div className="summary-row">
      <span>Rewards discount</span>
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
              disabled={placingOrder}
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