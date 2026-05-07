import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ShoppingCart, Minus, Plus, Trash2, ImageIcon, MapPin, Locate, CreditCard, Banknote } from "lucide-react";
import { useState, useEffect } from "react";

const COUNTABLE_UNITS = ["piece", "packet", "bottle", "tube", "bar", "dozen", "bundle", "box", "can", "pair"];
const isCountable = (unit: string) => COUNTABLE_UNITS.includes(unit);
const getStep = (unit: string) => isCountable(unit) ? 1 : 0.5;
const formatQty = (qty: number, unit: string) => isCountable(unit) ? qty : qty % 1 === 0 ? qty : qty.toFixed(1);

const CustomerCart = () => {
  const { items, updateQuantity, removeItem, clearCart, total } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [placing, setPlacing] = useState(false);
  const [customerLat, setCustomerLat] = useState<number | null>(null);
  const [customerLng, setCustomerLng] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("cod");

  // Fetch saved profile address
  const { data: profile } = useQuery({
    queryKey: ["customer-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("shop_address, latitude, longitude")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Auto-fill from saved profile
  useEffect(() => {
    if (profile) {
      if (profile.shop_address && !address) setAddress(profile.shop_address);
      if (profile.latitude && !customerLat) setCustomerLat(profile.latitude);
      if (profile.longitude && !customerLng) setCustomerLng(profile.longitude);
    }
  }, [profile]);

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not supported", variant: "destructive" });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCustomerLat(pos.coords.latitude);
        setCustomerLng(pos.coords.longitude);
        setLocating(false);
        toast({ title: "📍 Location captured!" });
      },
      () => {
        setLocating(false);
        toast({ title: "Location access denied", description: "Please enable location access and try again", variant: "destructive" });
      },
      { enableHighAccuracy: true }
    );
  };

  const placeOrder = async () => {
    if (!user || items.length === 0) return;
    if (!address.trim()) {
      toast({ title: "Please enter delivery address", variant: "destructive" });
      return;
    }
    if (!customerLat || !customerLng) {
      toast({ title: "Please share your location", description: "Tap 'Use My Location' so the rider can navigate to you", variant: "destructive" });
      return;
    }
    setPlacing(true);

    try {
      const byVendor: Record<string, typeof items> = {};
      items.forEach((item) => {
        if (!byVendor[item.vendor_id]) byVendor[item.vendor_id] = [];
        byVendor[item.vendor_id].push(item);
      });

      for (const [vendor_id, vendorItems] of Object.entries(byVendor)) {
        const orderTotal = vendorItems.reduce((s, i) => s + i.price * i.quantity, 0);
        const { data: order, error: orderErr } = await supabase
          .from("orders")
          .insert({
            customer_id: user.id,
            vendor_id,
            total: orderTotal,
            delivery_address: address.trim(),
            status: "pending",
            customer_lat: customerLat,
            customer_lng: customerLng,
            payment_method: paymentMethod,
          } as any)
          .select("id")
          .single();
        if (orderErr) throw orderErr;

        const orderItems = vendorItems.map((i) => ({
          order_id: order.id,
          product_id: i.product_id,
          quantity: i.quantity,
          price: i.price,
        }));
        const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
        if (itemsErr) throw itemsErr;
      }

      clearCart();
      toast({ title: "Order placed successfully!" });
      navigate("/customer/orders");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setPlacing(false);
    }
  };

  return (
    <Layout>
      <section className="container py-20 md:py-28 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Cart</h1>
          <p className="text-muted-foreground">{items.length} item{items.length !== 1 ? "s" : ""} in cart</p>
        </motion.div>

        {items.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground py-16">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">Cart is empty</p>
              <Button variant="link" onClick={() => navigate("/customer/shop")} className="mt-2">Browse products</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.product_id}>
                <CardContent className="pt-4 pb-4 flex items-center gap-4">
                  <div className="h-14 w-14 rounded bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {item.photo_url ? (
                      <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">₹{item.price} / {item.unit}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.product_id, item.quantity - getStep(item.unit))}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{formatQty(item.quantity, item.unit)}</span>
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.product_id, item.quantity + getStep(item.unit))}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.unit}</p>
                  <p className="font-medium text-sm w-16 text-right">₹{(item.price * item.quantity).toFixed(0)}</p>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeItem(item.product_id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}

            <Card>
              <CardHeader><CardTitle className="text-lg">Delivery Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Delivery Address</Label>
                  <Textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your full delivery address"
                    maxLength={500}
                    required
                  />
                  {profile?.shop_address && (
                    <p className="text-[11px] text-muted-foreground mt-1">📍 Auto-filled from your saved profile</p>
                  )}
                </div>

                <div>
                  <Label>Your Location</Label>
                  <div className="mt-1.5 space-y-2">
                    <Button variant="outline" className="w-full gap-2" onClick={getLocation} disabled={locating}>
                      <Locate className={`h-4 w-4 ${locating ? "animate-spin" : ""}`} />
                      {locating ? "Getting location..." : customerLat ? "📍 Update My Location" : "📍 Use My Location"}
                    </Button>
                    {customerLat && customerLng && (
                      <div className="flex items-center gap-2 p-2 rounded-md bg-primary/10 border border-primary/20">
                        <MapPin className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-xs text-primary font-medium">GPS: {customerLat.toFixed(5)}, {customerLng.toFixed(5)} ✓</span>
                      </div>
                    )}
                    <p className="text-[11px] text-muted-foreground">Or enter coordinates manually:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="number" step="any" placeholder="Latitude" value={customerLat ?? ""} onChange={(e) => setCustomerLat(e.target.value ? parseFloat(e.target.value) : null)} />
                      <Input type="number" step="any" placeholder="Longitude" value={customerLng ?? ""} onChange={(e) => setCustomerLng(e.target.value ? parseFloat(e.target.value) : null)} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Payment Method</CardTitle></CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                  <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${paymentMethod === "cod" ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:border-muted-foreground/30"}`}>
                    <RadioGroupItem value="cod" />
                    <Banknote className="h-5 w-5 text-green-600 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Cash on Delivery</p>
                      <p className="text-xs text-muted-foreground">Pay when your order arrives</p>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${paymentMethod === "online" ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:border-muted-foreground/30"}`}>
                    <RadioGroupItem value="online" />
                    <CreditCard className="h-5 w-5 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Online Payment</p>
                      <p className="text-xs text-muted-foreground">Pay via UPI, card, or net banking</p>
                    </div>
                  </label>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <span className="font-medium">Total</span>
                  <span className="text-xl font-display font-bold">₹{total.toFixed(0)}</span>
                </div>
                <div className="flex items-center justify-between pt-3 pb-1 text-sm text-muted-foreground">
                  <span>Payment</span>
                  <span className="font-medium text-foreground">{paymentMethod === "cod" ? "💵 Cash on Delivery" : "💳 Online Payment"}</span>
                </div>
                <Button className="w-full mt-4" size="lg" onClick={placeOrder} disabled={placing}>
                  {placing ? "Placing Order..." : "Place Order"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </section>
    </Layout>
  );
};

export default CustomerCart;
