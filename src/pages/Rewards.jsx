
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Rewards.css";

function Rewards() {
  const [wallet, setWallet] = useState({
    points_balance: 0,
    total_earned: 0,
    total_redeemed: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchRewards() {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          "http://localhost:5001/api/rewards",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load rewards"
          );
        }

        if (active) {
          setWallet(data.wallet);
          setTransactions(data.transactions || []);
        }
      } catch (err) {
        if (active) {
          setError(err.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchRewards();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <main className="rewards-page">
        <p>Loading your rewards...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="rewards-page">
        <p role="alert">{error}</p>
      </main>
    );
  }

  return (
    <main className="rewards-page">
      <div className="rewards-container">
        <div className="rewards-heading">
          <span className="rewards-eyebrow">
            THE MEALIX LOYALTY CLUB
          </span>
          <h1>Every meal deserves a little reward.</h1>
          <p>
            Earn points with your orders and unlock
            discounts on future meals.
          </p>
        </div>

        <section className="rewards-balance-card">
          <div className="rewards-balance-top">
            <span>YOUR REWARDS WALLET</span>
            <span className="rewards-star">✦</span>
          </div>

          <div className="rewards-points">
            {wallet.points_balance}
            <span>points available</span>
          </div>

          <div className="rewards-progress-note">
            Earn 1 point for every ₹10 spent on
            completed orders.
          </div>
        </section>

        <div className="rewards-stats">
          <div className="rewards-stat-card">
            <span>Total Points Earned</span>
            <strong>{wallet.total_earned}</strong>
          </div>

          <div className="rewards-stat-card">
            <span>Total Points Redeemed</span>
            <strong>{wallet.total_redeemed}</strong>
          </div>
        </div>

        <section className="rewards-how-it-works">
          <h2>How it works</h2>

          <div className="rewards-steps">
            <div>
              <span className="rewards-step-number">01</span>
              <h3>Order your favourites</h3>
              <p>Choose something delicious from Mealix.</p>
            </div>

            <div>
              <span className="rewards-step-number">02</span>
              <h3>Collect your points</h3>
              <p>
                Points are added once your order
                is completed.
              </p>
            </div>

            <div>
              <span className="rewards-step-number">03</span>
              <h3>Unlock discounts</h3>
              <p>
                Redeem your points for discounts
                once redemption is available.
              </p>
            </div>
          </div>
        </section>

        <section className="rewards-history">
          <div className="rewards-section-heading">
            <h2>Rewards History</h2>
            <span>{transactions.length} transactions</span>
          </div>

          {transactions.length === 0 ? (
            <div className="rewards-empty">
              <p>No rewards earned yet.</p>
              <Link to="/menu">Explore the menu →</Link>
            </div>
          ) : (
            <div className="rewards-transaction-list">
              {transactions.map((transaction) => {
                const earned =
                  transaction.type === "earned";

                return (
                  <div
                    className="rewards-transaction"
                    key={transaction.id}
                  >
                    <div className="rewards-transaction-icon">
                      {earned ? "✦" : "↗"}
                    </div>

                    <div className="rewards-transaction-details">
                      <strong>
                        {transaction.description ||
                          (earned
                            ? "Points earned"
                            : "Points redeemed")}
                      </strong>
                      <span>
                        {new Date(
                          transaction.created_at
                        ).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <strong
                      className={
                        earned
                          ? "rewards-positive"
                          : "rewards-negative"
                      }
                    >
                      {earned ? "+" : "-"}
                      {transaction.points} pts
                    </strong>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default Rewards;
