import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout, isLoggedIn } = useAuth();

  return (
    <nav className="navbar">
      <div className="logo">
        🍴 Mealix
      </div>

      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/menu">Menu</Link>
        <Link to="/orders">My Orders</Link>
        <Link to="/cart">Cart</Link>
      </div>

      <div>
        {isLoggedIn ? (
          <>
            <span>Hi, {user.name}</span>

            <button
              className="login-button"
              onClick={logout}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">
              <button className="login-button">
                Login
              </button>
            </Link>

            <Link to="/register">
              <button className="login-button">
                Register
              </button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;