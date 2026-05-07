import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Upload, Pencil, Trash2, Package, ImageIcon } from "lucide-react";

const UNITS = [
  { value: "kg", label: "Kg (weight)", type: "weight" },
  { value: "g", label: "Grams (weight)", type: "weight" },
  { value: "litre", label: "Litre (volume)", type: "weight" },
  { value: "ml", label: "ML (volume)", type: "weight" },
  { value: "piece", label: "Piece (countable)", type: "countable" },
  { value: "packet", label: "Packet", type: "countable" },
  { value: "bottle", label: "Bottle", type: "countable" },
  { value: "tube", label: "Tube", type: "countable" },
  { value: "bar", label: "Bar (soap etc.)", type: "countable" },
  { value: "dozen", label: "Dozen", type: "countable" },
  { value: "bundle", label: "Bundle", type: "countable" },
  { value: "box", label: "Box", type: "countable" },
  { value: "can", label: "Can", type: "countable" },
  { value: "pair", label: "Pair", type: "countable" },
];

const VendorProducts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", unit: "kg" });
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["vendor-products", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("vendor_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const uploadPhoto = async (productId: string): Promise<string | null> => {
    if (!photoFile || !user) return null;
    const ext = photoFile.name.split(".").pop();
    const path = `${user.id}/${productId}.${ext}`;
    const { error } = await supabase.storage.from("product-photos").upload(path, photoFile, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("product-photos").getPublicUrl(path);
    return data.publicUrl;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const payload = {
        vendor_id: user.id,
        name: form.name.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price) || 0,
        unit: form.unit,
      };

      let productId: string;
      if (editingProduct) {
        const { error } = await supabase.from("products").update(payload).eq("id", editingProduct.id);
        if (error) throw error;
        productId = editingProduct.id;
      } else {
        const { data, error } = await supabase.from("products").insert(payload).select("id").single();
        if (error) throw error;
        productId = data.id;
      }

      if (photoFile) {
        const photoUrl = await uploadPhoto(productId);
        if (photoUrl) {
          await supabase.from("products").update({ photo_url: photoUrl, photo_approved: false }).eq("id", productId);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      toast({ title: editingProduct ? "Product updated" : "Product added" });
      resetForm();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("products").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vendor-products"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      toast({ title: "Product deleted" });
    },
  });

  const resetForm = () => {
    setForm({ name: "", description: "", price: "", unit: "kg" });
    setPhotoFile(null);
    setEditingProduct(null);
    setDialogOpen(false);
  };

  const openEdit = (p: any) => {
    setEditingProduct(p);
    setForm({ name: p.name, description: p.description || "", price: String(p.price), unit: p.unit });
    setDialogOpen(true);
  };

  return (
    <Layout>
      <section className="container py-20 md:py-28">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Products</h1>
            <p className="text-muted-foreground">Manage your product catalog</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetForm(); setDialogOpen(o); }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Add Product</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
                <div>
                  <Label>Product Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={100} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={500} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Price (₹)</Label>
                    <Input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {UNITS.map((u) => (
                          <SelectItem key={u.value} value={u.value}>
                            {u.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Product Photo</Label>
                  <div className="mt-1 flex items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background cursor-pointer hover:bg-muted transition-colors text-sm">
                      <Upload className="h-4 w-4" />
                      {photoFile ? photoFile.name : "Choose file"}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : editingProduct ? "Update Product" : "Add Product"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground py-16">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No products yet</p>
              <p className="text-sm mt-1">Add your first product to get started</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Photo</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Photo Status</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        {p.photo_url ? (
                          <img src={p.photo_url} alt={p.name} className="h-10 w-10 rounded object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>₹{Number(p.price).toFixed(2)}</TableCell>
                      <TableCell>{p.unit}</TableCell>
                      <TableCell>
                        <Badge variant={p.photo_approved ? "default" : "secondary"}>
                          {p.photo_url ? (p.photo_approved ? "Approved" : "Pending") : "No photo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch checked={p.is_active} onCheckedChange={(v) => toggleActive.mutate({ id: p.id, is_active: v })} />
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

export default VendorProducts;
