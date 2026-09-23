import { useState } from "react";
import { Link } from "react-router-dom";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value
    });

    setMessage("");
    setSuccess(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage("");
      setSuccess(false);

      const response = await fetch(
        "http://localhost:5001/api/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(formData)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setMessage(data.message);
      setSuccess(true);

      setFormData({
        name: "",
        email: "",
        password: ""
      });
    } catch (error) {
      setMessage(error.message);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-container">

        {/* BRAND SIDE */}

        <section className="auth-brand-panel">
          <div className="auth-brand-content">
            <span className="auth-brand-eyebrow">
              JOIN MEALIX
            </span>

            <h1>
              Campus meals,
              <span> made simpler.</span>
            </h1>

            <p>
              Create your Mealix account and enjoy a
              faster way to order, track and collect
              food on campus.
            </p>

            <div className="auth-benefits">
              <div className="auth-benefit">
                <div>⚡</div>

                <span>
                  <strong>Skip the queue</strong>
                  <small>Order before reaching the counter</small>
                </span>
              </div>

              <div className="auth-benefit">
                <div>◎</div>

                <span>
                  <strong>Track your order</strong>
                  <small>Follow preparation in real time</small>
                </span>
              </div>

              <div className="auth-benefit">
                <div>₹</div>

                <span>
                  <strong>Student friendly</strong>
                  <small>Simple food ordering for campus</small>
                </span>
              </div>
            </div>
          </div>

          <div className="auth-brand-decoration">
            <span>🥪</span>
          </div>
        </section>

        {/* FORM SIDE */}

        <section className="auth-form-panel">
          <div className="auth-form-wrapper">

            <div className="auth-form-header">
              <span className="auth-form-eyebrow">
                CREATE ACCOUNT
              </span>

              <h2>Get started</h2>

              <p>
                Create your account to start ordering
                with Mealix.
              </p>
            </div>

            <form
              className="auth-form"
              onSubmit={handleSubmit}
            >
              <div className="auth-field">
                <label htmlFor="register-name">
                  Full name
                </label>

                <input
                  id="register-name"
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="register-email">
                  Email address
                </label>

                <input
                  id="register-email"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="register-password">
                  Password
                </label>

                <input
                  id="register-password"
                  type="password"
                  name="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              {message && (
                <div
                  className={`auth-message ${
                    success ? "success" : "error"
                  }`}
                >
                  {message}
                </div>
              )}

              <button
                className="auth-submit-button"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Creating account..."
                  : "Create Account"}

                {!loading && <span>→</span>}
              </button>
            </form>

            <div className="auth-switch">
              <span>Already have an account?</span>

              <Link to="/login">
                Sign in
              </Link>
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}

export default Register;