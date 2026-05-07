import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Users, Store, Bike, Package, MessageSquare, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

const adminCards = [
  { title: "Manage Vendors", desc: "View vendors and approve product photos.", icon: Store, to: "/admin/vendors", color: "text-primary", bg: "bg-primary/10" },
  { title: "Manage Riders", desc: "View registered riders and stats.", icon: Bike, to: "/admin/riders", color: "text-secondary", bg: "bg-secondary/10" },
  { title: "Orders", desc: "Monitor orders, assign riders.", icon: Package, to: "/admin/orders", color: "text-accent", bg: "bg-accent/10" },
  { title: "Users", desc: "View all users and roles.", icon: Users, to: "/admin/users", color: "text-primary", bg: "bg-primary/10" },
  { title: "Messages", desc: "View contact form submissions.", icon: MessageSquare, to: "/admin/messages", color: "text-secondary", bg: "bg-secondary/10" },
  { title: "Feedback", desc: "View all customer feedback & faults.", icon: Star, to: "/admin/feedback", color: "text-accent", bg: "bg-accent/10" },
];

const AdminDashboard = () => {
  const { user } = useAuth();

  const { data: vendorCount = 0 } = useQuery({
    queryKey: ["admin-stat-vendors"],
    queryFn: async () => {
      const { count } = await supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "vendor");
      return count || 0;
    },
  });

  const { data: riderCount = 0 } = useQuery({
    queryKey: ["admin-stat-riders"],
    queryFn: async () => {
      const { count } = await supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "rider");
      return count || 0;
    },
  });

  const { data: orderCount = 0 } = useQuery({
    queryKey: ["admin-stat-orders"],
    queryFn: async () => {
      const { count } = await supabase.from("orders").select("id", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: userCount = 0 } = useQuery({
    queryKey: ["admin-stat-users"],
    queryFn: async () => {
      const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true });
      return count || 0;
    },
  });

  const stats = [
    { label: "Vendors", value: vendorCount, icon: Store },
    { label: "Riders", value: riderCount, icon: Bike },
    { label: "Orders", value: orderCount, icon: Package },
    { label: "Users", value: userCount, icon: Users },
  ];

  return (
    <Layout>
      <section className="container py-20 md:py-28">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.user_metadata?.full_name || "Admin"}.</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
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
          {adminCards.map((card, i) => (
            <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }}>
              <Link to={card.to}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="pt-6 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center shrink-0`}>
                      <card.icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                    <div>
                      <p className="font-medium group-hover:text-primary transition-colors">{card.title}</p>
                      <p className="text-sm text-muted-foreground">{card.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default AdminDashboard;
