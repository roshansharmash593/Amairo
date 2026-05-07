import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Star, MessageSquare, AlertTriangle, Package } from "lucide-react";

const AdminFeedback = () => {
  const { data: feedbacks = [], isLoading } = useQuery({
    queryKey: ["admin-all-feedback"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_feedback")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const avgRating = feedbacks.length
    ? (feedbacks.reduce((s: number, f: any) => s + f.rating, 0) / feedbacks.length).toFixed(1)
    : "—";
  const faultCount = feedbacks.filter((f: any) => f.has_fault).length;

  return (
    <Layout>
      <section className="container py-20 md:py-28 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold mb-2">All Customer Feedback</h1>
          <p className="text-muted-foreground">Platform-wide reviews and fault reports.</p>
        </motion.div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Reviews", value: String(feedbacks.length), icon: MessageSquare },
            { label: "Avg Rating", value: avgRating, icon: Star },
            { label: "Faults Reported", value: String(faultCount), icon: AlertTriangle },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card>
                <CardContent className="pt-5 text-center">
                  <s.icon className="h-5 w-5 text-primary mx-auto mb-1" />
                  <div className="text-xl font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : feedbacks.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-16">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No feedback yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {feedbacks.map((fb: any, i: number) => (
              <motion.div key={fb.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className={fb.has_fault ? "border-destructive/30" : ""}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`h-4 w-4 ${s <= fb.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/20"}`} />
                          ))}
                        </div>
                        <span className="font-mono text-xs text-muted-foreground">Order #{fb.order_id.slice(0, 8)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {fb.has_fault && <Badge variant="destructive" className="text-[10px]">Fault</Badge>}
                        <span className="text-xs text-muted-foreground">{new Date(fb.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {fb.product_feedback && (
                      <p className="text-sm mb-1">
                        <span className="text-xs font-medium text-muted-foreground">Product:</span> {fb.product_feedback}
                      </p>
                    )}
                    {fb.delivery_feedback && (
                      <p className="text-sm mb-1">
                        <span className="text-xs font-medium text-muted-foreground">Delivery:</span> {fb.delivery_feedback}
                      </p>
                    )}
                    {fb.has_fault && fb.fault_description && (
                      <div className="mt-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-sm text-destructive">
                          <span className="font-medium">Fault:</span> {fb.fault_description}
                        </p>
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

export default AdminFeedback;
