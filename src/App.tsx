import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import About from "./pages/About";
import Stats from "./pages/Stats";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminVendors from "./pages/admin/AdminVendors";
import AdminRiders from "./pages/admin/AdminRiders";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminMessages from "./pages/admin/AdminMessages";
import VendorDashboard from "./pages/vendor/VendorDashboard";
import VendorProducts from "./pages/vendor/VendorProducts";
import VendorStockUpdate from "./pages/vendor/VendorStockUpdate";
import VendorOrders from "./pages/vendor/VendorOrders";
import VendorSales from "./pages/vendor/VendorSales";
import VendorFeedback from "./pages/vendor/VendorFeedback";
import AdminFeedback from "./pages/admin/AdminFeedback";
import RiderDashboard from "./pages/rider/RiderDashboard";
import RiderDeliveries from "./pages/rider/RiderDeliveries";
import RiderEarnings from "./pages/rider/RiderEarnings";
import CustomerShop from "./pages/customer/CustomerShop";
import CustomerCart from "./pages/customer/CustomerCart";
import CustomerOrders from "./pages/customer/CustomerOrders";
import CustomerProfile from "./pages/customer/CustomerProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />

              {/* Admin */}
              <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/vendors" element={<ProtectedRoute requiredRole="admin"><AdminVendors /></ProtectedRoute>} />
              <Route path="/admin/riders" element={<ProtectedRoute requiredRole="admin"><AdminRiders /></ProtectedRoute>} />
              <Route path="/admin/orders" element={<ProtectedRoute requiredRole="admin"><AdminOrders /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin"><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/messages" element={<ProtectedRoute requiredRole="admin"><AdminMessages /></ProtectedRoute>} />
              <Route path="/admin/feedback" element={<ProtectedRoute requiredRole="admin"><AdminFeedback /></ProtectedRoute>} />

              {/* Vendor */}
              <Route path="/vendor" element={<ProtectedRoute requiredRole="vendor"><VendorDashboard /></ProtectedRoute>} />
              <Route path="/vendor/products" element={<ProtectedRoute requiredRole="vendor"><VendorProducts /></ProtectedRoute>} />
              <Route path="/vendor/stock" element={<ProtectedRoute requiredRole="vendor"><VendorStockUpdate /></ProtectedRoute>} />
              <Route path="/vendor/orders" element={<ProtectedRoute requiredRole="vendor"><VendorOrders /></ProtectedRoute>} />
              <Route path="/vendor/sales" element={<ProtectedRoute requiredRole="vendor"><VendorSales /></ProtectedRoute>} />
              <Route path="/vendor/feedback" element={<ProtectedRoute requiredRole="vendor"><VendorFeedback /></ProtectedRoute>} />

              {/* Rider */}
              <Route path="/rider" element={<ProtectedRoute requiredRole="rider"><RiderDashboard /></ProtectedRoute>} />
              <Route path="/rider/deliveries" element={<ProtectedRoute requiredRole="rider"><RiderDeliveries /></ProtectedRoute>} />
              <Route path="/rider/earnings" element={<ProtectedRoute requiredRole="rider"><RiderEarnings /></ProtectedRoute>} />

              {/* Customer */}
              <Route path="/customer/shop" element={<ProtectedRoute requiredRole="customer"><CustomerShop /></ProtectedRoute>} />
              <Route path="/customer/cart" element={<ProtectedRoute requiredRole="customer"><CustomerCart /></ProtectedRoute>} />
              <Route path="/customer/orders" element={<ProtectedRoute requiredRole="customer"><CustomerOrders /></ProtectedRoute>} />
              <Route path="/customer/profile" element={<ProtectedRoute requiredRole="customer"><CustomerProfile /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
