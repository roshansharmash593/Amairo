import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Package, MapPin, UserCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const statusLabels: Record<string, string> = {
  pending: "Pending", accepted: "Accepted", preparing: "Preparing",
  dispatched: "Dispatched", picked_up: "Picked Up", delivered: "Delivered", rejected: "Rejected",
};

const AdminOrders = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-all-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, products(name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Get available riders for assignment
  const { data: riders = [] } = useQuery({
    queryKey: ["admin-available-riders"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "rider");
      if (!roles?.length) return [];
      const ids = roles.map((r) => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", ids);
      return profiles || [];
    },
  });

  const assignRider = useMutation({
    mutationFn: async ({ orderId, riderId }: { orderId: string; riderId: string }) => {
      const { error } = await supabase.from("orders").update({ rider_id: riderId, status: "dispatched" }).eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-orders"] });
      toast({ title: "Rider assigned & order dispatched" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const [selectedRiders, setSelectedRiders] = useState<Record<string, string>>({});

  return (
    <Layout>
      <section className="container py-20 md:py-28">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Order Management</h1>
          <p className="text-muted-foreground">Monitor all orders and assign riders.</p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : orders.length === 0 ? (
          <Card><CardContent className="pt-6 text-center text-muted-foreground py-10">No orders yet</CardContent></Card>
        ) : (
          <div className="space-y-4">
            {orders.map((o: any, i: number) => (
              <motion.div key={o.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                <Card>
                  <CardContent className="pt-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                          <Package className="h-5 w-5 text-accent" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</span>
                            <Badge variant={o.status === "delivered" ? "default" : o.status === "rejected" ? "destructive" : "secondary"}>
                              {statusLabels[o.status] || o.status}
                            </Badge>
                          </div>
                          <div className="text-sm mt-1">
                            {o.order_items?.map((item: any) => item.products?.name).join(", ")}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                            <span>Total: ₹{Number(o.total).toFixed(0)}</span>
                            {o.delivery_address && (
                              <span className="flex items-center gap-1 truncate max-w-[200px]"><MapPin className="h-3 w-3" />{o.delivery_address}</span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {new Date(o.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Assign rider for accepted/preparing orders without a rider */}
                      {(o.status === "accepted" || o.status === "preparing") && !o.rider_id && (
                        <div className="flex items-center gap-2 shrink-0">
                          <Select value={selectedRiders[o.id] || ""} onValueChange={(v) => setSelectedRiders({ ...selectedRiders, [o.id]: v })}>
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Select rider" />
                            </SelectTrigger>
                            <SelectContent>
                              {riders.map((r: any) => (
                                <SelectItem key={r.user_id} value={r.user_id}>{r.full_name || "Unnamed"}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            disabled={!selectedRiders[o.id]}
                            onClick={() => assignRider.mutate({ orderId: o.id, riderId: selectedRiders[o.id] })}
                          >
                            Assign
                          </Button>
                        </div>
                      )}

                      {o.rider_id && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                          <UserCircle className="h-3.5 w-3.5" /> Rider assigned
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
};

export default AdminOrders;
