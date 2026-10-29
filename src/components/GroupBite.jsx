import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API_URL from "../config/api";
import "./GroupBite.css";

function getCurrentUserId() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;

    const base64 = token
      .split(".")[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    return JSON.parse(atob(base64)).id;
  } catch {
    return null;
  }
}

const money = (value) =>
  `₹${Number(value || 0).toFixed(2)}`;

function GroupBite() {
  const [groupCode, setGroupCode] = useState("");
  const [group, setGroup] = useState(() => {
    try {
      return JSON.parse(
        sessionStorage.getItem("mealix_group")
      );
    } catch {
      return null;
    }
  });

  const [cart, setCart] = useState(null);
  const [foods, setFoods] = useState([]);
  const [selectedFood, setSelectedFood] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [kitchenNote, setKitchenNote] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const token = localStorage.getItem("token");
  const userId = getCurrentUserId();

  const isHost =
    group &&
    Number(group.host_user_id) === Number(userId);

  const isOpen = group?.status === "Open";

  const itemCount = (cart?.items || []).reduce(
    (sum, item) => sum + Number(item.quantity),
    0
  );

  const contributorCount = new Set(
    (cart?.items || []).map((item) => item.user_id)
  ).size;

  const chosenFood = foods.find(
    (food) => String(food.id) === String(selectedFood)
  );

  function saveGroup(nextGroup) {
    setGroup(nextGroup);

    if (nextGroup) {
      sessionStorage.setItem(
        "mealix_group",
        JSON.stringify(nextGroup)
      );
    } else {
      sessionStorage.removeItem("mealix_group");
    }
  }

  async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        ...(options.body
          ? { "Content-Type": "application/json" }
          : {}),
        ...options.headers
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Something went wrong"
      );
    }

    return data;
  }

  async function fetchCart(groupId) {
    setCartLoading(true);

    try {
      const data = await apiRequest(
        `/api/groups/${groupId}/cart`
      );

      setCart(data);

      if (data.group) {
        saveGroup(data.group);
      }

      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setCartLoading(false);
    }
  }

useEffect(() => {
  if (!group?.id || !token) return;

  const groupId = group.id;

  const timer = setTimeout(() => {
    fetchCart(groupId);
  }, 0);

  return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [group?.id, token]);

  useEffect(() => {
    if (!group?.id) return;

    fetch(`${API_URL}/api/foods`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Menu unavailable");
        }
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setFoods(
            data.filter(
              (food) => Number(food.available) === 1
            )
          );
        }
      })
      .catch(() =>
        setError("Could not load the food menu")
      );
  }, [group?.id]);

  async function createGroup() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const data = await apiRequest("/api/groups", {
        method: "POST"
      });

      saveGroup(data.group);
      setCart(null);
      setCheckoutResult(null);
      setCopied(false);
      setMessage(
        "Your group is ready! Share the invite code."
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function joinGroup(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const data = await apiRequest(
        "/api/groups/join",
        {
          method: "POST",
          body: JSON.stringify({
            group_code: groupCode.trim().toUpperCase()
          })
        }
      );

      saveGroup(data.group);
      setCart(null);
      setCheckoutResult(null);
      setCopied(false);
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

async function copyGroupCode() {
  if (!group?.group_code) return;

  const code = group.group_code;

  try {
    if (!navigator.clipboard?.writeText) {
      throw new Error("Clipboard API unavailable");
    }

    await navigator.clipboard.writeText(code);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = code;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);
    textarea.select();

    const copied = document.execCommand("copy");
    textarea.remove();

    if (!copied) {
      setError("Unable to copy group code. Please copy it manually.");
      return;
    }
  }

  setCopied(true);
}

  async function addFood(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await apiRequest(
        `/api/groups/${group.id}/items`,
        {
          method: "POST",
          body: JSON.stringify({
            food_id: Number(selectedFood),
            quantity: Number(quantity)
          })
        }
      );

      setMessage("Added to the shared cart!");
      setQuantity(1);
      await fetchCart(group.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateQuantity(item, nextQuantity) {
    if (nextQuantity < 1 || nextQuantity > 20) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await apiRequest(
        `/api/groups/${group.id}/items/${item.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            quantity: nextQuantity
          })
        }
      );

      await fetchCart(group.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function removeItem(item) {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await apiRequest(
        `/api/groups/${group.id}/items/${item.id}`,
        { method: "DELETE" }
      );

      setMessage("Item removed from cart");
      await fetchCart(group.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function checkoutGroup() {
    if (
      !group ||
      checkoutLoading ||
      loading ||
      cartLoading
    ) {
      return;
    }

    if (
      !window.confirm(
        `Place the combined group order for ${money(
          cart?.total_amount
        )}?`
      )
    ) {
      return;
    }

    setCheckoutLoading(true);
    setError("");
    setMessage("");

    try {
        const data = await apiRequest(
            `/api/groups/${group.id}/checkout`,
            {
                method: "POST",
                body: JSON.stringify({
                    kitchen_note: kitchenNote.trim()
                })
            }
        );

      setCheckoutResult(data);
      setMessage("Group order placed successfully!");
      await fetchCart(group.id);
    } catch (err) {
      setError(err.message);
      await fetchCart(group.id);
    } finally {
      setCheckoutLoading(false);
    }
  }

  function leaveView() {
    saveGroup(null);
    setCart(null);
    setCheckoutResult(null);
    setError("");
    setMessage("");
    setCopied(false);
  }

  return (
    <section className="gb-page">
      <header className="gb-heading">
        <div className="gb-eyebrow">
          <span className="gb-eyebrow-dot" />
          MEALIX SOCIAL DINING
        </div>

              <h1>
                  <span>Why eat alone?</span>
                  <em>Bring your crew.</em>
              </h1>

        <p>
          One shared cart, one pickup token, and zero
          confusion. Meet GroupBite.
        </p>

        <div className="gb-hero-tags">
          <span>✦ Create a group</span>
          <span>✦ Add your favourites</span>
          <span>✦ Pick up together</span>
        </div>
      </header>

      {error && (
        <div
          className="gb-alert gb-error"
          role="alert"
        >
          <span>!</span>
          {error}
        </div>
      )}

      {message && (
        <div
          className="gb-alert gb-success"
          role="status"
        >
          <span>✓</span>
          {message}
        </div>
      )}

      {!group ? (
        <div className="gb-options">
          <article className="gb-option-card gb-create-card">
            <div className="gb-option-top">
              <span className="gb-option-icon">👥</span>
              <span className="gb-option-label">
                BE THE HOST
              </span>
            </div>

            <h2>Start something tasty.</h2>

            <p>
              Create a group, get a unique code, and
              invite your friends to build one delicious
              order.
            </p>

            <div className="gb-option-footnote">
              Your friends can add their own food.
              You place the final order.
            </div>

            <button
              type="button"
              className="gb-primary-btn"
              onClick={createGroup}
              disabled={loading}
            >
              {loading
                ? "Creating your group…"
                : "Create a group"}
              <span aria-hidden="true">↗</span>
            </button>
          </article>

          <article className="gb-option-card gb-join-card">
            <div className="gb-option-top">
              <span className="gb-option-icon">✳</span>
              <span className="gb-option-label">
                JOIN YOUR FRIENDS
              </span>
            </div>

            <h2>Already got a crew?</h2>

            <p>
              Ask your host for the six-character
              invite code and jump straight into
              the shared cart.
            </p>

            <form onSubmit={joinGroup}>
              <label htmlFor="gb-invite-input">
                GROUP INVITE CODE
              </label>

              <input
                id="gb-invite-input"
                maxLength={6}
                placeholder="E.G. AB12CD"
                value={groupCode}
                onChange={(e) =>
                  setGroupCode(
                    e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, "")
                  )
                }
                autoComplete="off"
                required
              />

              <button
                type="submit"
                className="gb-secondary-btn"
                disabled={
                  loading || groupCode.length !== 6
                }
              >
                Join group
                <span aria-hidden="true">→</span>
              </button>
            </form>
          </article>
        </div>
      ) : (
        <>
          <div className="gb-session-banner">
            <div className="gb-session-details">
              <div className="gb-session-meta">
                <span className="gb-live-dot" />

                {isOpen
                  ? "GROUP IS OPEN"
                  : `GROUP ${group.status?.toUpperCase()}`}

                <span className="gb-role-pill">
                  {isHost ? "HOST" : "MEMBER"}
                </span>
              </div>

              <h2>
                Your table is ready<span>.</span>
              </h2>

              <p>
                Invite your friends to join with
                this code.
              </p>
            </div>

            <div className="gb-invite-card">
              <span className="gb-invite-label">
                YOUR INVITE CODE
              </span>

              <div
                className="gb-code"
                aria-label={`Group code ${group.group_code}`}
              >
                {group.group_code}
              </div>

              <button
                type="button"
                className="gb-copy-btn"
                onClick={copyGroupCode}
              >
                {copied
                  ? "✓ Copied!"
                  : "▣ Copy code"}
              </button>
            </div>
          </div>

          <div className="gb-toolbar">
            <div className="gb-toolbar-left">
              <span className="gb-cart-icon">🛒</span>

              <div>
                <strong>Shared cart</strong>
                <span>
                  {itemCount} items · {contributorCount}{" "}
                  contributor
                  {contributorCount === 1 ? "" : "s"}
                </span>
              </div>
            </div>

            <div className="gb-toolbar-actions">
              <button
                type="button"
                className="gb-ghost-btn"
                onClick={() => fetchCart(group.id)}
                disabled={
                  cartLoading || checkoutLoading
                }
              >
                {cartLoading
                  ? "Refreshing…"
                  : "↻ Refresh cart"}
              </button>

              <button
                type="button"
                className="gb-ghost-btn"
                onClick={leaveView}
              >
                ← Leave view
              </button>
            </div>
          </div>

          <div className="gb-workspace">
            <main className="gb-workspace-main">
              {isOpen && (
                <section className="gb-panel gb-food-panel">
                  <div className="gb-panel-heading">
                    <div>
                      <span className="gb-kicker">
                        01 / PICK YOUR FOOD
                      </span>

                      <h2>Add something delicious</h2>

                      <p>
                        Choose a menu item and add
                        it to the group cart.
                      </p>
                    </div>
                  </div>

                                      <form className="gb-add-food" onSubmit={addFood}>
                                          <div className="gb-food-selector-heading">
                                              <label>CHOOSE YOUR FOOD</label>
                                              <span>{foods.length} items available</span>
                                          </div>

                                          <div className="gb-food-grid">
                                              {foods.map((food) => {
                                                  const active =
                                                      String(selectedFood) === String(food.id);

                                                  return (
                                                      <button
                                                          key={food.id}
                                                          type="button"
                                                          className={`gb-food-choice ${active ? "gb-food-choice-active" : ""}`}
                                                          onClick={() => setSelectedFood(String(food.id))}
                                                          aria-pressed={active}
                                                      >
                                                          <div className="gb-food-choice-image">
                                                              {food.image_url ? (
                                                                  <img
                                                                      src={
                                                                          food.image_url.startsWith("http")
                                                                              ? food.image_url
                                                                              : food.image_url.startsWith("/")
                                                                                  ? food.image_url
                                                                                  : `/${food.image_url}`
                                                                      }
                                                                      alt={food.name}
                                                                      loading="lazy"
                                                                  />
                                                              ) : (
                                                                  <span>🍽️</span>
                                                              )}
                                                          </div>

                                                          <div className="gb-food-choice-info">
                                                              <strong>{food.name}</strong>
                                                              <span>{food.category}</span>
                                                              <b>₹{Number(food.price).toFixed(2)}</b>
                                                          </div>

                                                          <span className="gb-food-choice-check">
                                                              {active ? "✓" : "+"}
                                                          </span>
                                                      </button>
                                                  );
                                              })}
                                          </div>

                                          {foods.length === 0 && (
                                              <p className="gb-food-empty">
                                                  No food items are currently available.
                                              </p>
                                          )}

                                          <div className="gb-food-bottom">
                                              <div className="gb-food-quantity-group">
                                                  <label>QUANTITY</label>

                                                  <div className="gb-food-stepper">
                                                      <button
                                                          type="button"
                                                          aria-label="Decrease quantity"
                                                          disabled={Number(quantity) <= 1}
                                                          onClick={() =>
                                                              setQuantity((prev) =>
                                                                  Math.max(1, Number(prev) - 1)
                                                              )
                                                          }
                                                      >
                                                          −
                                                      </button>

                                                      <strong>{quantity}</strong>

                                                      <button
                                                          type="button"
                                                          aria-label="Increase quantity"
                                                          disabled={Number(quantity) >= 20}
                                                          onClick={() =>
                                                              setQuantity((prev) =>
                                                                  Math.min(20, Number(prev) + 1)
                                                              )
                                                          }
                                                      >
                                                          +
                                                      </button>
                                                  </div>
                                              </div>

                                              <button
                                                  type="submit"
                                                  className="gb-primary-btn gb-food-submit"
                                                  disabled={loading || !selectedFood}
                                              >
                                                  {loading
                                                      ? "Adding..."
                                                      : `+ Add to group cart ${chosenFood
                                                          ? `• ₹${(
                                                              Number(chosenFood.price) *
                                                              Number(quantity)
                                                          ).toFixed(2)}`
                                                          : ""
                                                      }`}
                                              </button>
                                          </div>
                                      </form>
                </section>
              )}

              <section className="gb-panel gb-items-panel">
                <div className="gb-panel-heading">
                  <div>
                    <span className="gb-kicker">
                      {isOpen
                        ? "02 / EVERYONE'S PICKS"
                        : "YOUR GROUP ORDER"}
                    </span>

                    <h2>What's in the cart?</h2>

                    <p>
                      Everyone's food, all in one place.
                    </p>
                  </div>

                  <span className="gb-item-count">
                    {itemCount} ITEMS
                  </span>
                </div>

                {cartLoading && !cart ? (
                  <div className="gb-empty">
                    Loading your shared cart…
                  </div>
                ) : !cart?.items?.length ? (
                  <div className="gb-empty">
                    <span className="gb-empty-icon">
                      🍜
                    </span>

                    <h3>
                      It's a little quiet in here.
                    </h3>

                    <p>
                      Be the first to add something tasty!
                    </p>
                  </div>
                ) : (
                  <div className="gb-cart-list">
                    {cart.items.map((item) => {
                      const isMine =
                        Number(item.user_id) ===
                        Number(userId);

                      return (
                        <div
                          className="gb-cart-item"
                          key={item.id}
                        >
                          <div className="gb-item-avatar">
                            {(item.added_by || "?")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="gb-item-info">
                            <h3>{item.food_name}</h3>

                            <p>
                              Added by {item.added_by}
                              {isMine ? " (you)" : ""}
                            </p>

                            <span>
                              {money(item.price)} each
                            </span>
                          </div>

                          <div className="gb-item-actions">
                            {isMine && isOpen ? (
                              <div className="gb-qty-controls">
                                <button
                                  type="button"
                                  aria-label={`Decrease ${item.food_name}`}
                                  disabled={
                                    loading ||
                                    item.quantity <= 1
                                  }
                                  onClick={() =>
                                    updateQuantity(
                                      item,
                                      Number(item.quantity) - 1
                                    )
                                  }
                                >
                                  −
                                </button>

                                <strong>
                                  {item.quantity}
                                </strong>

                                <button
                                  type="button"
                                  aria-label={`Increase ${item.food_name}`}
                                  disabled={
                                    loading ||
                                    item.quantity >= 20
                                  }
                                  onClick={() =>
                                    updateQuantity(
                                      item,
                                      Number(item.quantity) + 1
                                    )
                                  }
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <span className="gb-static-qty">
                                × {item.quantity}
                              </span>
                            )}

                            <strong className="gb-item-subtotal">
                              {money(item.subtotal)}
                            </strong>

                            {isMine && isOpen && (
                              <button
                                type="button"
                                className="gb-remove-btn"
                                disabled={loading}
                                onClick={() =>
                                  removeItem(item)
                                }
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </main>

            <aside className="gb-summary-column">
              <section className="gb-summary-card">
                <span className="gb-kicker">
                  YOUR GROUP SUMMARY
                </span>

                <h2>The final bite.</h2>

                <div className="gb-summary-line">
                  <span>Items</span>
                  <strong>{itemCount}</strong>
                </div>

                <div className="gb-summary-line">
                  <span>Contributors</span>
                  <strong>{contributorCount}</strong>
                </div>

                <div className="gb-summary-divider" />

                <div className="gb-summary-total">
                  <span>Group total</span>
                  <strong>
                    {money(cart?.total_amount)}
                  </strong>
                </div>

                <p className="gb-summary-disclaimer">
                  One combined order · One pickup token ·
                  Pay at the counter
                </p>
                {isOpen && isHost && (
  <div className="gb-kitchen-note">
    <label htmlFor="gb-kitchen-note">
      Special Instructions <span>(Optional)</span>
    </label>

    <textarea
      id="gb-kitchen-note"
      placeholder="e.g. Less spicy, no onions, extra crispy..."
      value={kitchenNote}
      onChange={(e) => setKitchenNote(e.target.value)}
      maxLength={300}
      rows={3}
      disabled={checkoutLoading || loading || cartLoading}
    />

    <small>{kitchenNote.length}/300 characters</small>
  </div>
)}
                {isOpen && isHost && (
                  <button
                    type="button"
                    className="gb-primary-btn"
                    onClick={checkoutGroup}
                    disabled={
                      checkoutLoading ||
                      loading ||
                      cartLoading ||
                      !cart?.items?.length
                    }
                  >
                    {checkoutLoading
                      ? "Placing your order…"
                      : "Place group order →"}
                  </button>
                )}

                {isOpen && !isHost && (
                  <div className="gb-waiting">
                    ⏳ Your host will place the final
                    order when everyone is ready.
                  </div>
                )}

                {!isOpen && (
                  <div className="gb-waiting">
                    ✓ This group is{" "}
                    {group.status?.toLowerCase()}.
                  </div>
                )}
              </section>

              <div className="gb-tip-card">
                <span>✦</span>

                <div>
                  <strong>A little heads-up</strong>

                  <p>
                    Each member manages their own items.
                    Only the host can check out.
                    Refresh to see friends' latest picks.
                  </p>
                </div>
              </div>
            </aside>
          </div>

          {checkoutResult && (
            <section
              className="gb-order-success"
              role="status"
            >
              <div className="gb-success-icon">✓</div>

              <span className="gb-kicker">
                ORDER CONFIRMED
              </span>

              <h2>You're all set!</h2>

              <p>
                Share this pickup token with your crew.
              </p>

              <div className="gb-pickup-token">
                {checkoutResult.pickup_token}
              </div>

              <p>
                Order #{checkoutResult.order_id} ·{" "}
                {money(checkoutResult.total_amount)}{" "}
                payable at counter
              </p>

              <Link
                to="/orders"
                className="gb-orders-link"
              >
                View my orders →
              </Link>
            </section>
          )}

          {group.status === "Placed" &&
            !checkoutResult && (
              <section className="gb-placed-notice">
                <span className="gb-success-icon">
                  ✓
                </span>

                <h3>Group order placed</h3>

                <p>
                  The host can find the pickup token
                  in My Orders.
                  {group.final_order_id
                    ? ` Order #${group.final_order_id}.`
                    : ""}
                </p>

                {isHost && (
                  <Link
                    to="/orders"
                    className="gb-orders-link"
                  >
                    View my orders →
                  </Link>
                )}
              </section>
            )}
        </>
      )}
    </section>
  );
}

export default GroupBite;