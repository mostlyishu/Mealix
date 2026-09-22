import { useState } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

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

  const totalItems = cart.reduce(
    (sum, food) => sum + food.quantity,
    0
  );

  const total = cart.reduce(
    (sum, food) =>
      sum + Number(food.price) * food.quantity,
    0
  );

  async function handlePlaceOrder() {
    if (cart.length === 0) {
      setMessage("Your cart is empty.");
      return;
    }

    if (!isLoggedIn) {
      setMessage("Please login before placing an order.");
      return;
    }

    const confirmOrder = window.confirm(
      `Place this order for ₹${total.toFixed(2)}?`
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
        "http://localhost:5001/api/orders",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            items: orderItems
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

                      <div className="cart-item-visual">
                        🍽️
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
                          onClick={() =>
                            decreaseQuantity(food.id)
                          }
                          aria-label={`Decrease ${food.name}`}
                        >
                          −
                        </button>

                        <span>{food.quantity}</span>

                        <button
                          onClick={() =>
                            increaseQuantity(food.id)
                          }
                          aria-label={`Increase ${food.name}`}
                        >
                          +
                        </button>
                      </div>

                      <strong className="item-subtotal">
                        ₹{subtotal.toFixed(0)}
                      </strong>

                      <button
                        className="remove-item-button"
                        onClick={() =>
                          removeFromCart(food.id)
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                );
              })}
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

            <div className="summary-row summary-total">
              <span>Total</span>
              <strong>₹{total.toFixed(0)}</strong>
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