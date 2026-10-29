
import { useCallback, useEffect, useState } from "react";
import API_URL from "../config/api";
import "./KitchenPulse.css";

function KitchenPulse({ refreshKey = 0 }) {
  const [pulse, setPulse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPulse = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/kitchen-pulse`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error("Unable to fetch kitchen workload");
      }

      const data = await response.json();
      setPulse(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPulse();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchPulse, refreshKey]);

  const workload = Number(
    pulse?.estimated_workload_minutes || 0
  );

  const status = pulse?.kitchen_status || "Relaxed";

  const statusClass = status.toLowerCase();

  const statusDescription = {
    Relaxed: "Kitchen is ready for incoming orders.",
    Moderate: "Kitchen has a steady preparation workload.",
    Busy: "Kitchen is handling high preparation demand."
  };

  // Display scale: 60 minutes fills the indicator.
  const loadPercentage = Math.min(
    100,
    Math.max(0, (workload / 60) * 100)
  );

  return (
    <section className="kp-panel">
      <div className="kp-header">
        <div className="kp-brand">
          <div className="kp-brand-icon">⚡</div>

          <div>
            <span className="kp-eyebrow">
              MEALIX OPERATIONS
            </span>
            <h2>Kitchen Pulse</h2>
            <p>Smart kitchen workload monitoring</p>
          </div>
        </div>

        <button
          type="button"
          className="kp-refresh"
          onClick={fetchPulse}
          disabled={loading}
        >
          <span className={loading ? "kp-spinning" : ""}>
            ↻
          </span>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {loading && !pulse && (
        <div className="kp-feedback">
          Calculating kitchen workload...
        </div>
      )}

      {error && (
        <div className="kp-error" role="alert">
          {error}
        </div>
      )}

      {pulse && (
        <>
          <div className={`kp-hero ${statusClass}`}>
            <div className="kp-hero-top">
              <div>
                <div className="kp-live-label">
                  <span className="kp-live-dot" />
                  CURRENT KITCHEN STATUS
                </div>

                <h3>
                  {status === "Busy"
                    ? "High Kitchen Load"
                    : status === "Moderate"
                    ? "Moderate Load"
                    : "Kitchen Running Smoothly"}
                </h3>

                <p>{statusDescription[status]}</p>
              </div>

              <div className="kp-hero-icon">👨‍🍳</div>
            </div>

            <div className="kp-load-section">
              <div className="kp-load-heading">
                <span>Estimated workload level</span>
                <strong>{workload} min</strong>
              </div>

              <div
                className="kp-progress-track"
                role="progressbar"
                aria-label="Estimated workload on a 60-minute display scale"
                aria-valuemin={0}
                aria-valuemax={60}
                aria-valuenow={Math.min(60, workload)}
              >
                <div
                  className="kp-progress-fill"
                  style={{ width: `${loadPercentage}%` }}
                />
              </div>

              <div className="kp-progress-labels">
                <span>Relaxed</span>
                <span>Moderate</span>
                <span>Busy</span>
              </div>
            </div>
          </div>

          <div className="kp-metrics">
            <div className="kp-metric">
              <div className="kp-metric-top">
                <span>ACTIVE ORDERS</span>
                <div className="kp-metric-icon">📋</div>
              </div>

              <strong>{pulse.active_orders}</strong>

              <p>Pending &amp; Preparing</p>
            </div>

            <div className="kp-metric">
              <div className="kp-metric-top">
                <span>FOOD ITEMS</span>
                <div className="kp-metric-icon">🍽️</div>
              </div>

              <strong>{pulse.active_items}</strong>

              <p>Items in the kitchen queue</p>
            </div>

            <div className="kp-metric">
              <div className="kp-metric-top">
                <span>EST. WORKLOAD</span>
                <div className="kp-metric-icon">⏱️</div>
              </div>

              <strong>
                {workload}
                <small> min</small>
              </strong>

              <p>
                Based on {pulse.kitchen_capacity} preparation slots
              </p>
            </div>
          </div>

          <div className="kp-footer">
            <span>ⓘ</span>
            <p>
              Workload estimates use food preparation times,
              quantities and assumed kitchen capacity.
              Actual preparation times may vary.
            </p>
          </div>
        </>
      )}
    </section>
  );
}

export default KitchenPulse;
