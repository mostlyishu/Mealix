function Cart({ cart, onRemove, onIncrease, onDecrease }) {
  const total = cart.reduce(
    (sum, food) => sum + food.price * food.quantity,
    0
  );

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

              <button onClick={() => onDecrease(food.id)}>
                −
              </button>

              <span> {food.quantity} </span>

              <button onClick={() => onIncrease(food.id)}>
                +
              </button>

              <button onClick={() => onRemove(food.id)}>
                Remove
              </button>
            </div>
          ))}

          <h3>Total: ₹{total}</h3>
        </>
      )}
    </section>
  );
}

export default Cart;