import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Store, Package, TrendingUp, ClipboardCheck, ShoppingCart, BarChart3, MapPin, Locate, MessageSquare, Star, Home, User, Phone, FileText, Pencil, X, Plus, Upload, Camera } from "lucide-react";
import VendorProfileCard from "@/components/VendorProfileCard";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";

const VendorDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [savingLoc, setSavingLoc] = useState(false);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);

  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ["vendor-profile-loc", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("latitude, longitude, shop_address, full_name, phone, shop_name, gst_number, approval_status, avatar_url")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const saveShopLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not supported, use manual entry", variant: "destructive" });
      return;
    }
    setSavingLoc(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { error } = await supabase
          .from("profiles")
          .update({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
          .eq("user_id", user!.id);
        setSavingLoc(false);
        if (error) {
          toast({ title: "Error saving location", variant: "destructive" });
        } else {
          toast({ title: "📍 Shop location saved!" });
          refetchProfile();
        }
      },
      () => {
        setSavingLoc(false);
        toast({ title: "Location access denied — use manual entry below", variant: "destructive" });
      },
      { enableHighAccuracy: true }
    );
  };

  const saveManualLocation = async () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast({ title: "Invalid coordinates", description: "Latitude: -90 to 90, Longitude: -180 to 180", variant: "destructive" });
      return;
    }
    setSavingLoc(true);
    const { error } = await supabase
      .from("profiles")
      .update({ latitude: lat, longitude: lng })
      .eq("user_id", user!.id);
    setSavingLoc(false);
    if (error) {
      toast({ title: "Error saving location", variant: "destructive" });
    } else {
      toast({ title: "📍 Shop location saved!" });
      setManualLat("");
      setManualLng("");
      refetchProfile();
    }
  };

  const saveShopAddress = async () => {
    if (!shopAddress.trim()) {
      toast({ title: "Please enter your shop address", variant: "destructive" });
      return;
    }
    setSavingAddress(true);
    const { error } = await supabase
      .from("profiles")
      .update({ shop_address: shopAddress.trim() })
      .eq("user_id", user!.id);
    setSavingAddress(false);
    if (error) {
      toast({ title: "Error saving address", variant: "destructive" });
    } else {
      toast({ title: "🏠 Shop address saved!" });
      setShopAddress("");
      refetchProfile();
    }
  };

  const { data: productCount = 0 } = useQuery({
    queryKey: ["vendor-dash-products", user?.id],
    queryFn: async () => {
      const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("vendor_id", user!.id);
      return count || 0;
    },
    enabled: !!user,
  });

  const { data: todayOrders = 0 } = useQuery({
    queryKey: ["vendor-dash-orders", user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("vendor_id", user!.id)
        .gte("created_at", today);
      return count || 0;
    },
    enabled: !!user,
  });

  const { data: weekRevenue = 0 } = useQuery({
    queryKey: ["vendor-dash-revenue", user?.id],
    queryFn: async () => {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const { data } = await supabase
        .from("orders")
        .select("total")
        .eq("vendor_id", user!.id)
        .eq("status", "delivered")
        .gte("created_at", weekAgo);
      return data?.reduce((s, o) => s + Number(o.total), 0) || 0;
    },
    enabled: !!user,
  });

  // Fetch recent feedback
  const { data: recentFeedback = [] } = useQuery({
    queryKey: ["vendor-feedback", user?.id],
    queryFn: async () => {
      // Get order IDs for this vendor
      const { data: orders } = await supabase
        .from("orders")
        .select("id")
        .eq("vendor_id", user!.id);
      if (!orders || orders.length === 0) return [];
      const orderIds = orders.map(o => o.id);
      const { data } = await supabase
        .from("order_feedback")
        .select("*")
        .in("order_id", orderIds)
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!user,
  });

  const stats = [
    { label: "Products Listed", value: String(productCount), icon: Store },
    { label: "Orders Today", value: String(todayOrders), icon: Package },
    { label: "Revenue (Week)", value: `₹${weekRevenue.toFixed(0)}`, icon: TrendingUp },
  ];

  const quickLinks = [
    { to: "/vendor/products", label: "Manage Products", icon: ShoppingCart, desc: "Add, edit, or remove products" },
    { to: "/vendor/stock", label: "Daily Stock Update", icon: ClipboardCheck, desc: "Update today's available quantities" },
    { to: "/vendor/orders", label: "View Orders", icon: Package, desc: "Accept or reject incoming orders" },
    { to: "/vendor/sales", label: "Sales Summary", icon: BarChart3, desc: "Track revenue and analytics" },
    { to: "/vendor/feedback", label: "Customer Feedback", icon: MessageSquare, desc: "View ratings and fault reports" },
  ];

  return (
    <Layout>
      <section className="container py-20 md:py-28">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Vendor Dashboard</h1>
          <p className="text-muted-foreground">Welcome, {profile?.full_name || user?.user_metadata?.full_name || "Vendor"}. Manage your shop here.</p>
        </motion.div>

        {/* Profile Card */}
        <VendorProfileCard profile={profile} user={user} refetchProfile={refetchProfile} toast={toast} />

        {/* Shop Location Banner */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
          <Card className={profile?.latitude ? "border-primary/20" : "border-destructive/30 bg-destructive/5"}>
            <CardContent className="pt-5 pb-5 flex items-center gap-4">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${profile?.latitude ? "bg-primary/10" : "bg-destructive/10"}`}>
                <MapPin className={`h-5 w-5 ${profile?.latitude ? "text-primary" : "text-destructive"}`} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">
                  {profile?.latitude ? "Shop location is set ✓" : "Shop location not set"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {profile?.latitude ? "Riders can navigate to your shop for pickups" : "Set your location so riders can find your shop"}
                </p>
              </div>
              <Button size="sm" variant={profile?.latitude ? "outline" : "default"} className="gap-1 shrink-0" onClick={saveShopLocation} disabled={savingLoc}>
                <Locate className={`h-3.5 w-3.5 ${savingLoc ? "animate-spin" : ""}`} />
                {savingLoc ? "Saving..." : profile?.latitude ? "Update" : "Auto Detect"}
              </Button>
            </CardContent>
            {/* Manual entry */}
            <div className="px-6 pb-5 pt-0">
              <p className="text-xs text-muted-foreground mb-2">Or enter coordinates manually:</p>
              <div className="flex gap-2">
                <Input type="number" step="any" placeholder="Latitude" value={manualLat} onChange={(e) => setManualLat(e.target.value)} className="text-sm" />
                <Input type="number" step="any" placeholder="Longitude" value={manualLng} onChange={(e) => setManualLng(e.target.value)} className="text-sm" />
                <Button size="sm" onClick={saveManualLocation} disabled={savingLoc || !manualLat || !manualLng}>
                  Save
                </Button>
              </div>
              {profile?.latitude && profile?.longitude && (
                <p className="text-xs text-muted-foreground mt-2">Current: {profile.latitude.toFixed(5)}, {profile.longitude.toFixed(5)}</p>
              )}
            </div>
            {/* Shop Address */}
            <div className="px-6 pb-5 pt-0 border-t border-border mt-0 pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Home className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground font-medium">Shop address (typed):</p>
              </div>
              {profile?.shop_address && (
                <p className="text-sm text-foreground mb-2 bg-muted/50 rounded-md px-3 py-2">{profile.shop_address}</p>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. 42, MG Road, Indiranagar, Bangalore 560038"
                  value={shopAddress}
                  onChange={(e) => setShopAddress(e.target.value)}
                  className="text-sm"
                  maxLength={300}
                />
                <Button size="sm" onClick={saveShopAddress} disabled={savingAddress || !shopAddress.trim()}>
                  {savingAddress ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card>
                <CardContent className="pt-6 text-center">
                  <s.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-display font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickLinks.map((link, i) => (
            <motion.div key={link.to} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
              <Link to={link.to}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="pt-6 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <link.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{link.label}</p>
                      <p className="text-sm text-muted-foreground">{link.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Customer Feedback Section */}
        {recentFeedback.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="mt-8">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" /> Customer Feedback
            </h2>
            <div className="space-y-3">
              {recentFeedback.map((fb: any) => (
                <Card key={fb.id} className={fb.has_fault ? "border-destructive/30" : ""}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`h-3.5 w-3.5 ${s <= fb.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/20"}`} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">#{fb.order_id.slice(0, 8)}</span>
                      <span className="text-xs text-muted-foreground">{new Date(fb.created_at).toLocaleDateString()}</span>
                      {fb.has_fault && (
                        <span className="text-xs text-destructive font-medium flex items-center gap-1">⚠️ Fault reported</span>
                      )}
                    </div>
                    {fb.product_feedback && <p className="text-sm mb-1"><span className="font-medium text-xs text-muted-foreground">Product:</span> {fb.product_feedback}</p>}
                    {fb.delivery_feedback && <p className="text-sm mb-1"><span className="font-medium text-xs text-muted-foreground">Delivery:</span> {fb.delivery_feedback}</p>}
                    {fb.has_fault && fb.fault_description && (
                      <div className="mt-2 p-2 rounded bg-destructive/10 border border-destructive/20">
                        <p className="text-sm text-destructive"><span className="font-medium">Fault:</span> {fb.fault_description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </section>
    </Layout>
  );
};

export default VendorDashboard;
