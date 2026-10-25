
import { useEffect, useState } from "react";
import { motion } from "motion/react";

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
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!justAdded) return;

    const timer = setTimeout(() => {
      setJustAdded(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [justAdded]);

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

  function handleAdd() {
    onAdd();
    setJustAdded(true);
  }

  return (
    <article
      className={`food-card ${!available ? "unavailable" : ""}`}
    >
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
              <motion.button
                type="button"
                whileTap={{ scale: 0.85 }}
                onClick={() => onDecrease(id)}
                aria-label={`Decrease ${name}`}
              >
                −
              </motion.button>

              <motion.span
                key={quantity}
                initial={{ scale: 1.25 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.15 }}
              >
                {quantity}
              </motion.span>

              <motion.button
                type="button"
                whileTap={{ scale: 0.85 }}
                onClick={() => onIncrease(id)}
                aria-label={`Increase ${name}`}
              >
                +
              </motion.button>
            </div>
          ) : (
            <motion.button
              type="button"
              className="food-add-button"
              onClick={handleAdd}
              whileTap={{ scale: 0.94 }}
              animate={justAdded ? { scale: [1, 1.06, 1] } : {}}
              transition={{ duration: 0.2 }}
            >
              {justAdded ? "Added ✓" : "+ Add"}
            </motion.button>
          )}
        </div>
      </div>
</article>
  );
}

export default FoodCard;
