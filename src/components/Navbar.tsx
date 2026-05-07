import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Truck, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const publicLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/stats", label: "Stats" },
  { to: "/contact", label: "Contact" },
];

const adminLinks = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/vendors", label: "Vendors" },
  { to: "/admin/riders", label: "Riders" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/users", label: "Users" },
];

const vendorLinks = [
  { to: "/vendor", label: "Dashboard" },
  { to: "/vendor/products", label: "Products" },
  { to: "/vendor/stock", label: "Stock Update" },
  { to: "/vendor/orders", label: "Orders" },
  { to: "/vendor/sales", label: "Sales" },
];

const riderLinks = [
  { to: "/rider", label: "Dashboard" },
  { to: "/rider/deliveries", label: "Deliveries" },
  { to: "/rider/earnings", label: "Earnings" },
];

const customerLinks = [
  { to: "/customer/shop", label: "Shop" },
  { to: "/customer/cart", label: "Cart" },
  { to: "/customer/orders", label: "My Orders" },
  { to: "/customer/profile", label: "Profile" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user, role, signOut } = useAuth();

  // Determine which nav links to show
  let navLinks = publicLinks;
  if (role === "admin") {
    navLinks = [...publicLinks, ...adminLinks];
  } else if (role === "vendor") {
    navLinks = vendorLinks;
  } else if (role === "rider") {
    navLinks = riderLinks;
  } else if (role === "customer") {
    navLinks = customerLinks;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container flex items-center justify-between h-16">
        <Link to={role === "vendor" ? "/vendor" : role === "rider" ? "/rider" : role === "customer" ? "/customer/shop" : "/"} className="flex items-center gap-2 font-display text-xl font-bold text-primary">
          <Truck className="h-6 w-6" />
          Amairo
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                location.pathname === link.to
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <Button size="sm" variant="ghost" onClick={signOut} className="ml-2 gap-1">
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </Button>
          ) : (
            <Link to="/login">
              <Button size="sm" className="ml-2">Login</Button>
            </Link>
          )}
        </div>

        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background pb-4">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className={cn(
                "block px-6 py-3 text-sm font-medium transition-colors",
                location.pathname === link.to
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="px-6 pt-2 space-y-2">
            {user ? (
              <Button size="sm" variant="ghost" onClick={() => { signOut(); setOpen(false); }} className="w-full gap-1">
                <LogOut className="h-3.5 w-3.5" /> Logout
              </Button>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)}>
                <Button size="sm" className="w-full">Login</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
