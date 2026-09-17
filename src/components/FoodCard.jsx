function FoodCard({ name, price, category, available, onAdd }) {
  return (
    <div className="food-card">
      <div className="food-image">
        🍔
      </div>

      <p className="food-category">{category}</p>

      <h3>{name}</h3>

      <div className="food-bottom">
        <strong>₹{price}</strong>

        <button
          onClick={onAdd}
          disabled={!available}
        >
          {available ? "Add" : "Unavailable"}
        </button>
      </div>
    </div>
  );
}

export default FoodCard;