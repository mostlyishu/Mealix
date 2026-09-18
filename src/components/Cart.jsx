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

  // Calculate total quantity
  const totalItems = cart.reduce(
    (sum, food) => sum + food.quantity,
    0
  );

  // Calculate cart total
  const total = cart.reduce(
    (sum, food) =>
      sum + Number(food.price) * food.quantity,
    0
  );

  async function handlePlaceOrder() {
    // Check cart first
    if (cart.length === 0) {
      setMessage("Your cart is empty.");
      return;
    }

    // Check login before showing confirmation
    if (!isLoggedIn) {
      setMessage("Please login before placing an order.");
      return;
    }

    // Only ask for confirmation if order can be placed
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
          orderId: data.orderId
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
      <div className="cart-header">
        <h1>Your Cart</h1>

        <p>
          Review your items before placing your order.
        </p>
      </div>

      {message && (
        <p className="cart-message">
          {message}
        </p>
      )}

      {cart.length === 0 ? (
        <div className="empty-cart">
          <div className="empty-cart-icon">
            🛒
          </div>

          <h2>Your cart is empty</h2>

          <p>
            Add something from the campus menu to get
            started.
          </p>

          <button
            className="browse-menu-button"
            onClick={() => navigate("/menu")}
          >
            Browse Menu
          </button>
        </div>
      ) : (
        <div className="cart-layout">

          {/* Cart items */}

          <section className="cart-items-section">
            <div className="cart-section-header">
              <h2>Cart Items</h2>

              <span>
                {totalItems}{" "}
                {totalItems === 1 ? "item" : "items"}
              </span>
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
                    <div className="cart-item-info">
                      <span className="cart-item-category">
                        {food.category}
                      </span>

                      <h3>{food.name}</h3>

                      <p>
                        ₹{Number(food.price).toFixed(2)} each
                      </p>
                    </div>

                    <div className="cart-item-actions">
                      <div className="quantity-control">
                        <button
                          onClick={() =>
                            decreaseQuantity(food.id)
                          }
                        >
                          −
                        </button>

                        <span>
                          {food.quantity}
                        </span>

                        <button
                          onClick={() =>
                            increaseQuantity(food.id)
                          }
                        >
                          +
                        </button>
                      </div>

                      <strong className="item-subtotal">
                        ₹{subtotal.toFixed(2)}
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

          {/* Order summary */}

          <aside className="order-summary">
            <h2>Order Summary</h2>

            <div className="summary-row">
              <span>Total Items</span>
              <span>{totalItems}</span>
            </div>

            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{total.toFixed(2)}</span>
            </div>

            <div className="summary-divider" />

            <div className="summary-row summary-total">
              <strong>Total</strong>

              <strong>
                ₹{total.toFixed(2)}
              </strong>
            </div>

            <button
              className="place-order-button"
              onClick={handlePlaceOrder}
              disabled={placingOrder}
            >
              {placingOrder
                ? "Placing Order..."
                : "Confirm & Place Order"}
            </button>

            <button
              className="clear-cart-button"
              onClick={handleClearCart}
              disabled={placingOrder}
            >
              Clear Cart
            </button>
          </aside>
        </div>
      )}
    </main>
  );
}

export default Cart;