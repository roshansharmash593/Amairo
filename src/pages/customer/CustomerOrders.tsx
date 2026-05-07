import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Package, MapPin, Clock, CheckCircle2, Circle, Truck, ChefHat, PackageCheck, Timer, XCircle, Star, MessageSquare, AlertTriangle, Hourglass } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

// Estimated minutes from order creation per status
const statusETA: Record<string, number> = {
  pending: 5,
  accepted: 10,
  preparing: 25,
  dispatched: 35,
  picked_up: 45,
  delivered: 0,
};

const getEstimatedTime = (order: any) => {
  if (order.status === "delivered" || order.status === "rejected") return null;
  const created = new Date(order.created_at).getTime();
  const totalEstMinutes = 45; // Total estimated delivery time
  const progressMinutes = statusETA[order.status] || 0;
  const remainingMinutes = totalEstMinutes - progressMinutes;
  const etaTime = new Date(created + totalEstMinutes * 60000);
  const now = Date.now();
  const minsLeft = Math.max(0, Math.round((etaTime.getTime() - now) / 60000));
  return { remainingMinutes: minsLeft > 0 ? minsLeft : remainingMinutes, etaTime };
};

const statusSteps = ["pending", "accepted", "preparing", "dispatched", "picked_up", "delivered"];
const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: "Order Placed", icon: Timer, color: "text-yellow-500" },
  accepted: { label: "Accepted", icon: CheckCircle2, color: "text-blue-500" },
  preparing: { label: "Preparing", icon: ChefHat, color: "text-orange-500" },
  dispatched: { label: "Dispatched", icon: Truck, color: "text-purple-500" },
  picked_up: { label: "Picked Up", icon: PackageCheck, color: "text-indigo-500" },
  delivered: { label: "Delivered", icon: CheckCircle2, color: "text-green-500" },
  rejected: { label: "Rejected", icon: XCircle, color: "text-destructive" },
};

const CustomerOrders = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [recentlyUpdated, setRecentlyUpdated] = useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [productFeedback, setProductFeedback] = useState("");
  const [deliveryFeedback, setDeliveryFeedback] = useState("");
  const [hasFault, setHasFault] = useState(false);
  const [faultDescription, setFaultDescription] = useState("");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["customer-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, products(name, unit))")
        .eq("customer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: feedbacks = [] } = useQuery({
    queryKey: ["customer-feedbacks", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("order_feedback")
        .select("order_id")
        .eq("customer_id", user!.id);
      return data?.map((f: any) => f.order_id) || [];
    },
    enabled: !!user,
  });

  const submitFeedback = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase.from("order_feedback").insert({
        order_id: orderId,
        customer_id: user!.id,
        rating,
        product_feedback: productFeedback.trim() || null,
        delivery_feedback: deliveryFeedback.trim() || null,
        has_fault: hasFault,
        fault_description: hasFault ? faultDescription.trim() || null : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "✅ Feedback submitted!" });
      queryClient.invalidateQueries({ queryKey: ["customer-feedbacks"] });
      setFeedbackOpen(null);
      setRating(5); setProductFeedback(""); setDeliveryFeedback(""); setHasFault(false); setFaultDescription("");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("customer-orders-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `customer_id=eq.${user.id}` }, (payload: any) => {
        queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
        if (payload.new?.id) {
          setRecentlyUpdated(payload.new.id);
          setTimeout(() => setRecentlyUpdated(null), 3000);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const getStepIndex = (status: string) => statusSteps.indexOf(status);

  return (
    <Layout>
      <section className="container py-20 md:py-28 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Orders</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            Track your orders in real-time
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-xs text-green-600 font-medium">Live</span>
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : orders.length === 0 ? (
          <Card><CardContent className="pt-6 text-center text-muted-foreground py-16">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">No orders yet</p>
            <p className="text-sm mt-1">Start shopping to place your first order</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-5">
            <AnimatePresence>
              {orders.map((o: any, i: number) => {
                const currentIdx = getStepIndex(o.status);
                const isRejected = o.status === "rejected";
                const isUpdated = recentlyUpdated === o.id;

                return (
                  <motion.div
                    key={o.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0, scale: isUpdated ? [1, 1.01, 1] : 1 }}
                    transition={{ delay: i * 0.05, duration: isUpdated ? 0.5 : 0.3 }}
                  >
                    <Card className={`transition-all duration-500 ${isUpdated ? "ring-2 ring-primary/50 shadow-lg" : ""}`}>
                      <CardContent className="pt-5 pb-4">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <span className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</span>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              {new Date(o.created_at).toLocaleDateString()} {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <Badge
                            variant={o.status === "delivered" ? "default" : isRejected ? "destructive" : "secondary"}
                            className={isUpdated ? "animate-pulse" : ""}
                          >
                            {statusConfig[o.status]?.label || o.status}
                          </Badge>
                        </div>

                        {/* Estimated Delivery Time */}
                        {(() => {
                          const eta = getEstimatedTime(o);
                          if (!eta) return null;
                          return (
                            <div className="mb-4 p-2.5 rounded-lg bg-accent/50 border border-accent flex items-center gap-2">
                              <Hourglass className="h-4 w-4 text-primary shrink-0 animate-pulse" />
                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  ~{eta.remainingMinutes} min remaining
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  ETA: {eta.etaTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Step tracker */}
                        {!isRejected && (
                          <div className="mb-4">
                            <div className="flex items-center justify-between relative">
                              {/* Connecting line */}
                              <div className="absolute top-4 left-4 right-4 h-0.5 bg-muted z-0" />
                              <div
                                className="absolute top-4 left-4 h-0.5 bg-primary z-0 transition-all duration-700 ease-out"
                                style={{ width: `${currentIdx >= 0 ? (currentIdx / (statusSteps.length - 1)) * (100 - (8 / statusSteps.length) * 100 / 100) : 0}%` }}
                              />

                              {statusSteps.map((step, idx) => {
                                const config = statusConfig[step];
                                const Icon = config.icon;
                                const isCompleted = currentIdx >= idx;
                                const isCurrent = currentIdx === idx;

                                return (
                                  <div key={step} className="flex flex-col items-center z-10 relative" style={{ width: `${100 / statusSteps.length}%` }}>
                                    <motion.div
                                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                                        isCompleted
                                          ? "bg-primary border-primary text-primary-foreground"
                                          : "bg-background border-muted-foreground/30 text-muted-foreground/40"
                                      } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}
                                      animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                                      transition={{ repeat: isCurrent ? Infinity : 0, duration: 2 }}
                                    >
                                      <Icon className="h-3.5 w-3.5" />
                                    </motion.div>
                                    <span className={`text-[9px] mt-1.5 text-center leading-tight ${
                                      isCompleted ? "text-primary font-semibold" : "text-muted-foreground"
                                    }`}>
                                      {config.label}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {isRejected && (
                          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                            <p className="text-sm text-destructive font-medium flex items-center gap-2">
                              <XCircle className="h-4 w-4" /> Order was rejected
                            </p>
                          </div>
                        )}

                        {/* Items */}
                        <div className="text-sm space-y-0.5">
                          {o.order_items?.map((item: any) => (
                            <div key={item.id} className="flex justify-between">
                              <span>{item.products?.name} × {item.quantity}</span>
                              <span className="text-muted-foreground">₹{(Number(item.price) * Number(item.quantity)).toFixed(0)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                          {o.delivery_address && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate max-w-[60%]">
                              <MapPin className="h-3 w-3 shrink-0" /> {o.delivery_address}
                            </p>
                          )}
                          <p className="font-display font-bold">₹{Number(o.total).toFixed(0)}</p>
                        </div>

                        {/* Feedback */}
                        {o.status === "delivered" && !feedbacks.includes(o.id) && (
                          <div className="mt-3 pt-3 border-t border-border">
                            {feedbackOpen === o.id ? (
                              <div className="space-y-3">
                                <div>
                                  <Label className="text-xs">Rating</Label>
                                  <div className="flex gap-1 mt-1">
                                    {[1,2,3,4,5].map(s => (
                                      <button key={s} onClick={() => setRating(s)} className="focus:outline-none">
                                        <Star className={`h-5 w-5 ${s <= rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}`} />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-xs">Product Feedback</Label>
                                  <Textarea value={productFeedback} onChange={e => setProductFeedback(e.target.value)} placeholder="How was the product quality?" className="mt-1 min-h-[60px]" maxLength={500} />
                                </div>
                                <div>
                                  <Label className="text-xs">Delivery Feedback</Label>
                                  <Textarea value={deliveryFeedback} onChange={e => setDeliveryFeedback(e.target.value)} placeholder="How was the delivery?" className="mt-1 min-h-[60px]" maxLength={500} />
                                </div>
                                <div className="flex items-center gap-3">
                                  <Switch checked={hasFault} onCheckedChange={setHasFault} />
                                  <Label className="text-xs flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-destructive" /> Report a fault</Label>
                                </div>
                                {hasFault && (
                                  <div>
                                    <Label className="text-xs">Describe the fault</Label>
                                    <Textarea value={faultDescription} onChange={e => setFaultDescription(e.target.value)} placeholder="What's wrong with the product?" className="mt-1 min-h-[60px]" maxLength={500} />
                                  </div>
                                )}
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => submitFeedback.mutate(o.id)} disabled={submitFeedback.isPending}>
                                    {submitFeedback.isPending ? "Submitting..." : "Submit Feedback"}
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => setFeedbackOpen(null)}>Cancel</Button>
                                </div>
                              </div>
                            ) : (
                              <Button size="sm" variant="outline" className="gap-1 w-full" onClick={() => setFeedbackOpen(o.id)}>
                                <MessageSquare className="h-3.5 w-3.5" /> Give Feedback
                              </Button>
                            )}
                          </div>
                        )}
                        {feedbacks.includes(o.id) && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <p className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-primary" /> Feedback submitted</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </section>
    </Layout>
  );
};

export default CustomerOrders;
