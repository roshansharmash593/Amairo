import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { IndianRupee, TrendingUp, Package, Bike } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const RiderEarnings = () => {
  const { user } = useAuth();

  const { data: orders = [] } = useQuery({
    queryKey: ["rider-earnings-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, total, status, created_at")
        .eq("rider_id", user!.id)
        .eq("status", "delivered")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const totalEarnings = orders.reduce((s: number, o: any) => s + Number(o.total) * 0.1, 0);
  const todayOrders = orders.filter((o: any) => new Date(o.created_at).toDateString() === new Date().toDateString());
  const todayEarnings = todayOrders.reduce((s: number, o: any) => s + Number(o.total) * 0.1, 0);

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toDateString();
    const dayOrders = orders.filter((o: any) => new Date(o.created_at).toDateString() === key);
    return {
      day: d.toLocaleDateString("en-IN", { weekday: "short" }),
      deliveries: dayOrders.length,
      earnings: dayOrders.reduce((s: number, o: any) => s + Number(o.total) * 0.1, 0),
    };
  });

  const stats = [
    { label: "Today's Earnings", value: `₹${todayEarnings.toFixed(0)}`, icon: IndianRupee },
    { label: "Today's Deliveries", value: String(todayOrders.length), icon: Package },
    { label: "Total Earnings", value: `₹${totalEarnings.toFixed(0)}`, icon: TrendingUp },
    { label: "Total Deliveries", value: String(orders.length), icon: Bike },
  ];

  return (
    <Layout>
      <section className="container py-20 md:py-28">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Earnings Summary</h1>
          <p className="text-muted-foreground">Track your delivery earnings and performance</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card>
                <CardContent className="pt-6 text-center">
                  <s.icon className="h-5 w-5 text-secondary mx-auto mb-2" />
                  <div className="text-2xl font-display font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Deliveries (Last 7 Days)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={last7}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis allowDecimals={false} className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="deliveries" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Earnings (Last 7 Days)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={last7}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip formatter={(v: any) => `₹${v.toFixed(0)}`} />
                  <Bar dataKey="earnings" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default RiderEarnings;
