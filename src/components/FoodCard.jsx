function FoodCard({ name, price, category, onAdd }) {
  return (
    <div className="food-card">
      <div className="food-image">
        🍔
      </div>

      <p className="food-category">{category}</p>

      <h3>{name}</h3>

      <div className="food-bottom">
        <strong>₹{price}</strong>

        <button onClick={onAdd}>
          Add
        </button>
      </div>
    </div>
  );
}

export default FoodCard;