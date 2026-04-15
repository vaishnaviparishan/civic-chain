import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Shield, FileText, Plus, LogOut, Clock, CheckCircle, XCircle, AlertTriangle, Verified } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import CertificateViewer from "@/components/CertificateViewer";

interface Application {
  id: string;
  certificate_type: string;
  full_name: string;
  status: string;
  created_at: string;
  ai_confidence?: number;
  admin_notes?: string;
}

interface Certificate {
  id: string;
  certificate_id: string;
  certificate_type: string;
  holder_name: string;
  status: string;
  hash: string;
  issued_at: string;
}

export default function CitizenDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [apps, setApps] = useState<Application[]>([]);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: a } = await supabase.from("applications").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setApps(a || []);
      const { data: c } = await supabase.from("certificates").select("*").eq("user_id", user.id).order("issued_at", { ascending: false });
      setCerts(c || []);
    };
    load();
  }, [user]);

  const statusSteps = ["submitted", "ai_verified", "admin_approved", "government_verified"];
  const statusLabels: Record<string, string> = {
    submitted: "Submitted",
    ai_verified: "AI Verified",
    admin_approved: "Admin Approved",
    government_verified: "Government Verified",
    rejected: "Rejected",
  };

  const getStepIndex = (status: string) => {
    const idx = statusSteps.indexOf(status);
    return idx >= 0 ? idx : -1;
  };

  return (
    <div className="min-h-screen p-6" style={{ background: "linear-gradient(135deg, hsl(250,80%,15%) 0%, hsl(230,25%,7%) 50%, hsl(200,80%,10%) 100%)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold gradient-text">CivicDocs AI</h1>
          </div>
          <div className="flex gap-3">
            <Button variant="gradient" onClick={() => navigate("/apply")}>
              <Plus className="h-4 w-4 mr-1" /> Apply
            </Button>
            <Button variant="ghost" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">My Applications</h2>
          {apps.length === 0 ? (
            <div className="glass-card p-8 text-center text-muted-foreground">
              No applications yet. Click "Apply" to get started.
            </div>
          ) : (
            apps.map((app, i) => (
              <motion.div key={app.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground">{app.certificate_type}</h3>
                    <p className="text-sm text-muted-foreground">{app.full_name} • {new Date(app.created_at).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
                {app.status !== "rejected" && (
                  <div className="flex items-center gap-2 mt-4">
                    {statusSteps.map((step, idx) => {
                      const current = getStepIndex(app.status);
                      const active = idx <= current;
                      return (
                        <div key={step} className="flex items-center gap-2 flex-1">
                          <div className={`h-3 w-3 rounded-full transition-all ${active ? "bg-primary neon-glow" : "bg-muted"}`} />
                          <span className={`text-xs ${active ? "text-foreground" : "text-muted-foreground"}`}>{statusLabels[step]}</span>
                          {idx < statusSteps.length - 1 && <div className={`flex-1 h-0.5 ${active ? "bg-primary/50" : "bg-muted"}`} />}
                        </div>
                      );
                    })}
                  </div>
                )}
                {app.status === "rejected" && app.admin_notes && (
                  <p className="text-sm text-destructive mt-2">Reason: {app.admin_notes}</p>
                )}
              </motion.div>
            ))
          )}

          {certs.length > 0 && (
            <>
              <h2 className="text-xl font-semibold text-foreground mt-8">My Certificates</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {certs.map((cert) => (
                  <motion.div key={cert.id} whileHover={{ scale: 1.02 }} className="glass-card gradient-border p-6 cursor-pointer" onClick={() => setSelectedCert(cert)}>
                    <div className="flex items-center gap-3 mb-2">
                      <Verified className="h-5 w-5 text-accent" />
                      <h3 className="font-semibold text-foreground">{cert.certificate_type}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">ID: {cert.certificate_id}</p>
                    <StatusBadge status={cert.status} />
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </motion.div>

        {selectedCert && <CertificateViewer cert={selectedCert} onClose={() => setSelectedCert(null)} />}
      </div>
    </div>
  );
}
