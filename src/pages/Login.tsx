import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { LogIn, UserPlus, Truck, ShoppingBag, MapPin, Star, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const roles: { value: AppRole; label: string; desc: string }[] = [
  { value: "customer", label: "Customer", desc: "Browse & order products" },
  { value: "vendor", label: "Vendor", desc: "Manage your shop inventory" },
  { value: "rider", label: "Rider", desc: "Deliver orders & earn" },
];

const Login = () => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole>("customer");

  const [shopName, setShopName] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [dlNumber, setDlNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [vehicleDetails, setVehicleDetails] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Login Failed", description: error.message, variant: "destructive" });
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("approval_status")
            .eq("user_id", user.id)
            .single();

          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .single();

          if (roleData && (roleData.role === "vendor" || roleData.role === "rider") && profile?.approval_status !== "approved") {
            await supabase.auth.signOut();
            const statusMsg = profile?.approval_status === "rejected"
              ? "Your application has been rejected. Please contact support."
              : "Your account is pending admin approval. You'll be able to sign in once approved.";
            toast({ title: "Access Pending", description: statusMsg, variant: "destructive" });
            setLoading(false);
            return;
          }
        }

        toast({ title: "Welcome back!" });
        navigate("/");
      }
    } else {
      const metadata: Record<string, string> = {
        full_name: fullName,
        role: selectedRole,
        phone,
      };
      if (selectedRole === "vendor") {
        metadata.shop_name = shopName;
        metadata.gst_number = gstNumber;
      }
      if (selectedRole === "rider") {
        metadata.dl_number = dlNumber;
        metadata.pan_number = panNumber;
        metadata.vehicle_details = vehicleDetails;
      }

      const { error } = await signUp(email, password, fullName, selectedRole, metadata);
      if (error) {
        toast({ title: "Sign Up Failed", description: error.message, variant: "destructive" });
      } else {
        await supabase.auth.signOut();
        const msg = (selectedRole === "vendor" || selectedRole === "rider")
          ? "Your application has been submitted! Admin will review and approve your account."
          : "You can now sign in.";
        toast({ title: "Account Created!", description: msg });
        setIsLogin(true);
        setEmail("");
        setPassword("");
        setFullName("");
        setPhone("");
        setShopName("");
        setGstNumber("");
        setDlNumber("");
        setPanNumber("");
        setVehicleDetails("");
      }
    }
    setLoading(false);
  };

  const features = [
    { icon: ShoppingBag, title: "Fresh Products", desc: "Browse local vendors and order fresh products delivered to your door" },
    { icon: Truck, title: "Fast Delivery", desc: "Real-time tracking with dedicated riders ensuring quick delivery" },
    { icon: MapPin, title: "Location Aware", desc: "Find nearest vendors and get accurate delivery estimates" },
    { icon: Star, title: "Quality Assured", desc: "Rate products & delivery, report faults — vendors stay accountable" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary">
        {/* Decorative shapes */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-primary-foreground/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-foreground/5 rounded-full" />
          <div className="absolute top-1/3 right-0 w-48 h-48 bg-primary-foreground/10 rounded-full translate-x-1/2" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-primary-foreground/5 rounded-full translate-y-1/2" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 w-full">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl xl:text-5xl font-display font-bold text-primary-foreground leading-tight">
              Amairo
            </h1>
            <p className="mt-4 text-primary-foreground/70 text-lg max-w-md font-body">
              Everything you need, one place. Connecting local vendors, reliable riders, and happy customers.
            </p>
          </motion.div>

          <div className="mt-12 space-y-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-foreground/15 flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-primary-foreground font-semibold font-display text-sm">{f.title}</h3>
                  <p className="text-primary-foreground/60 text-sm mt-0.5 font-body">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-16 flex items-center gap-3 text-primary-foreground/50 text-sm font-body"
          >
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="w-8 h-8 rounded-full bg-primary-foreground/20 border-2 border-primary flex items-center justify-center text-xs text-primary-foreground/70 font-semibold">
                  {String.fromCharCode(64 + n)}
                </div>
              ))}
            </div>
            <span>Join 500+ users already on the platform</span>
          </motion.div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden px-6 py-4 border-b border-border">
          <h2 className="text-xl font-display font-bold text-foreground">Amairo</h2>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10 overflow-y-auto bg-background">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-display font-bold text-foreground">
                {isLogin ? "Welcome Back" : "Create Account"}
              </h2>
              <p className="text-muted-foreground text-sm mt-1 font-body">
                {isLogin ? "Sign in to your account" : "Join Amairo"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullname">Full Name</Label>
                    <Input id="fullname" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" required maxLength={100} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" required maxLength={15} />
                  </div>
                  <div className="space-y-2">
                    <Label>I want to join as</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {roles.map((r) => (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setSelectedRole(r.value)}
                          className={`p-3 rounded-lg border-2 text-center transition-all ${
                            selectedRole === r.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-muted-foreground/30"
                          }`}
                        >
                          <div className="font-semibold text-sm text-foreground">{r.label}</div>
                          <div className="text-xs text-muted-foreground mt-1">{r.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedRole === "vendor" && (
                    <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
                      <p className="text-sm font-medium text-muted-foreground">Vendor Verification Documents</p>
                      <div className="space-y-2">
                        <Label htmlFor="shopName">Shop Name</Label>
                        <Input id="shopName" value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="Your shop name" required maxLength={100} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gstNumber">GST Number</Label>
                        <Input id="gstNumber" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} placeholder="e.g. 29ABCDE1234F1Z5" required maxLength={15} />
                      </div>
                    </div>
                  )}

                  {selectedRole === "rider" && (
                    <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
                      <p className="text-sm font-medium text-muted-foreground">Rider Verification Documents</p>
                      <div className="space-y-2">
                        <Label htmlFor="dlNumber">Driving Licence Number</Label>
                        <Input id="dlNumber" value={dlNumber} onChange={(e) => setDlNumber(e.target.value)} placeholder="e.g. KA-0120190001234" required maxLength={20} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="panNumber">PAN Card Number</Label>
                        <Input id="panNumber" value={panNumber} onChange={(e) => setPanNumber(e.target.value)} placeholder="e.g. ABCDE1234F" required maxLength={10} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vehicleDetails">Vehicle Details</Label>
                        <Input id="vehicleDetails" value={vehicleDetails} onChange={(e) => setVehicleDetails(e.target.value)} placeholder="e.g. Honda Activa EV - KA01AB1234" required maxLength={100} />
                      </div>
                    </div>
                  )}
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required maxLength={255} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {isLogin ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {loading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground font-body">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-medium hover:underline">
                {isLogin ? "Sign Up" : "Sign In"}
              </button>
            </div>

            {/* Mobile features */}
            <div className="lg:hidden mt-10 pt-8 border-t border-border">
              <div className="grid grid-cols-2 gap-4">
                {features.map((f) => (
                  <div key={f.title} className="flex items-start gap-2">
                    <f.icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">{f.title}</p>
                      <p className="text-xs text-muted-foreground">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;
