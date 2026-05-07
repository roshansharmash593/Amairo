import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ClipboardCheck, Package } from "lucide-react";

const VendorStockUpdate = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["vendor-products-stock", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, unit, is_active")
        .eq("vendor_id", user!.id)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: latestStock = {} } = useQuery({
    queryKey: ["latest-stock", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_updates")
        .select("product_id, quantity, updated_at")
        .eq("vendor_id", user!.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      const map: Record<string, { quantity: number; updated_at: string }> = {};
      data.forEach((s: any) => {
        if (!map[s.product_id]) map[s.product_id] = s;
      });
      return map;
    },
    enabled: !!user,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const entries = Object.entries(quantities).filter(([, q]) => q !== "" && parseFloat(q) >= 0);
      if (entries.length === 0) throw new Error("Please enter quantities for at least one product");

      const rows = entries.map(([product_id, q]) => ({
        product_id,
        vendor_id: user.id,
        quantity: parseFloat(q),
      }));

      const { error } = await supabase.from("stock_updates").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["latest-stock"] });
      setQuantities({});
      toast({ title: "Stock updated successfully!" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const now = new Date();
  const hour = now.getHours();
  const isStockWindow = hour >= 5 && hour <= 9;

  return (
    <Layout>
      <section className="container py-20 md:py-28 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Daily Stock Update</h1>
          <p className="text-muted-foreground">
            Update today's available stock for your products.
            {isStockWindow ? (
              <Badge className="ml-2" variant="default">Stock window open</Badge>
            ) : (
              <Badge className="ml-2" variant="secondary">Outside ideal window (5-9 AM)</Badge>
            )}
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground py-16">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No active products</p>
              <p className="text-sm mt-1">Add products first from the Products page</p>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); submitMutation.mutate(); }}>
            <div className="space-y-3">
              {products.map((p: any, i: number) => {
                const last = (latestStock as any)[p.id];
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card>
                      <CardContent className="pt-4 pb-4 flex items-center gap-4">
                        <div className="flex-1">
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Last: {last ? `${last.quantity} ${p.unit}` : "No update yet"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 w-40">
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            placeholder="Qty"
                            value={quantities[p.id] || ""}
                            onChange={(e) => setQuantities({ ...quantities, [p.id]: e.target.value })}
                          />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{p.unit}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
            <Button type="submit" className="w-full mt-6 gap-2" disabled={submitMutation.isPending} size="lg">
              <ClipboardCheck className="h-4 w-4" />
              {submitMutation.isPending ? "Submitting..." : "Submit Stock Update"}
            </Button>
          </form>
        )}
      </section>
    </Layout>
  );
};

export default VendorStockUpdate;
