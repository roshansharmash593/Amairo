import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Clock, Package, Truck } from "lucide-react";
import { useEffect, useState } from "react";

const statusColors: Record<string, string> = {
  pending: "secondary",
  accepted: "default",
  rejected: "destructive",
  preparing: "default",
  dispatched: "default",
  delivered: "default",
};

const VendorOrders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRiders, setSelectedRiders] = useState<Record<string, string>>({});

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["vendor-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, products(name, unit))")
        .eq("vendor_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Get available riders
  const { data: riders = [] } = useQuery({
    queryKey: ["available-riders"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "rider");
      if (!roles?.length) return [];
      const ids = roles.map((r) => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", ids);
      return profiles || [];
    },
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("vendor-orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `vendor_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, rider_id }: { id: string; status: string; rider_id?: string }) => {
      const update: any = { status };
      if (rider_id) update.rider_id = rider_id;
      const { error } = await supabase.from("orders").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
      toast({ title: `Order ${status}` });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleDispatch = (orderId: string) => {
    const riderId = selectedRiders[orderId];
    if (!riderId) {
      toast({ title: "Please select a rider first", variant: "destructive" });
      return;
    }
    updateStatus.mutate({ id: orderId, status: "dispatched", rider_id: riderId });
  };

  return (
    <Layout>
      <section className="container py-20 md:py-28">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Orders</h1>
          <p className="text-muted-foreground">Manage incoming orders in real-time</p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground py-16">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No orders yet</p>
              <p className="text-sm mt-1">Orders from customers will appear here</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o: any) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{o.id.slice(0, 8)}...</TableCell>
                      <TableCell>
                        <div className="text-sm space-y-0.5">
                          {o.order_items?.map((item: any) => (
                            <div key={item.id}>
                              {item.products?.name} × {item.quantity} {item.products?.unit}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">₹{Number(o.total).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={statusColors[o.status] as any || "secondary"}>{o.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {o.status === "pending" && (
                          <div className="flex gap-1 justify-end">
                            <Button size="sm" variant="default" className="gap-1" onClick={() => updateStatus.mutate({ id: o.id, status: "accepted" })}>
                              <CheckCircle className="h-3.5 w-3.5" /> Accept
                            </Button>
                            <Button size="sm" variant="destructive" className="gap-1" onClick={() => updateStatus.mutate({ id: o.id, status: "rejected" })}>
                              <XCircle className="h-3.5 w-3.5" /> Reject
                            </Button>
                          </div>
                        )}
                        {o.status === "accepted" && (
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => updateStatus.mutate({ id: o.id, status: "preparing" })}>
                            <Clock className="h-3.5 w-3.5" /> Preparing
                          </Button>
                        )}
                        {o.status === "preparing" && !o.rider_id && (
                          <div className="flex items-center gap-2 justify-end">
                            <Select value={selectedRiders[o.id] || ""} onValueChange={(v) => setSelectedRiders({ ...selectedRiders, [o.id]: v })}>
                              <SelectTrigger className="w-36 h-8 text-xs">
                                <SelectValue placeholder="Select rider" />
                              </SelectTrigger>
                              <SelectContent>
                                {riders.map((r: any) => (
                                  <SelectItem key={r.user_id} value={r.user_id}>{r.full_name || "Unnamed"}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button size="sm" variant="outline" className="gap-1" onClick={() => handleDispatch(o.id)}>
                              <Truck className="h-3.5 w-3.5" /> Dispatch
                            </Button>
                          </div>
                        )}
                        {o.status === "dispatched" && (
                          <Badge variant="secondary" className="text-xs">Rider assigned</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </section>
    </Layout>
  );
};

export default VendorOrders;
