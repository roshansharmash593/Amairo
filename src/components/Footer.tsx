import { Link } from "react-router-dom";
import { Truck, Mail, Phone, MapPin, Rocket, Calendar } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container py-16">
        {/* Top tagline */}
        <div className="mb-12 pb-8 border-b border-background/10">
          <div className="flex items-center gap-2 font-display text-2xl font-bold mb-2">
            <Truck className="h-6 w-6" />
            Amairo
          </div>
          <p className="text-sm opacity-70 max-w-md leading-relaxed">
            Delivering happiness across Bangalore in 3 hours or less. Launching July 2026.
          </p>
          <span className="inline-block mt-3 px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-accent/20 text-accent">
            Bangalore Exclusive
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
          {/* Company */}
          <div>
            <h4 className="font-display font-semibold mb-4 text-sm uppercase tracking-wider opacity-60">Company</h4>
            <div className="flex flex-col gap-2">
              {[
                { to: "/about", label: "Our Mission" },
                { to: "/about", label: "Ecosystem" },
                { to: "/about", label: "Leadership" },
                { to: "/stats", label: "Products" },
                { to: "/about", label: "Bangalore Areas" },
              ].map((link, i) => (
                <Link key={i} to={link.to} className="text-sm opacity-70 hover:opacity-100 transition-opacity">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* For You */}
          <div>
            <h4 className="font-display font-semibold mb-4 text-sm uppercase tracking-wider opacity-60">For You</h4>
            <div className="flex flex-col gap-2">
              {[
                { to: "/login", label: "Customer App" },
                { to: "/login", label: "Vendor App" },
                { to: "/login", label: "Rider App" },
                { to: "/contact", label: "Join Waitlist" },
              ].map((link, i) => (
                <Link key={i} to={link.to} className="text-sm opacity-70 hover:opacity-100 transition-opacity">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold mb-4 text-sm uppercase tracking-wider opacity-60">Contact</h4>
            <div className="flex flex-col gap-3 text-sm opacity-70">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                hello@amairo.in
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                +91 98765 43210
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" />
                Bangalore, India
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0" />
                Launch: July 2026
              </div>
            </div>
          </div>

          {/* Launch Banner */}
          <div className="flex flex-col justify-between">
            <div className="p-5 rounded-xl bg-primary/15 border border-primary/20">
              <Rocket className="h-5 w-5 text-primary mb-2" />
              <p className="font-display font-bold text-sm text-primary">Launching exclusively in Bangalore</p>
              <p className="text-xs opacity-70 mt-1">July 2026 — be the first to experience Amairo.</p>
            </div>
          </div>
        </div>

        <div className="border-t border-background/10 mt-12 pt-8 text-center text-sm opacity-50">
          <p>© 2025 Amairo Technologies Pvt. Ltd. All rights reserved.</p>
          <p className="mt-1 text-xs">Currently in development phase. Launching exclusively in Bangalore in July 2026.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
