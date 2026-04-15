import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { generateCertificateHash } from "@/lib/hash";
import { Shield, LogOut, Search, CheckCircle, XCircle, ScanLine } from "lucide-react";

interface VerifyResult {
  valid: boolean;
  certificate?: {
    id: string;
    certificate_id: string;
    certificate_type: string;
    holder_name: string;
    status: string;
    hash: string;
    issued_at: string;
    application_id: string;
  };
}

export default function GovernmentDashboard() {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const verify = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      // Try by certificate_id first, then by hash
      let { data } = await supabase.from("certificates").select("*").eq("certificate_id", query.trim()).single();
      if (!data) {
        const res = await supabase.from("certificates").select("*").eq("hash", query.trim()).single();
        data = res.data;
      }
      if (data) {
        // Verify hash integrity
        const expectedHash = generateCertificateHash({
          name: data.holder_name,
          certificateType: data.certificate_type,
          certificateId: data.certificate_id,
          issueDate: data.issued_at,
        });
        setResult({ valid: expectedHash === data.hash, certificate: data });
      } else {
        setResult({ valid: false });
      }
    } catch {
      setResult({ valid: false });
    } finally {
      setLoading(false);
    }
  };

  const issueFinal = async () => {
    if (!result?.certificate) return;
    setProcessing(true);
    try {
      await supabase.from("certificates").update({ status: "government_verified" }).eq("id", result.certificate.id);
      await supabase.from("applications").update({ status: "government_verified" }).eq("id", result.certificate.application_id);
      toast({ title: "Final certificate issued!" });
      setResult({ ...result, certificate: { ...result.certificate, status: "government_verified" } });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const rejectCert = async () => {
    if (!result?.certificate) return;
    setProcessing(true);
    try {
      await supabase.from("certificates").update({ status: "government_rejected" }).eq("id", result.certificate.id);
      await supabase.from("applications").update({ status: "rejected", admin_notes: "Rejected by Government Authority" }).eq("id", result.certificate.application_id);
      toast({ title: "Certificate rejected and admin notified" });
      setResult({ ...result, certificate: { ...result.certificate, status: "government_rejected" } });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

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
              <Search className="h-4 w-4 mr-1" /> {loading ? "Verifying..." : "Verify"}
            </Button>
          </div>
        </motion.div>

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              {result.valid && result.certificate ? (
                <div className="glass-card p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <CheckCircle className="h-8 w-8 text-success" />
                    <div>
                      <h3 className="text-xl font-bold text-success">Valid Certificate</h3>
                      <p className="text-sm text-muted-foreground">Hash integrity verified — certificate is authentic</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="text-foreground">{result.certificate.holder_name}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="text-foreground">{result.certificate.certificate_type}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">ID</span><span className="text-foreground font-mono">{result.certificate.certificate_id}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className={`font-medium ${result.certificate.status === "government_verified" ? "text-success" : "text-warning"}`}>{result.certificate.status === "government_verified" ? "Officially Verified" : "Temporarily Verified"}</span></div>
                    <div>
                      <span className="text-muted-foreground text-xs">SHA-256 Hash</span>
                      <p className="font-mono text-xs break-all mt-1 bg-muted p-2 rounded text-foreground">{result.certificate.hash}</p>
                    </div>
                  </div>

                  {result.certificate.status === "temporary" && (
                    <div className="flex gap-3">
                      <Button variant="success" onClick={issueFinal} disabled={processing}>
                        <CheckCircle className="h-4 w-4 mr-1" /> Issue Final Certificate
                      </Button>
                      <Button variant="destructive" onClick={rejectCert} disabled={processing}>
                        <XCircle className="h-4 w-4 mr-1" /> Reject & Notify Admin
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="glass-card p-8 text-center">
                  <motion.div initial={{ scale: 1 }} animate={{ x: [0, -5, 5, -5, 5, 0] }} transition={{ duration: 0.4 }}>
                    <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-destructive mb-2">Invalid / Tampered Certificate</h3>
                  <p className="text-muted-foreground">The certificate ID or hash could not be verified. This may indicate tampering.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
