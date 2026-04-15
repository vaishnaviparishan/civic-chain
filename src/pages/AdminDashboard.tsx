import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import StatusBadge from "@/components/StatusBadge";
import { Shield, LogOut, CheckCircle, XCircle, AlertTriangle, Bot, Eye } from "lucide-react";
import { generateCertificateHash } from "@/lib/hash";

interface Application {
  id: string;
  user_id: string;
  certificate_type: string;
  full_name: string;
  date_of_birth: string;
  address: string;
  photo_url: string;
  document_url: string;
  status: string;
  ai_confidence: number | null;
  ai_status: string | null;
  ai_notes: string | null;
  admin_notes: string | null;
  created_at: string;
}

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [apps, setApps] = useState<Application[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  const loadApps = async () => {
    const { data } = await supabase.from("applications").select("*").order("created_at", { ascending: false });
    setApps(data || []);
  };

  useEffect(() => { loadApps(); }, []);

  const runAiVerification = async (app: Application) => {
    setProcessing(app.id);
    try {
      const { data, error } = await supabase.functions.invoke("verify-document", {
        body: {
          applicationId: app.id,
          photoUrl: app.photo_url,
          documentUrl: app.document_url,
          fullName: app.full_name,
          certificateType: app.certificate_type,
        },
      });
      if (error) throw error;
      toast({ title: "AI Verification Complete", description: `Confidence: ${data.confidence}%` });
      await loadApps();
    } catch (err: any) {
      toast({ title: "AI Error", description: err.message, variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const approveApp = async (app: Application) => {
    setProcessing(app.id);
    try {
      const certId = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const issueDate = new Date().toISOString();
      const hash = generateCertificateHash({
        name: app.full_name,
        certificateType: app.certificate_type,
        certificateId: certId,
        issueDate,
      });

      await supabase.from("certificates").insert({
        application_id: app.id,
        user_id: app.user_id,
        certificate_id: certId,
        certificate_type: app.certificate_type,
        holder_name: app.full_name,
        status: "temporary",
        hash,
        issued_at: issueDate,
      });

      await supabase.from("applications").update({ status: "admin_approved" }).eq("id", app.id);
      toast({ title: "Approved!", description: "Temporary certificate generated." });
      await loadApps();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const rejectApp = async (app: Application) => {
    setProcessing(app.id);
    try {
      await supabase.from("applications").update({ status: "rejected", admin_notes: rejectReason || "Rejected by admin" }).eq("id", app.id);
      toast({ title: "Application rejected" });
      setRejectReason("");
      await loadApps();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ background: "linear-gradient(135deg, hsl(250,80%,15%) 0%, hsl(230,25%,7%) 50%, hsl(200,80%,10%) 100%)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold gradient-text">Admin Dashboard</h1>
          </div>
          <Button variant="ghost" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          {[
            { label: "Total", value: apps.length, color: "text-foreground" },
            { label: "Pending", value: apps.filter((a) => ["submitted", "ai_verified"].includes(a.status)).length, color: "text-warning" },
            { label: "Approved", value: apps.filter((a) => a.status === "admin_approved").length, color: "text-success" },
          ].map((s) => (
            <div key={s.label} className="glass-card p-4 text-center">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {apps.map((app, i) => (
            <motion.div key={app.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card overflow-hidden">
              <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(expanded === app.id ? null : app.id)}>
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-semibold text-foreground">{app.full_name}</h3>
                    <p className="text-sm text-muted-foreground">{app.certificate_type} • {new Date(app.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {app.ai_confidence !== null && (
                    <span className="text-xs text-muted-foreground">AI: {app.ai_confidence}%</span>
                  )}
                  <StatusBadge status={app.status} />
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <AnimatePresence>
                {expanded === app.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border">
                    <div className="p-6 space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Date of Birth</p>
                          <p className="text-foreground">{app.date_of_birth}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Address</p>
                          <p className="text-foreground">{app.address}</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Photo</p>
                          <img src={app.photo_url} alt="Photo" className="rounded-lg max-h-40 object-cover" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Document</p>
                          <img src={app.document_url} alt="Document" className="rounded-lg max-h-40 object-cover" />
                        </div>
                      </div>

                      {app.ai_status && (
                        <div className="glass-card p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Bot className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-foreground">AI Verification Result</span>
                          </div>
                          <p className="text-sm text-muted-foreground">Confidence: {app.ai_confidence}% • Status: {app.ai_status}</p>
                          {app.ai_notes && <p className="text-sm text-muted-foreground mt-1">{app.ai_notes}</p>}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3">
                        {app.status === "submitted" && (
                          <Button variant="secondary" onClick={() => runAiVerification(app)} disabled={processing === app.id}>
                            <Bot className="h-4 w-4 mr-1" /> {processing === app.id ? "Analyzing..." : "Run AI Verification"}
                          </Button>
                        )}
                        {["submitted", "ai_verified"].includes(app.status) && (
                          <>
                            <Button variant="success" onClick={() => approveApp(app)} disabled={processing === app.id}>
                              <CheckCircle className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <div className="flex gap-2">
                              <Input placeholder="Rejection reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="bg-muted border-border w-48" />
                              <Button variant="destructive" onClick={() => rejectApp(app)} disabled={processing === app.id}>
                                <XCircle className="h-4 w-4 mr-1" /> Reject
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
