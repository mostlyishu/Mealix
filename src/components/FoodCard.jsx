function FoodCard({
  name,
  price,
  category,
  available,
  onAdd
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

          <button
            className="food-add-button"
            onClick={onAdd}
            disabled={!available}
          >
            {available ? "+ Add" : "Unavailable"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default FoodCard;