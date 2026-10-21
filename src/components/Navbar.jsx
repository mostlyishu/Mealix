import { useState } from "react";
import {
  Link,
  NavLink,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import mealixLogo from "../assets/brand/mealix-logo.png";

function Navbar() {
  const { user, logout, isLoggedIn } = useAuth();
  const { totalCartItems } = useCart();

  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();

  const isAdmin = isLoggedIn && user?.role === "admin";
  const isStudent = isLoggedIn && user?.role === "student";

  const getNavClass = ({ isActive }) =>
    isActive ? "nav-link active" : "nav-link";

  function handleLogout() {
    setMoreOpen(false);
    logout();
  }

  const mobileItems = isAdmin
    ? [
        { to: "/", label: "Home", icon: "⌂" },
        { to: "/admin/orders", label: "Orders", icon: "☷" },
        { to: "/admin/foods", label: "Foods", icon: "▦" },
        { to: "/admin/analytics", label: "Analytics", icon: "▥" },
      ]
    : [
        { to: "/", label: "Home", icon: "⌂" },
        { to: "/menu", label: "Menu", icon: "☷" },
        ...(isStudent
          ? [{ to: "/groupbite", label: "GroupBite", icon: "♧" }]
          : []),
        ...(isLoggedIn
          ? [{ to: "/orders", label: "Orders", icon: "▤" }]
          : []),
      ];

  return (
    <>
      <nav className="navbar">
        <Link
          to="/"
          className="nav-logo"
          aria-label="Mealix Home"
          onClick={() => setMoreOpen(false)}
        >
          <img
            src={mealixLogo}
            alt="Mealix"
            className="nav-logo-image"
          />
        </Link>

        <div className="nav-links">
          <NavLink to="/" end className={getNavClass}>
            Home
          </NavLink>

          <NavLink to="/menu" className={getNavClass}>
            Menu
          </NavLink>

          {isStudent && (
            <NavLink to="/groupbite" className={getNavClass}>
              GroupBite
            </NavLink>
          )}

          {/* MEALIX REWARDS - DESKTOP */}
          {isStudent && (
            <NavLink to="/rewards" className={getNavClass}>
              ✦ Rewards
            </NavLink>
          )}

          {isLoggedIn && (
            <NavLink to="/orders" className={getNavClass}>
              My Orders
            </NavLink>
          )}

          <NavLink to="/cart" className={getNavClass}>
            Cart
            {totalCartItems > 0 && (
              <span className="nav-cart-badge">
                {totalCartItems}
              </span>
            )}
          </NavLink>

          {isAdmin && (
            <>
              <NavLink
                to="/admin/orders"
                className={getNavClass}
              >
                Admin Orders
              </NavLink>

              <NavLink
                to="/admin/foods"
                className={getNavClass}
              >
                Manage Foods
              </NavLink>

              <NavLink
                to="/admin/analytics"
                className={getNavClass}
              >
                Analytics
              </NavLink>
            </>
          )}
        </div>

        <div className="navbar-actions">
          {isLoggedIn ? (
            <>
              <div className="navbar-user">
                <span className="user-avatar">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>

                <div className="user-details">
                  <span className="user-name">
                    {user?.name}
                  </span>
                  <span className="user-role">
                    {isAdmin ? "Admin" : "Student"}
                  </span>
                </div>
              </div>

              <button
                className="logout-button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <div className="auth-actions">
              <Link to="/login" className="login-link">
                Login
              </Link>

              <Link to="/register" className="register-button">
                Register
              </Link>
            </div>
          )}
        </div>

        <div className="mobile-header-actions">
          {!isAdmin && (
            <Link
              to="/cart"
              className="mobile-header-cart"
              aria-label={`Cart, ${totalCartItems} items`}
            >
              🛒
              {totalCartItems > 0 && (
                <span className="mobile-cart-count">
                  {totalCartItems}
                </span>
              )}
            </Link>
          )}

          <button
            type="button"
            className="mobile-header-menu"
            onClick={() => setMoreOpen((open) => !open)}
            aria-label="Toggle more menu"
            aria-expanded={moreOpen}
            aria-controls="mealix-mobile-more"
          >
            {moreOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      <div
        id="mealix-mobile-more"
        className={`mobile-more-panel ${moreOpen ? "open" : ""}`}
        hidden={!moreOpen}
      >
        {isLoggedIn && (
          <div className="mobile-profile">
            <span className="user-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
            <div>
              <strong>{user?.name}</strong>
              <small>{isAdmin ? "Admin" : "Student"}</small>
            </div>
          </div>
        )}

        <Link to="/" onClick={() => setMoreOpen(false)}>
          Home
        </Link>

        <Link to="/menu" onClick={() => setMoreOpen(false)}>
          Menu
        </Link>

        {isStudent && (
          <Link
            to="/groupbite"
            onClick={() => setMoreOpen(false)}
          >
            GroupBite
          </Link>
        )}

        {/* MEALIX REWARDS - MOBILE */}
        {isStudent && (
          <Link
            to="/rewards"
            onClick={() => setMoreOpen(false)}
          >
            ✦ My Rewards
          </Link>
        )}

        {isLoggedIn && (
          <Link
            to="/orders"
            onClick={() => setMoreOpen(false)}
          >
            My Orders
          </Link>
        )}

        <Link to="/cart" onClick={() => setMoreOpen(false)}>
          Cart {totalCartItems > 0 ? `(${totalCartItems})` : ""}
        </Link>

        {isAdmin && (
          <>
            <Link
              to="/admin/orders"
              onClick={() => setMoreOpen(false)}
            >
              Admin Orders
            </Link>
            <Link
              to="/admin/foods"
              onClick={() => setMoreOpen(false)}
            >
              Manage Foods
            </Link>
            <Link
              to="/admin/analytics"
              onClick={() => setMoreOpen(false)}
            >
              Analytics
            </Link>
          </>
        )}

        {isLoggedIn ? (
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <>
            <Link to="/login" onClick={() => setMoreOpen(false)}>
              Login
            </Link>
            <Link to="/register" onClick={() => setMoreOpen(false)}>
              Register
            </Link>
          </>
        )}
      </div>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {mobileItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onClick={() => setMoreOpen(false)}
            className={({ isActive }) =>
              `mobile-bottom-link ${isActive ? "active" : ""}`
            }
          >
            <span className="mobile-bottom-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        <button
          type="button"
          className={`mobile-bottom-link ${
            moreOpen ||
            ["/cart", "/login", "/register", "/rewards"].includes(
              location.pathname
            )
              ? "active"
              : ""
          }`}
          onClick={() => setMoreOpen((open) => !open)}
          aria-expanded={moreOpen}
          aria-controls="mealix-mobile-more"
        >
          <span className="mobile-bottom-icon" aria-hidden="true">
            ☰
          </span>
          <span>More</span>
        </button>
      </nav>
    </>
  );
}

export default Navbar;