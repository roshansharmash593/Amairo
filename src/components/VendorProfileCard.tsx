import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Store, MapPin, MessageSquare, User, Phone, FileText, Pencil, X, Plus, Upload, Camera, Trash2 } from "lucide-react";
import { useState, useRef } from "react";

interface VendorProfileCardProps {
  profile: any;
  user: any;
  refetchProfile: () => void;
  toast: (opts: any) => void;
}

const VendorProfileCard = ({ profile, user, refetchProfile, toast }: VendorProfileCardProps) => {
  const [editing, setEditing] = useState(false);
  const [phones, setPhones] = useState<string[]>([]);
  const [shopName, setShopName] = useState("");
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const startEditing = () => {
    const existingPhones = profile?.phone ? profile.phone.split(",").map((p: string) => p.trim()) : [""];
    setPhones(existingPhones.length ? existingPhones : [""]);
    setShopName(profile?.shop_name || "");
    setFullName(profile?.full_name || "");
    setEditing(true);
  };

  const saveProfile = async () => {
    const cleanPhones = phones.map(p => p.trim()).filter(Boolean);
    if (cleanPhones.length === 0) {
      toast({ title: "Add at least one phone number", variant: "destructive" });
      return;
    }
    for (const p of cleanPhones) {
      if (!/^[\d+\-\s()]{6,15}$/.test(p)) {
        toast({ title: `Invalid phone: ${p}`, variant: "destructive" });
        return;
      }
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        phone: cleanPhones.join(", "),
        shop_name: shopName.trim() || null,
        full_name: fullName.trim() || null,
      })
      .eq("user_id", user!.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error saving profile", variant: "destructive" });
    } else {
      toast({ title: "✅ Profile updated!" });
      setEditing(false);
      refetchProfile();
    }
  };

  const uploadShopPhoto = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be under 5MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user!.id}/shop-photo.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("shop-photos")
      .upload(path, file, { upsert: true });

    if (uploadErr) {
      setUploading(false);
      toast({ title: "Upload failed", description: uploadErr.message, variant: "destructive" });
      return;
    }

    const { data: urlData } = supabase.storage.from("shop-photos").getPublicUrl(path);

    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ avatar_url: urlData.publicUrl })
      .eq("user_id", user!.id);

    setUploading(false);
    if (updateErr) {
      toast({ title: "Error saving photo URL", variant: "destructive" });
    } else {
      toast({ title: "📸 Shop photo updated!" });
      refetchProfile();
    }
  };

  const phoneList = profile?.phone ? profile.phone.split(",").map((p: string) => p.trim()).filter(Boolean) : [];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }} className="mb-6">
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start gap-4 mb-4">
            {/* Shop Photo */}
            <div className="relative group">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Shop"
                  className="h-14 w-14 rounded-xl object-cover border border-border"
                />
              ) : (
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <User className="h-7 w-7 text-primary" />
                </div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Camera className={`h-4 w-4 text-white ${uploading ? "animate-spin" : ""}`} />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadShopPhoto(f);
                  e.target.value = "";
                }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-lg truncate">{profile?.full_name || "—"}</p>
              <div className="flex items-center gap-2">
                <Badge variant={profile?.approval_status === "approved" ? "default" : "secondary"} className="text-[10px]">
                  {profile?.approval_status || "pending"}
                </Badge>
                {profile?.shop_name && (
                  <span className="text-xs text-muted-foreground truncate">{profile.shop_name}</span>
                )}
              </div>
            </div>

            <Button size="sm" variant="ghost" onClick={editing ? () => setEditing(false) : startEditing} className="shrink-0">
              {editing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            </Button>
          </div>

          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Full Name</label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" className="mt-1" maxLength={100} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Shop Name</label>
                <Input value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="Your shop name" className="mt-1" maxLength={100} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Phone Numbers</label>
                <div className="space-y-2 mt-1">
                  {phones.map((p, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        value={p}
                        onChange={(e) => {
                          const updated = [...phones];
                          updated[i] = e.target.value;
                          setPhones(updated);
                        }}
                        placeholder={`Phone ${i + 1}`}
                        maxLength={15}
                      />
                      {phones.length > 1 && (
                        <Button size="icon" variant="ghost" onClick={() => setPhones(phones.filter((_, j) => j !== i))} className="shrink-0">
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {phones.length < 3 && (
                    <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setPhones([...phones, ""])}>
                      <Plus className="h-3 w-3" /> Add Number
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={saveProfile} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {phoneList.length > 0 && phoneList.map((p: string, i: number) => (
                <div key={i} className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{p}</span>
                </div>
              ))}
              {profile?.gst_number && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span>GST: {profile.gst_number}</span>
                </div>
              )}
              {profile?.shop_address && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{profile.shop_address}</span>
                </div>
              )}
              {user?.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default VendorProfileCard;
