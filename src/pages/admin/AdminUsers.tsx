import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Users, Store, Bike, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

const tabs = [
  { value: "customer", label: "Customers", icon: ShoppingBag, color: "text-primary", bg: "bg-primary/10" },
  { value: "vendor", label: "Vendors", icon: Store, color: "text-accent", bg: "bg-accent/10" },
  { value: "rider", label: "Riders", icon: Bike, color: "text-secondary", bg: "bg-secondary/10" },
  { value: "admin", label: "Admins", icon: Users, color: "text-destructive", bg: "bg-destructive/10" },
];

const AdminUsers = () => {
  const [activeTab, setActiveTab] = useState("customer");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-all-users"],
    queryFn: async () => {
      const { data: profiles, error: profErr } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (profErr) throw profErr;

      const { data: roles, error: rolesErr } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (rolesErr) throw rolesErr;

      const roleMap: Record<string, string> = {};
      roles.forEach((r) => { roleMap[r.user_id] = r.role; });

      return profiles.map((p) => ({ ...p, role: roleMap[p.user_id] || "customer" }));
    },
  });

  const filteredUsers = users.filter((u: any) => u.role === activeTab);
  const counts = tabs.map((t) => ({ ...t, count: users.filter((u: any) => u.role === t.value).length }));
  const currentTab = tabs.find((t) => t.value === activeTab)!;

  return (
    <Layout>
      <section className="container py-20 md:py-28">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-muted-foreground">View all registered users ({users.length}) by role.</p>
        </motion.div>

        {/* Role Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {counts.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                activeTab === tab.value
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${tab.bg}`}>
                <tab.icon className={`h-5 w-5 ${tab.color}`} />
              </div>
              <div>
                <p className="font-bold text-lg leading-none">{tab.count}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{tab.label}</p>
              </div>
            </button>
          ))}
        </div>

        {/* User List */}
        {isLoading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : filteredUsers.length === 0 ? (
          <Card><CardContent className="pt-6 text-center text-muted-foreground py-10">No {currentTab.label.toLowerCase()} registered yet</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((u: any, i: number) => (
              <motion.div key={u.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                <Card>
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentTab.bg}`}>
                          <currentTab.icon className={`h-5 w-5 ${currentTab.color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{u.full_name || "Unnamed"}</h3>
                          <p className="text-xs text-muted-foreground">
                            {u.phone || "No phone"} • Joined {new Date(u.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={u.approval_status === "approved" ? "default" : u.approval_status === "rejected" ? "destructive" : "secondary"}>
                        {u.approval_status}
                      </Badge>
                    </div>

                    {/* Extra info for vendors */}
                    {activeTab === "vendor" && (u.shop_name || u.gst_number) && (
                      <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                        {u.shop_name && <span>🏪 {u.shop_name}</span>}
                        {u.gst_number && <span>GST: {u.gst_number}</span>}
                      </div>
                    )}

                    {/* Extra info for riders */}
                    {activeTab === "rider" && (u.dl_number || u.vehicle_details) && (
                      <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                        {u.dl_number && <span>🪪 DL: {u.dl_number}</span>}
                        {u.pan_number && <span>PAN: {u.pan_number}</span>}
                        {u.vehicle_details && <span>🏍️ {u.vehicle_details}</span>}
                      </div>
                    )}
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

export default AdminUsers;
