import { BrowserRouter, Routes, Route } from "react-router-dom";


import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import Orders from "./pages/Orders";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CartPage from "./pages/CartPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import OrderSuccess from "./pages/OrderSuccess";
import AdminOrders from "./pages/AdminOrders";
import AdminFoods from "./pages/AdminFoods";
import AdminAnalytics from "./pages/AdminAnalytics";
import GroupBite from "./components/GroupBite";
import PickupBoard from "./pages/PickupBoard";
import Rewards from "./pages/Rewards";
import Favourites from "./pages/SavedBites";
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