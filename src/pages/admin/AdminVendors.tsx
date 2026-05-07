import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Store, Check, X, ImageIcon, Clock, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminVendors = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ["admin-vendors"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "vendor");
      if (!roles?.length) return [];
      const vendorIds = roles.map((r) => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", vendorIds);
      const { data: products } = await supabase.from("products").select("vendor_id").in("vendor_id", vendorIds);
      const countMap: Record<string, number> = {};
      products?.forEach((p) => { countMap[p.vendor_id] = (countMap[p.vendor_id] || 0) + 1; });
      return (profiles || []).map((p) => ({ ...p, product_count: countMap[p.user_id] || 0 }));
    },
  });

  const { data: pendingPhotos = [] } = useQuery({
    queryKey: ["admin-pending-photos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("photo_approved", false)
        .not("photo_url", "is", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateApproval = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const { error } = await supabase.from("profiles").update({ approval_status: status }).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-vendors"] });
      toast({ title: `Vendor ${status}` });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const approvePhoto = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").update({ photo_approved: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-photos"] });
      toast({ title: "Photo approved" });
    },
  });

  const rejectPhoto = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").update({ photo_url: null, photo_approved: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-photos"] });
      toast({ title: "Photo rejected & removed" });
    },
  });

  const pending = vendors.filter((v: any) => v.approval_status === "pending");
  const approved = vendors.filter((v: any) => v.approval_status === "approved");
  const rejected = vendors.filter((v: any) => v.approval_status === "rejected");

  const statusBadge = (status: string) => {
    if (status === "approved") return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
    if (status === "rejected") return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
    return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
  };

  const renderVendorCard = (v: any, showActions: boolean) => (
    <Card key={v.id}>
      <CardContent className="pt-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{v.full_name || "Unnamed"}</h3>
              <p className="text-sm text-muted-foreground">{v.phone || "No phone"}</p>
              {v.shop_name && (
                <p className="text-sm mt-1">🏪 <span className="font-medium">{v.shop_name}</span></p>
              )}
              {v.gst_number && (
                <p className="text-xs text-muted-foreground mt-0.5">GST: <span className="font-mono">{v.gst_number}</span></p>
              )}
              <p className="text-xs text-muted-foreground mt-1">{v.product_count} products • Joined {new Date(v.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {statusBadge(v.approval_status)}
            {showActions && v.approval_status === "pending" && (
              <div className="flex gap-2">
                <Button size="sm" className="gap-1" onClick={() => updateApproval.mutate({ userId: v.user_id, status: "approved" })}>
                  <Check className="h-3.5 w-3.5" /> Approve
                </Button>
                <Button size="sm" variant="destructive" className="gap-1" onClick={() => updateApproval.mutate({ userId: v.user_id, status: "rejected" })}>
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
          <h1 className="text-3xl font-bold mb-2">Manage Vendors</h1>
          <p className="text-muted-foreground">Review applications, approve vendors, and manage product photos.</p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : (
          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pending" className="gap-1">
                Pending <Badge variant="secondary" className="ml-1 h-5 px-1.5">{pending.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
              <TabsTrigger value="photos" className="gap-1">
                Photos <Badge variant="secondary" className="ml-1 h-5 px-1.5">{pendingPhotos.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-3">
              {pending.length === 0 ? (
                <Card><CardContent className="pt-6 text-center text-muted-foreground py-10">No pending applications</CardContent></Card>
              ) : pending.map((v: any) => renderVendorCard(v, true))}
            </TabsContent>

            <TabsContent value="approved" className="space-y-3">
              {approved.length === 0 ? (
                <Card><CardContent className="pt-6 text-center text-muted-foreground py-10">No approved vendors</CardContent></Card>
              ) : approved.map((v: any) => renderVendorCard(v, false))}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-3">
              {rejected.length === 0 ? (
                <Card><CardContent className="pt-6 text-center text-muted-foreground py-10">No rejected vendors</CardContent></Card>
              ) : rejected.map((v: any) => renderVendorCard(v, true))}
            </TabsContent>

            <TabsContent value="photos">
              {pendingPhotos.length === 0 ? (
                <Card><CardContent className="pt-6 text-center text-muted-foreground py-10">No photos pending approval</CardContent></Card>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {pendingPhotos.map((p: any) => (
                    <Card key={p.id} className="overflow-hidden">
                      <div className="aspect-square bg-muted">
                        <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <CardContent className="pt-3">
                        <p className="font-medium text-sm truncate">{p.name}</p>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" className="flex-1 gap-1" onClick={() => approvePhoto.mutate(p.id)}>
                            <Check className="h-3.5 w-3.5" /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" className="flex-1 gap-1" onClick={() => rejectPhoto.mutate(p.id)}>
                            <X className="h-3.5 w-3.5" /> Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </section>
    </Layout>
  );
};

export default AdminVendors;
