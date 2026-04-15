import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import StatusBadge from "@/components/StatusBadge";
import { Shield, LogOut, Search, CheckCircle, XCircle, ScanLine } from "lucide-react";

interface Certificate {
  id: string;
  certificate_id: string;
  certificate_type: string;
  holder_name: string;
  status: string;
  hash: string;
  issued_at: string;
  application_id: string | null;
}

export default function GovernmentDashboard() {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [searchResult, setSearchResult] = useState<Certificate | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [pendingCerts, setPendingCerts] = useState<Certificate[]>([]);

  const loadPending = async () => {
    const { data } = await supabase.from("certificates").select("*").eq("status", "temporary").order("issued_at", { ascending: false });
    setPendingCerts(data || []);
  };

  useEffect(() => { loadPending(); }, []);

  const verify = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearchResult(null);
    setNotFound(false);
    try {
      let { data } = await supabase.from("certificates").select("*").eq("certificate_id", query.trim()).single();
      if (!data) {
        const res = await supabase.from("certificates").select("*").eq("hash", query.trim()).single();
        data = res.data;
      }
      if (data) {
        setSearchResult(data);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const approveCert = async (cert: Certificate) => {
    setProcessing(true);
    try {
      await supabase.from("certificates").update({ status: "government_verified" }).eq("id", cert.id);
      if (cert.application_id) {
        await supabase.from("applications").update({ status: "government_verified" }).eq("id", cert.application_id);
      }
      toast({ title: "Final certificate issued!" });
      if (searchResult?.id === cert.id) setSearchResult({ ...cert, status: "government_verified" });
      await loadPending();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const rejectCert = async (cert: Certificate) => {
    setProcessing(true);
    try {
      await supabase.from("certificates").update({ status: "government_rejected" }).eq("id", cert.id);
      if (cert.application_id) {
        await supabase.from("applications").update({ status: "rejected", admin_notes: "Rejected by Government Authority" }).eq("id", cert.application_id);
      }
      toast({ title: "Certificate rejected" });
      if (searchResult?.id === cert.id) setSearchResult({ ...cert, status: "government_rejected" });
      await loadPending();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const renderCertCard = (cert: Certificate, showActions: boolean) => (
    <div className="glass-card p-6" key={cert.id}>
      <div className="space-y-2 mb-4">
        <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="text-foreground font-medium">{cert.holder_name}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="text-foreground">{cert.certificate_type}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">ID</span><span className="text-foreground font-mono text-sm">{cert.certificate_id}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Issued</span><span className="text-foreground">{new Date(cert.issued_at).toLocaleDateString()}</span></div>
        <div className="flex justify-between items-center"><span className="text-muted-foreground">Status</span><StatusBadge status={cert.status} /></div>
        <div>
          <span className="text-muted-foreground text-xs">SHA-256 Hash</span>
          <p className="font-mono text-xs break-all mt-1 bg-muted p-2 rounded text-foreground">{cert.hash}</p>
        </div>
      </div>
      {showActions && cert.status === "temporary" && (
        <div className="flex gap-3">
          <Button variant="success" onClick={() => approveCert(cert)} disabled={processing}>
            <CheckCircle className="h-4 w-4 mr-1" /> Issue Final Certificate
          </Button>
          <Button variant="destructive" onClick={() => rejectCert(cert)} disabled={processing}>
            <XCircle className="h-4 w-4 mr-1" /> Reject
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen p-6" style={{ background: "linear-gradient(135deg, hsl(250,80%,15%) 0%, hsl(230,25%,7%) 50%, hsl(200,80%,10%) 100%)" }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-accent" />
            <h1 className="text-2xl font-bold gradient-text">Government Verification</h1>
          </div>
          <Button variant="ghost" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
        </div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card gradient-border p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <ScanLine className="h-6 w-6 text-accent" />
            <h2 className="text-xl font-semibold text-foreground">Verify Certificate</h2>
          </div>
          <p className="text-muted-foreground mb-4">Enter a Certificate ID or SHA-256 Hash to verify authenticity.</p>
          <div className="flex gap-3">
            <Input
              placeholder="Certificate ID or SHA-256 Hash"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && verify()}
              className="bg-muted border-border flex-1 font-mono"
            />
            <Button variant="gradient" onClick={verify} disabled={loading}>
              <Search className="h-4 w-4 mr-1" /> {loading ? "..." : "Verify"}
            </Button>
          </div>
        </motion.div>

        {/* Search result */}
        <AnimatePresence>
          {searchResult && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="h-6 w-6 text-success" />
                <h3 className="text-lg font-semibold text-success">Certificate Found</h3>
              </div>
              {renderCertCard(searchResult, true)}
            </motion.div>
          )}
          {notFound && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-card p-8 text-center mb-8">
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-xl font-bold text-destructive mb-2">Invalid / Tampered Certificate</h3>
              <p className="text-muted-foreground">No matching certificate found in the database.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pending certificates list */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Pending Temporary Certificates ({pendingCerts.length})</h2>
          {pendingCerts.length === 0 ? (
            <div className="glass-card p-6 text-center text-muted-foreground">No pending certificates.</div>
          ) : (
            <div className="space-y-4">
              {pendingCerts.map((cert) => renderCertCard(cert, true))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
