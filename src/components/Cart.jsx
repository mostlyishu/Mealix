import { useState } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

function Cart() {
  const {
    cart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart
  } = useCart();

  const { isLoggedIn } = useAuth();

  const [message, setMessage] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);

  const total = cart.reduce(
    (sum, food) => sum + food.price * food.quantity,
    0
  );

  async function handlePlaceOrder() {
    if (!isLoggedIn) {
      setMessage("Please login before placing an order.");
      return;
    }

    if (cart.length === 0) {
      setMessage("Your cart is empty.");
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
            items: orderItems,
            total_amount: total
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setMessage(
        `Order placed successfully! Order ID: ${data.orderId}`
      );
      clearCart();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setPlacingOrder(false);
    }
  }

    return (
        <section>
            <h2>Your Cart</h2>

            {cart.length === 0 ? (
                <p>Your cart is empty.</p>
            ) : (
                <>
                    {cart.map((food) => (
                        <div key={food.id}>
                            <h3>{food.name}</h3>

                            <p>₹{food.price}</p>

                            <button onClick={() => decreaseQuantity(food.id)}>
                                −
                            </button>

                            <span> {food.quantity} </span>

                            <button onClick={() => increaseQuantity(food.id)}>
                                +
                            </button>

                            <button onClick={() => removeFromCart(food.id)}>
                                Remove
                            </button>
                        </div>
                    ))}

                    <h3>Total: ₹{total}</h3>

                    <button
                        onClick={handlePlaceOrder}
                        disabled={placingOrder}
                    >
                        {placingOrder ? "Placing Order..." : "Place Order"}
                    </button>
                </>
            )}

            {message && <p>{message}</p>}
        </section>
    );
}

export default Cart;