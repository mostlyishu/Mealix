import { useState } from "react";
import {
  Link,
  useNavigate
} from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value
    });

    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        "http://localhost:5001/api/login",
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

          login(data.user, data.token);

          navigate("/menu");
      } catch (error) {
          setMessage(error.message);
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
              WELCOME BACK
            </span>

            <h1>
              Good food is only
              <span> a few clicks away.</span>
            </h1>

            <p>
              Sign in to order your campus favourites,
              track your meal and collect it without
              waiting in long queues.
            </p>

            <div className="auth-benefits">
              <div className="auth-benefit">
                <div>⚡</div>

                <span>
                  <strong>Quick ordering</strong>
                  <small>Order in just a few taps</small>
                </span>
              </div>

              <div className="auth-benefit">
                <div>◎</div>

                <span>
                  <strong>Live tracking</strong>
                  <small>Know when your meal is ready</small>
                </span>
              </div>

              <div className="auth-benefit">
                <div>✓</div>

                <span>
                  <strong>Easy pickup</strong>
                  <small>Use your Mealix pickup token</small>
                </span>
              </div>
            </div>
          </div>

          <div className="auth-brand-decoration">
            <span>🍔</span>
          </div>
        </section>

        {/* FORM SIDE */}

        <section className="auth-form-panel">
          <div className="auth-form-wrapper">

            <div className="auth-form-header">
              <span className="auth-form-eyebrow">
                SIGN IN
              </span>

              <h2>Welcome back</h2>

              <p>
                Enter your details to continue to Mealix.
              </p>
            </div>

            <form
              className="auth-form"
              onSubmit={handleSubmit}
            >
              <div className="auth-field">
                <label htmlFor="login-email">
                  Email address
                </label>

                <input
                  id="login-email"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="login-password">
                  Password
                </label>

                <input
                  id="login-password"
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              {message && (
                <div
                  className={`auth-message ${
                    message === "Login successful!"
                      ? "success"
                      : "error"
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
                  ? "Signing in..."
                  : "Sign In"}

                {!loading && <span>→</span>}
              </button>
            </form>

            <div className="auth-switch">
              <span>New to Mealix?</span>

              <Link to="/register">
                Create an account
              </Link>
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}

export default Login;