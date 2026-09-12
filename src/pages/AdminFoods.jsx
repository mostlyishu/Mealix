import { useEffect, useState } from "react";

function AdminFoods() {
  const [foods, setFoods] = useState([]);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchFoods();
  }, []);

  async function fetchFoods() {
    try {
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
    }
  }

  function resetForm() {
    setName("");
    setPrice("");
    setCategory("");
    setEditingId(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");

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
          category
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
      fetchFoods();
    } catch (error) {
      setError(error.message);
    }
  }

  function startEditing(food) {
    setEditingId(food.id);
    setName(food.name);
    setPrice(food.price);
    setCategory(food.category);

    setMessage("");
    setError("");
  }

  async function deleteFood(id) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this food?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
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

      fetchFoods();
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <main>
      <h1>Food Management</h1>

      <h2>
        {editingId ? "Edit Food" : "Add New Food"}
      </h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Food name"
          value={name}
          onChange={(event) =>
            setName(event.target.value)
          }
        />

        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(event) =>
            setPrice(event.target.value)
          }
        />

        <input
          type="text"
          placeholder="Category"
          value={category}
          onChange={(event) =>
            setCategory(event.target.value)
          }
        />

        <button type="submit">
          {editingId ? "Update Food" : "Add Food"}
        </button>

        {editingId && (
          <button
            type="button"
            onClick={resetForm}
          >
            Cancel
          </button>
        )}
      </form>

      {message && <p>{message}</p>}

      {error && <p>{error}</p>}

      <hr />

      <h2>Current Menu</h2>

      {foods.map((food) => (
        <div key={food.id}>
          <h3>{food.name}</h3>

          <p>₹{food.price}</p>

          <p>{food.category}</p>

          <button
            onClick={() => startEditing(food)}
          >
            Edit
          </button>

          <button
            onClick={() => deleteFood(food.id)}
          >
            Delete
          </button>

          <hr />
        </div>
      ))}
    </main>
  );
}

export default AdminFoods;