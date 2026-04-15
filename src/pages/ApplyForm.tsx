import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Upload, FileText } from "lucide-react";

const CERT_TYPES = ["Birth Certificate", "Death Certificate", "Aadhaar Card", "PAN Card", "Passport", "Voter ID"];

export default function ApplyForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [certType, setCertType] = useState("");
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [document, setDocument] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const uploadFile = async (file: File, path: string) => {
    const { error } = await supabase.storage.from("documents").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("documents").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !photo || !document) return;
    setLoading(true);
    try {
      const ts = Date.now();
      const photoUrl = await uploadFile(photo, `${user.id}/photo_${ts}`);
      const docUrl = await uploadFile(document, `${user.id}/doc_${ts}`);

      const { error } = await supabase.from("applications").insert({
        user_id: user.id,
        full_name: fullName,
        certificate_type: certType,
        date_of_birth: dob,
        address,
        photo_url: photoUrl,
        document_url: docUrl,
        status: "submitted",
      });
      if (error) throw error;
      toast({ title: "Application submitted!" });
      navigate("/citizen");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ background: "linear-gradient(135deg, hsl(250,80%,15%) 0%, hsl(230,25%,7%) 50%, hsl(200,80%,10%) 100%)" }}>
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold gradient-text">Apply for Certificate</h1>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Certificate Type</Label>
              <Select value={certType} onValueChange={setCertType}>
                <SelectTrigger className="mt-1 bg-muted border-border"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {CERT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Full Name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required className="mt-1 bg-muted border-border" />
            </div>
            <div>
              <Label>Date of Birth</Label>
              <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required className="mt-1 bg-muted border-border" />
            </div>
            <div>
              <Label>Address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} required className="mt-1 bg-muted border-border" />
            </div>
            <div>
              <Label>Photo</Label>
              <div className="mt-1 flex items-center gap-2">
                <label className="glass-card p-3 cursor-pointer flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Upload className="h-4 w-4" />
                  {photo ? photo.name : "Upload photo"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
                </label>
              </div>
            </div>
            <div>
              <Label>ID Document</Label>
              <div className="mt-1 flex items-center gap-2">
                <label className="glass-card p-3 cursor-pointer flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Upload className="h-4 w-4" />
                  {document ? document.name : "Upload document"}
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setDocument(e.target.files?.[0] || null)} />
                </label>
              </div>
            </div>
            <Button type="submit" variant="gradient" className="w-full" disabled={loading || !certType}>
              {loading ? "Submitting..." : "Submit Application"}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
