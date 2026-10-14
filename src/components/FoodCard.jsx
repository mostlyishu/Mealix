
function FoodCard({
  id,
  name,
  price,
  category,
  description,
  available,
  imageUrl,
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
    if (foodName.includes("chowmein")) return "🍜";
    if (foodName.includes("roll")) return "🌯";

    return "🍽️";
  };

  return (
    <article className={`food-card ${!available ? "unavailable" : ""}`}>
      <div className="food-image">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={name}
            className="food-real-image"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
              event.currentTarget
                .nextElementSibling
                ?.classList.remove("hidden");
            }}
          />
        )}

        <div
          className={`food-image-placeholder ${
            imageUrl ? "hidden" : ""
          }`}
        >
          {getFoodEmoji()}
        </div>

        <span className="food-image-category">{category}</span>

        {!available && (
          <span className="food-unavailable-badge">
            Sold Out
          </span>
        )}
      </div>

      <div className="food-card-content">
        <h3>{name}</h3>

              {description?.trim() && (
                  <p className="food-card-description">
                      {description}
                  </p>
              )}

        <div className="food-bottom">
          <div className="food-price">
            <small>PRICE</small>
            <strong>₹{Number(price).toFixed(0)}</strong>
          </div>

          {!available ? (
            <button className="food-add-button" disabled>
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
              type="button"
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
