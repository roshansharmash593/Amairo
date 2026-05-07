import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { User, Phone, MapPin, Locate, Pencil, Save, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

const CustomerProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phones, setPhones] = useState<string[]>([""]);
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["customer-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone, shop_address, latitude, longitude")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhones(profile.phone ? profile.phone.split(",").map((p: string) => p.trim()) : [""]);
      setAddress(profile.shop_address || "");
      setLat(profile.latitude);
      setLng(profile.longitude);
    }
  }, [profile]);

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not supported", variant: "destructive" });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocating(false);
        toast({ title: "📍 Location captured!" });
      },
      () => {
        setLocating(false);
        toast({ title: "Location access denied", variant: "destructive" });
      },
      { enableHighAccuracy: true }
    );
  };

  const addPhone = () => {
    if (phones.length < 3) setPhones([...phones, ""]);
  };

  const removePhone = (idx: number) => {
    if (phones.length > 1) setPhones(phones.filter((_, i) => i !== idx));
  };

  const updatePhone = (idx: number, val: string) => {
    const updated = [...phones];
    updated[idx] = val;
    setPhones(updated);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const phoneStr = phones.filter((p) => p.trim()).join(", ");
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim() || null,
          phone: phoneStr || null,
          shop_address: address.trim() || null,
          latitude: lat,
          longitude: lng,
        })
        .eq("user_id", user.id);
      if (error) throw error;
      toast({ title: "✅ Profile saved!" });
      queryClient.invalidateQueries({ queryKey: ["customer-profile"] });
      setEditing(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <section className="container py-20 md:py-28 max-w-lg mx-auto">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="container py-20 md:py-28 max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> My Profile
              </CardTitle>
              {!editing && (
                <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="gap-1">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name */}
              <div>
                <Label>Full Name</Label>
                {editing ? (
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" className="mt-1" />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">{fullName || "—"}</p>
                )}
              </div>

              {/* Phone Numbers */}
              <div>
                <Label>Phone Number{phones.length > 1 ? "s" : ""}</Label>
                {editing ? (
                  <div className="space-y-2 mt-1">
                    {phones.map((p, i) => (
                      <div key={i} className="flex gap-2">
                        <Input value={p} onChange={(e) => updatePhone(i, e.target.value)} placeholder={`Phone ${i + 1}`} />
                        {phones.length > 1 && (
                          <Button size="icon" variant="ghost" onClick={() => removePhone(i)} className="shrink-0">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {phones.length < 3 && (
                      <Button size="sm" variant="outline" onClick={addPhone} className="gap-1">
                        <Plus className="h-3 w-3" /> Add Phone
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="mt-1 space-y-1">
                    {phones.filter((p) => p.trim()).length > 0
                      ? phones.filter((p) => p.trim()).map((p, i) => (
                          <p key={i} className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {p}
                          </p>
                        ))
                      : <p className="text-sm text-muted-foreground">—</p>}
                  </div>
                )}
              </div>

              {/* Delivery Address */}
              <div>
                <Label>Delivery Address</Label>
                {editing ? (
                  <Textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Your delivery address (this will auto-fill on orders)"
                    className="mt-1"
                    maxLength={500}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1 flex items-start gap-1">
                    <MapPin className="h-3 w-3 mt-0.5 shrink-0" /> {address || "—"}
                  </p>
                )}
              </div>

              {/* Location */}
              <div>
                <Label>GPS Location</Label>
                {editing ? (
                  <div className="mt-1 space-y-2">
                    <Button variant="outline" className="w-full gap-2" onClick={getLocation} disabled={locating}>
                      <Locate className={`h-4 w-4 ${locating ? "animate-spin" : ""}`} />
                      {locating ? "Getting location..." : lat ? "📍 Update Location" : "📍 Use My Location"}
                    </Button>
                    {lat && lng && (
                      <div className="flex items-center gap-2 p-2 rounded-md bg-primary/10 border border-primary/20">
                        <MapPin className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-xs text-primary font-medium">GPS: {lat.toFixed(5)}, {lng.toFixed(5)} ✓</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="number" step="any" placeholder="Latitude" value={lat ?? ""} onChange={(e) => setLat(e.target.value ? parseFloat(e.target.value) : null)} />
                      <Input type="number" step="any" placeholder="Longitude" value={lng ?? ""} onChange={(e) => setLng(e.target.value ? parseFloat(e.target.value) : null)} />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {lat && lng ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : "—"}
                  </p>
                )}
              </div>

              {editing && (
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} disabled={saving} className="gap-1 flex-1">
                    <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Profile"}
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                </div>
              )}

              {!editing && address && (
                <p className="text-xs text-muted-foreground bg-accent/50 rounded-md p-2 border border-accent">
                  💡 Your saved address will auto-fill when placing orders.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </Layout>
  );
};

export default CustomerProfile;
