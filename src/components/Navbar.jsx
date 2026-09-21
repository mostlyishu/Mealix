import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import mealixLogo from "../assets/brand/mealix-logo.png";

function Navbar() {
  const { user, logout, isLoggedIn } = useAuth();

  const getNavClass = ({ isActive }) =>
    isActive ? "nav-link active" : "nav-link";

  return (
    <nav className="navbar">
          <Link to="/" className="nav-logo">
              <img
                  src={mealixLogo}
                  alt="Mealix"
                  className="nav-logo-image"
              />
          </Link>

      <div className="nav-links">
        <NavLink to="/" className={getNavClass}>
          Home
        </NavLink>

        <NavLink to="/menu" className={getNavClass}>
          Menu
        </NavLink>

        {isLoggedIn && (
          <NavLink to="/orders" className={getNavClass}>
            My Orders
          </NavLink>
        )}

        <NavLink to="/cart" className={getNavClass}>
          Cart
        </NavLink>

        {isLoggedIn && user?.role === "admin" && (
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
                  {user?.role === "admin"
                    ? "Admin"
                    : "Student"}
                </span>
              </div>
            </div>

            <button
              className="logout-button"
              onClick={logout}
            >
              Logout
            </button>
          </>
        ) : (
          <div className="auth-actions">
            <Link to="/login" className="login-link">
              Login
            </Link>

            <Link
              to="/register"
              className="register-button"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;