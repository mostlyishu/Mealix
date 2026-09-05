import { Link } from "react-router-dom";

function Navbar() {
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

    </nav>
  );
}

export default Navbar;