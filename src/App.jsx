import { BrowserRouter, Routes, Route } from "react-router-dom";

import { lazy, Suspense } from "react";
const Home = lazy(() => import("./pages/Home"));
const Menu = lazy(() => import("./pages/Menu"));
const Orders = lazy(() => import("./pages/Orders"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const CartPage = lazy(() => import("./pages/CartPage"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const AdminOrders = lazy(() => import("./pages/AdminOrders"));
const AdminFoods = lazy(() => import("./pages/AdminFoods"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const GroupBite = lazy(() => import("./components/GroupBite"));
const PickupBoard = lazy(() => import("./pages/PickupBoard"));
const Rewards = lazy(() => import("./pages/Rewards"));
const Favourites = lazy(() => import("./pages/SavedBites"));
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import BackToTop from "./components/BackToTop";

import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { AnimatePresence, motion } from "motion/react";
import { useLocation } from "react-router-dom";
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <>
      <Navbar />

      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          <Suspense fallback={<div className="page-loading">Loading...</div>}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rewards"
              element={
                <ProtectedRoute>
                  <Rewards />
                </ProtectedRoute>
              }
            />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/favourites" element={<Favourites />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route
              path="/admin/orders"
              element={<AdminRoute><AdminOrders /></AdminRoute>}
            />
            <Route
              path="/admin/foods"
              element={<AdminRoute><AdminFoods /></AdminRoute>}
            />
            <Route
              path="/admin/analytics"
              element={<AdminRoute><AdminAnalytics /></AdminRoute>}
            />
            <Route path="/groupbite" element={<GroupBite />} />
            <Route path="/pickup-board" element={<PickupBoard />} />
          </Routes>
        </Suspense>
        </motion.div>
      </AnimatePresence>
      <BackToTop />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;