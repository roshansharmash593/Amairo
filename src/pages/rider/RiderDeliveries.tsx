import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Package, MapPin, CheckCircle, Truck, Navigation, Store, User, Locate, Copy } from "lucide-react";
import { useEffect, useState, useCallback } from "react";

const statusFlow: Record<string, { next: string; label: string; icon: any }> = {
  dispatched: { next: "picked_up", label: "Mark Picked Up", icon: Package },
  picked_up: { next: "delivered", label: "Mark Delivered", icon: CheckCircle },
};

const RiderDeliveries = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [riderLat, setRiderLat] = useState<number | null>(null);
  const [riderLng, setRiderLng] = useState<number | null>(null);

  // Auto-detect rider's current location
  const refreshRiderLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setRiderLat(pos.coords.latitude);
        setRiderLng(pos.coords.longitude);
      },
      () => {},
      { enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => {
    refreshRiderLocation();
    const interval = setInterval(refreshRiderLocation, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [refreshRiderLocation]);
  const { data: deliveries = [], isLoading } = useQuery({
    queryKey: ["rider-deliveries", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, products(name, unit))")
        .eq("rider_id", user!.id)
        .in("status", ["dispatched", "picked_up", "delivered"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch vendor profiles for location
  const vendorIds = [...new Set(deliveries.map((d: any) => d.vendor_id))];
  const { data: vendorProfiles = [] } = useQuery({
    queryKey: ["vendor-profiles", vendorIds],
    queryFn: async () => {
      if (vendorIds.length === 0) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, shop_name, latitude, longitude, phone")
        .in("user_id", vendorIds);
      if (error) throw error;
      return data;
    },
    enabled: vendorIds.length > 0,
  });

  const vendorMap = Object.fromEntries(vendorProfiles.map((v: any) => [v.user_id, v]));

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("rider-deliveries-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `rider_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["rider-deliveries"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["rider-deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["rider-dash"] });
      toast({ title: `Order ${status.replace("_", " ")}` });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openNavigation = (destLat: number, destLng: number) => {
    // Use geo: URI which works on all devices and opens native map apps
    // Falls back to intent-based URLs that won't be blocked by iframe
    const origin = riderLat && riderLng ? `${riderLat},${riderLng}` : "";
    
    // Try multiple approaches for navigation
    const googleMapsApp = `https://maps.google.com/maps?daddr=${destLat},${destLng}${origin ? `&saddr=${origin}` : ""}`;
    const geoUri = `geo:${destLat},${destLng}?q=${destLat},${destLng}`;
    
    // Open in new tab - maps.google.com works better than www.google.com in iframes
    const newWindow = window.open(googleMapsApp, "_blank");
    if (!newWindow) {
      // Fallback: try geo URI (works on mobile)
      window.location.href = geoUri;
    }
  };

  const copyLocation = (lat: number, lng: number, label: string) => {
    navigator.clipboard.writeText(`${lat}, ${lng}`).then(() => {
      toast({ title: `📋 ${label} coordinates copied!`, description: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
    });
  };

  const active = deliveries.filter((d: any) => d.status !== "delivered");
  const completed = deliveries.filter((d: any) => d.status === "delivered");

  return (
    <Layout>
      <section className="container py-20 md:py-28">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Deliveries</h1>
          <p className="text-muted-foreground">Manage your active and completed deliveries</p>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <div className={`h-2 w-2 rounded-full ${riderLat ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-muted-foreground">
              {riderLat && riderLng
                ? `Your GPS active (${riderLat.toFixed(4)}, ${riderLng.toFixed(4)})`
                : "GPS not available — enable location for navigation"}
            </span>
            <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={refreshRiderLocation}>
              <Locate className="h-3 w-3 mr-1" /> Refresh
            </Button>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary" /></div>
        ) : deliveries.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground py-16">
              <Truck className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No deliveries assigned yet</p>
              <p className="text-sm mt-1">New delivery assignments will appear here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {active.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-secondary" /> Active ({active.length})
                </h2>
                <div className="space-y-4">
                  {active.map((o: any) => {
                    const action = statusFlow[o.status];
                    const vendor = vendorMap[o.vendor_id];
                    const hasVendorLoc = vendor?.latitude && vendor?.longitude;
                    const hasCustomerLoc = o.customer_lat && o.customer_lng;

                    return (
                      <Card key={o.id} className="border-secondary/30">
                        <CardContent className="pt-5 space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</span>
                                <Badge variant="default">{o.status.replace("_", " ")}</Badge>
                              </div>
                              <div className="text-sm space-y-0.5 mb-2">
                                {o.order_items?.map((item: any) => (
                                  <div key={item.id}>{item.products?.name} × {item.quantity} {item.products?.unit}</div>
                                ))}
                              </div>
                              <p className="font-medium mt-2">₹{Number(o.total).toFixed(2)}</p>
                            </div>
                            {action && (
                              <Button size="sm" className="gap-1 shrink-0" onClick={() => updateStatus.mutate({ id: o.id, status: action.next })}>
                                <action.icon className="h-3.5 w-3.5" /> {action.label}
                              </Button>
                            )}
                          </div>

                          {/* Navigation Section */}
                          <div className="border-t border-border pt-3 space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Navigation</p>
                            
                            {/* Step 1: Go to vendor */}
                            <div className={`flex items-center gap-3 p-3 rounded-lg ${o.status === "dispatched" ? "bg-primary/10 border border-primary/20" : "bg-muted/50"}`}>
                              <Store className="h-5 w-5 text-primary shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">
                                  {o.status === "dispatched" ? "① Go to Vendor" : "✓ Picked up from vendor"}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {vendor?.shop_name || vendor?.full_name || "Vendor"}
                                  {vendor?.phone && ` • ${vendor.phone}`}
                                </p>
                              </div>
                              {hasVendorLoc && o.status === "dispatched" && (
                                <div className="flex gap-1 shrink-0">
                                  <Button size="sm" variant="default" className="gap-1" onClick={() => openNavigation(vendor.latitude, vendor.longitude)}>
                                    <Navigation className="h-3.5 w-3.5" /> Navigate
                                  </Button>
                                  <Button size="sm" variant="outline" className="px-2" onClick={() => copyLocation(vendor.latitude, vendor.longitude, "Vendor")}>
                                    <Copy className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              )}
                            </div>

                            {/* Step 2: Go to customer */}
                            <div className={`flex items-center gap-3 p-3 rounded-lg ${o.status === "picked_up" ? "bg-primary/10 border border-primary/20" : "bg-muted/50"}`}>
                              <User className="h-5 w-5 text-primary shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">
                                  {o.status === "picked_up" ? "② Deliver to Customer" : "② Customer Location"}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {o.delivery_address || "No address"}
                                </p>
                              </div>
                              {hasCustomerLoc && o.status === "picked_up" && (
                                <div className="flex gap-1 shrink-0">
                                  <Button size="sm" variant="default" className="gap-1" onClick={() => openNavigation(o.customer_lat, o.customer_lng)}>
                                    <Navigation className="h-3.5 w-3.5" /> Navigate
                                  </Button>
                                  <Button size="sm" variant="outline" className="px-2" onClick={() => copyLocation(o.customer_lat, o.customer_lng, "Customer")}>
                                    <Copy className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {completed.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" /> Completed ({completed.length})
                </h2>
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Earning</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {completed.map((o: any) => (
                          <TableRow key={o.id}>
                            <TableCell className="font-mono text-xs">{o.id.slice(0, 8)}...</TableCell>
                            <TableCell className="text-sm">
                              {o.order_items?.map((i: any) => i.products?.name).join(", ")}
                            </TableCell>
                            <TableCell>₹{Number(o.total).toFixed(2)}</TableCell>
                            <TableCell className="text-primary font-medium">₹{(Number(o.total) * 0.1).toFixed(2)}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </section>
    </Layout>
  );
};

export default RiderDeliveries;
