import { useEffect, useState } from "react";

function AdminFoods() {
  const [foods, setFoods] = useState([]);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
    const [category, setCategory] = useState("");
    const [newCategory, setNewCategory] = useState("");
    const [isAddingCategory, setIsAddingCategory] = useState(false);

    const [available, setAvailable] = useState(true);

  const [editingId, setEditingId] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchFoods();
  }, []);

  async function fetchFoods() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5001/api/foods"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setFoods(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

function resetForm() {
  setName("");
  setPrice("");
  setCategory("");
  setNewCategory("");
  setIsAddingCategory(false);
  setAvailable(true);
  setEditingId(null);
}

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");
    setSaving(true);
      const finalCategory = isAddingCategory
          ? newCategory.trim()
          : category;

      if (!finalCategory) {
          setError("Please select or add a category.");
          return;
      }

    const token = localStorage.getItem("token");

    const url = editingId
      ? `http://localhost:5001/api/admin/foods/${editingId}`
      : "http://localhost:5001/api/admin/foods";

    const method = editingId ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          price,
          category: finalCategory,
          available
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setMessage(
        editingId
          ? "Food updated successfully!"
          : "Food added successfully!"
      );

      resetForm();
      await fetchFoods();
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  function startEditing(food) {
    setEditingId(food.id);
    setName(food.name);
    setPrice(food.price);
      setCategory(food.category);
      setNewCategory("");
      setIsAddingCategory(false);

      setAvailable(Number(food.available) === 1);

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  async function deleteFood(id) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this food?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5001/api/admin/foods/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setMessage("Food deleted successfully!");

      await fetchFoods();
    } catch (error) {
      setError(error.message);
    }
  }
    const categories = [
        ...new Set(
            foods
                .map((food) => food.category?.trim())
                .filter(Boolean)
        )
    ].sort();

  const availableFoods = foods.filter(
    (food) => Number(food.available) === 1
  ).length;

  const unavailableFoods =
    foods.length - availableFoods;

  return (
    <main className="admin-foods-v2">

      {/* PAGE HEADER */}

      <section className="foods-admin-header">
        <div>
          <span className="foods-admin-eyebrow">
            MENU CONTROL
          </span>

          <h1>Manage Foods</h1>

          <p>
            Add new dishes, update menu details and
            control what students can order.
          </p>
        </div>

        <button
          className="foods-refresh-button"
          onClick={fetchFoods}
          disabled={loading}
        >
          <span>↻</span>
          {loading ? "Refreshing..." : "Refresh Menu"}
        </button>
      </section>

      {/* QUICK SUMMARY */}

      <section className="foods-admin-summary">
        <div className="foods-summary-card">
          <span>Total Foods</span>
          <strong>{foods.length}</strong>
          <small>Menu items</small>
        </div>

        <div className="foods-summary-card available">
          <span>Available</span>
          <strong>{availableFoods}</strong>
          <small>Ready to order</small>
        </div>

        <div className="foods-summary-card unavailable">
          <span>Unavailable</span>
          <strong>{unavailableFoods}</strong>
          <small>Currently hidden</small>
        </div>
      </section>

      {/* MESSAGES */}

      {message && (
        <div className="foods-admin-message success">
          <span>✓</span>
          <p>{message}</p>
        </div>
      )}

      {error && (
        <div className="foods-admin-message error">
          <span>!</span>
          <p>{error}</p>
        </div>
      )}

      {/* EDITOR */}

      <section className="food-editor-card">
        <div className="food-editor-heading">
          <div>
            <span>
              {editingId
                ? "EDIT MENU ITEM"
                : "NEW MENU ITEM"}
            </span>

            <h2>
              {editingId
                ? "Update food"
                : "Add a new food"}
            </h2>

            <p>
              {editingId
                ? "Change the details below and save your updates."
                : "Enter the dish details to add it to the Mealix menu."}
            </p>
          </div>

          {editingId && (
            <span className="editing-food-badge">
              Editing #{editingId}
            </span>
          )}
        </div>

        <form
          className="food-editor-form"
          onSubmit={handleSubmit}
        >
          <div className="food-form-field food-name-field">
            <label htmlFor="food-name">
              Food name
            </label>

            <input
              id="food-name"
              type="text"
              placeholder="e.g. Paneer Tikka Burger"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              required
            />
          </div>

                  <div className="food-form-field">
                      <label htmlFor="food-category">
                          Category
                      </label>

                      {!isAddingCategory ? (
                          <select
                              id="food-category"
                              value={category}
                              onChange={(event) => {
                                  const value = event.target.value;

                                  if (value === "__new__") {
                                      setIsAddingCategory(true);
                                      setCategory("");
                                      setNewCategory("");
                                  } else {
                                      setCategory(value);
                                  }
                              }}
                              required
                          >
                              <option value="">
                                  Select category
                              </option>

                              {categories.map((item) => (
                                  <option key={item} value={item}>
                                      {item}
                                  </option>
                              ))}

                              <option value="__new__">
                                  + Add new category
                              </option>
                          </select>
                      ) : (
                          <div className="new-category-input">
                              <input
                                  id="food-category"
                                  type="text"
                                  placeholder="e.g. Pizza"
                                  value={newCategory}
                                  onChange={(event) =>
                                      setNewCategory(event.target.value)
                                  }
                                  autoFocus
                                  required
                              />

                              <button
                                  type="button"
                                  onClick={() => {
                                      setIsAddingCategory(false);
                                      setNewCategory("");
                                  }}
                              >
                                  Cancel
                              </button>
                          </div>
                      )}
                  </div>

          <div className="food-form-field">
            <label htmlFor="food-price">
              Price
            </label>

            <div className="food-price-input">
              <span>₹</span>

              <input
                id="food-price"
                type="number"
                min="0"
                step="0.01"
                placeholder="60"
                value={price}
                onChange={(event) =>
                  setPrice(event.target.value)
                }
                required
              />
            </div>
          </div>

          <label className="food-availability-control">
            <input
              type="checkbox"
              checked={available}
              onChange={(event) =>
                setAvailable(event.target.checked)
              }
            />

            <span className="food-toggle">
              <span></span>
            </span>

            <span className="food-toggle-text">
              <strong>Available for ordering</strong>
              <small>
                Students can add this item to cart
              </small>
            </span>
          </label>

          <div className="food-form-actions">
            <button
              type="submit"
              className="food-save-button"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Save Changes"
                : "Add Food"}

              {!saving && <span>→</span>}
            </button>

            {editingId && (
              <button
                type="button"
                className="food-cancel-button"
                onClick={resetForm}
              >
                Cancel Editing
              </button>
            )}
          </div>
        </form>
      </section>

      {/* CURRENT MENU */}

      <section className="admin-food-list-section">
        <div className="foods-list-heading">
          <div>
            <span>LIVE MENU</span>
            <h2>Current Menu</h2>
            <p>
              Manage the dishes currently stored in
              Mealix.
            </p>
          </div>

          <span className="foods-count-badge">
            {foods.length}{" "}
            {foods.length === 1 ? "food" : "foods"}
          </span>
        </div>

        {loading && (
          <div className="foods-loading-state">
            <div className="foods-loader"></div>
            <p>Loading menu...</p>
          </div>
        )}

        {!loading && foods.length === 0 && (
          <div className="foods-empty-state">
            <div>🍽️</div>
            <h3>No foods yet</h3>
            <p>
              Add your first menu item using the form
              above.
            </p>
          </div>
        )}

        {!loading && foods.length > 0 && (
          <div className="admin-food-grid">
            {foods.map((food) => {
              const isAvailable =
                Number(food.available) === 1;

              return (
                <article
                  className="admin-food-card-v2"
                  key={food.id}
                >
                  <div className="admin-food-card-top">
                    <div className="admin-food-placeholder">
                      🍽️
                    </div>

                    <span
                      className={`food-admin-status ${
                        isAvailable
                          ? "available"
                          : "unavailable"
                      }`}
                    >
                      <span></span>

                      {isAvailable
                        ? "Available"
                        : "Unavailable"}
                    </span>
                  </div>

                  <div className="admin-food-card-body">
                    <span className="admin-food-category">
                      {food.category}
                    </span>

                    <h3>{food.name}</h3>

                    <strong className="admin-food-price">
                      ₹{Number(food.price).toFixed(0)}
                    </strong>
                  </div>

                  <div className="admin-food-card-actions">
                    <button
                      className="admin-food-edit-button"
                      onClick={() =>
                        startEditing(food)
                      }
                    >
                      Edit
                    </button>

                    <button
                      className="admin-food-delete-button"
                      onClick={() =>
                        deleteFood(food.id)
                      }
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

    </main>
  );
}

export default AdminFoods;