import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Bike, Check, X, Clock, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminRiders = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: riders = [], isLoading } = useQuery({
    queryKey: ["admin-riders"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "rider");
      if (!roles?.length) return [];
      const riderIds = roles.map((r) => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", riderIds);
      const { data: orders } = await supabase.from("orders").select("rider_id").in("rider_id", riderIds).eq("status", "delivered");
      const countMap: Record<string, number> = {};
      orders?.forEach((o) => { if (o.rider_id) countMap[o.rider_id] = (countMap[o.rider_id] || 0) + 1; });
      return (profiles || []).map((p) => ({ ...p, delivery_count: countMap[p.user_id] || 0 }));
    },
  });

  const updateApproval = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const { error } = await supabase.from("profiles").update({ approval_status: status }).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-riders"] });
      toast({ title: `Rider ${status}` });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const pending = riders.filter((r: any) => r.approval_status === "pending");
  const approved = riders.filter((r: any) => r.approval_status === "approved");
  const rejected = riders.filter((r: any) => r.approval_status === "rejected");

  const statusBadge = (status: string) => {
    if (status === "approved") return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
    if (status === "rejected") return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
    return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
  };

  const renderRiderCard = (r: any, showActions: boolean) => (
    <Card key={r.id}>
      <CardContent className="pt-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
              <Bike className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <h3 className="font-semibold">{r.full_name || "Unnamed"}</h3>
              <p className="text-sm text-muted-foreground">{r.phone || "No phone"}</p>
              {r.dl_number && (
                <p className="text-xs mt-1">🪪 DL: <span className="font-mono">{r.dl_number}</span></p>
              )}
              {r.pan_number && (
                <p className="text-xs text-muted-foreground">PAN: <span className="font-mono">{r.pan_number}</span></p>
              )}
              {r.vehicle_details && (
                <p className="text-xs text-muted-foreground">🏍️ {r.vehicle_details}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">{r.delivery_count} deliveries • Joined {new Date(r.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {statusBadge(r.approval_status)}
            {showActions && r.approval_status === "pending" && (
              <div className="flex gap-2">
                <Button size="sm" className="gap-1" onClick={() => updateApproval.mutate({ userId: r.user_id, status: "approved" })}>
                  <Check className="h-3.5 w-3.5" /> Approve
                </Button>
                <Button size="sm" variant="destructive" className="gap-1" onClick={() => updateApproval.mutate({ userId: r.user_id, status: "rejected" })}>
                  <X className="h-3.5 w-3.5" /> Reject
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <section className="container py-20 md:py-28">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Manage Riders</h1>
          <p className="text-muted-foreground">Review rider applications, verify documents, and approve accounts.</p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary" /></div>
        ) : (
          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pending" className="gap-1">
                Pending <Badge variant="secondary" className="ml-1 h-5 px-1.5">{pending.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-3">
              {pending.length === 0 ? (
                <Card><CardContent className="pt-6 text-center text-muted-foreground py-10">No pending applications</CardContent></Card>
              ) : pending.map((r: any) => renderRiderCard(r, true))}
            </TabsContent>

            <TabsContent value="approved" className="space-y-3">
              {approved.length === 0 ? (
                <Card><CardContent className="pt-6 text-center text-muted-foreground py-10">No approved riders</CardContent></Card>
              ) : approved.map((r: any) => renderRiderCard(r, false))}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-3">
              {rejected.length === 0 ? (
                <Card><CardContent className="pt-6 text-center text-muted-foreground py-10">No rejected riders</CardContent></Card>
              ) : rejected.map((r: any) => renderRiderCard(r, true))}
            </TabsContent>
          </Tabs>
        )}
      </section>
    </Layout>
  );
};

export default AdminRiders;
