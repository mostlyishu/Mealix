function FoodCard({
  id,
  name,
  price,
  category,
  available,
  quantity,
  onAdd,
  onIncrease,
  onDecrease
}) {
  const getFoodEmoji = () => {
    const foodName = name.toLowerCase();

    if (foodName.includes("burger")) return "🍔";
    if (foodName.includes("sandwich")) return "🥪";
    if (foodName.includes("coffee")) return "🥤";
    if (foodName.includes("maggi")) return "🍜";

    return "🍽️";
  };

  return (
    <article
      className={`food-card ${
        !available ? "unavailable" : ""
      }`}
    >
      <div className="food-image">
        <div className="food-image-placeholder">
          {getFoodEmoji()}
        </div>

        {!available && (
          <span className="food-unavailable-badge">
            Unavailable
          </span>
        )}
      </div>

      <div className="food-card-content">
        <span className="food-category">
          {category}
        </span>

        <h3>{name}</h3>

        <p className="food-card-description">
          Freshly prepared for your campus break.
        </p>

        <div className="food-bottom">
          <div className="food-price">
            ₹{Number(price).toFixed(0)}
          </div>

          {!available ? (
            <button
              className="food-add-button"
              disabled
            >
              Unavailable
            </button>
          ) : quantity > 0 ? (
            <div className="food-quantity-control">
              <button
                type="button"
                onClick={() => onDecrease(id)}
                aria-label={`Decrease ${name}`}
              >
                −
              </button>

              <span>{quantity}</span>

              <button
                type="button"
                onClick={() => onIncrease(id)}
                aria-label={`Increase ${name}`}
              >
                +
              </button>
            </div>
          ) : (
            <button
              className="food-add-button"
              onClick={onAdd}
            >
              + Add
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default FoodCard;