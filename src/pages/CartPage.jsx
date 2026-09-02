import Cart from "../components/Cart";
import { useCart } from "../context/CartContext";

function CartPage() {
  const {
    cart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity
  } = useCart();

  return (
    <main>
      <Cart
        cart={cart}
        onRemove={removeFromCart}
        onIncrease={increaseQuantity}
        onDecrease={decreaseQuantity}
      />
    </main>
  );
}

export default CartPage;