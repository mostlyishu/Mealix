import { useState } from "react";
import {
  Link,
  NavLink,
  useLocation,
} from "react-router-dom";
import {
  House,
  Utensils,
  UsersRound,
  Gift,
  ReceiptText,
  ShoppingCart,
  ClipboardList,
  ChefHat,
  ChartNoAxesColumn,
  Menu as MenuIcon,
  LogIn,
  UserPlus,
  Heart
} from "lucide-react";

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
      { to: "/", label: "Home", icon: House },
      { to: "/admin/orders", label: "Orders", icon: ClipboardList },
      { to: "/admin/foods", label: "Foods", icon: ChefHat },
      {
        to: "/admin/analytics",
        label: "Analytics",
        icon: ChartNoAxesColumn
      },
    ]
  : [
      { to: "/", label: "Home", icon: House },
      { to: "/menu", label: "Menu", icon: Utensils },
    {
      to: "/favourites",
      label: "Saved Bites",
      icon: Heart
    },
      ...(isStudent
        ? [
            {
              to: "/groupbite",
              label: "GroupBite",
              icon: UsersRound
            }
          ]
        : []),
      ...(isLoggedIn
        ? [
            {
              to: "/orders",
              label: "Orders",
              icon: ReceiptText
            }
          ]
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
    <House size={17} strokeWidth={1.8} />
    Home
  </NavLink>

  <NavLink to="/menu" className={getNavClass}>
    <Utensils size={17} strokeWidth={1.8} />
    Menu
  </NavLink>
{!isAdmin && (
  <NavLink to="/favourites" className={getNavClass}>
    <Heart size={17} strokeWidth={1.8} />
    Saved Bites
  </NavLink>
)}

  {isStudent && (
    <>
      <NavLink to="/groupbite" className={getNavClass}>
        <UsersRound size={17} strokeWidth={1.8} />
        GroupBite
      </NavLink>

      <NavLink to="/rewards" className={getNavClass}>
        <Gift size={17} strokeWidth={1.8} />
        Rewards
      </NavLink>
    </>
  )}

  {isLoggedIn && (
    <NavLink to="/orders" className={getNavClass}>
      <ReceiptText size={17} strokeWidth={1.8} />
      My Orders
    </NavLink>
  )}

  <NavLink to="/cart" className={getNavClass}>
    <ShoppingCart size={17} strokeWidth={1.8} />
    Cart
    {totalCartItems > 0 && (
      <span className="nav-cart-badge">
        {totalCartItems}
      </span>
    )}
  </NavLink>

  {isAdmin && (
    <>
      <NavLink to="/admin/orders" className={getNavClass}>
        <ClipboardList size={17} strokeWidth={1.8} />
        Admin Orders
      </NavLink>

      <NavLink to="/admin/foods" className={getNavClass}>
        <ChefHat size={17} strokeWidth={1.8} />
        Manage Foods
      </NavLink>

      <NavLink to="/admin/analytics" className={getNavClass}>
        <ChartNoAxesColumn size={17} strokeWidth={1.8} />
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
        <House size={17} />
          Home
        </Link>

        <Link to="/menu" onClick={() => setMoreOpen(false)}>
        <Utensils size={17} strokeWidth={1.8} />
          Menu
        </Link>
        {!isAdmin && (
          <Link
            to="/favourites"
            onClick={() => setMoreOpen(false)}
          >
            <Heart size={17} />
            Saved Bites
          </Link>
        )}

        {isStudent && (
          <Link
            to="/groupbite"
            onClick={() => setMoreOpen(false)}
          >
            <UsersRound size={17} />
            GroupBite
          </Link>
        )}

        {/* MEALIX REWARDS - MOBILE */}
        {isStudent && (
          <Link
            to="/rewards"
            onClick={() => setMoreOpen(false)}
          >
            <Gift size={17} />
             My Rewards
          </Link>
        )}

        {isLoggedIn && (
          <Link
            to="/orders"
            onClick={() => setMoreOpen(false)}
          >
            <ReceiptText size={17} />
            My Orders
          </Link>
        )}

        <Link to="/cart" onClick={() => setMoreOpen(false)}>
        <ShoppingCart size={17} />
          Cart {totalCartItems > 0 ? `(${totalCartItems})` : ""}
        </Link>

        {isAdmin && (
          <>
            <Link
              to="/admin/orders"
              onClick={() => setMoreOpen(false)}
            >
              <ClipboardList size={17} />
              Admin Orders
            </Link>
            <Link
              to="/admin/foods"
              onClick={() => setMoreOpen(false)}
            >
              <ChefHat size={17} />
              Manage Foods
            </Link>
            <Link
              to="/admin/analytics"
              onClick={() => setMoreOpen(false)}
            >
              <ChartNoAxesColumn size={17} />
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
            <LogIn size={17} />
              Login
            </Link>
            <Link to="/register" onClick={() => setMoreOpen(false)}>
            <UserPlus size={17} />
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
  <item.icon size={20} strokeWidth={1.8} />
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
  <MenuIcon size={20} strokeWidth={1.8} />
</span>
          <span>More</span>
        </button>
      </nav>
    </>
  );
}

export default Navbar;