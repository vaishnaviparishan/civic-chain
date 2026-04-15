import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield, Search, CheckCircle, XCircle } from "lucide-react";

interface Certificate {
  id: string;
  certificate_id: string;
  certificate_type: string;
  holder_name: string;
  status: string;
  hash: string;
  issued_at: string;
}

export default function VerifyPage() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Certificate | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  const verify = async (input: string) => {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    setNotFound(false);
    try {
      let { data } = await supabase.from("certificates").select("*").eq("certificate_id", input.trim()).single();
      if (!data) {
        const res = await supabase.from("certificates").select("*").eq("hash", input.trim()).single();
        data = res.data;
      }
      if (data) {
        setResult(data);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hash = searchParams.get("hash");
    const certId = searchParams.get("id");
    const autoQuery = hash || certId;
    if (autoQuery) {
      setQuery(autoQuery);
      verify(autoQuery);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen p-6" style={{ background: "linear-gradient(135deg, hsl(250,80%,15%) 0%, hsl(230,25%,7%) 50%, hsl(200,80%,10%) 100%)" }}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-accent" />
          <h1 className="text-2xl font-bold gradient-text">Certificate Verification</h1>
        </div>

        <div className="glass-card p-8 mb-8">
          <p className="text-muted-foreground mb-4">Enter a Certificate ID or SHA-256 Hash to verify.</p>
          <div className="flex gap-3">
            <Input
              placeholder="Certificate ID or Hash"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && verify(query)}
              className="bg-muted border-border flex-1 font-mono"
            />
            <Button variant="gradient" onClick={() => verify(query)} disabled={loading}>
              <Search className="h-4 w-4 mr-1" /> {loading ? "..." : "Verify"}
            </Button>
          </div>
        </div>

        {result && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle className="h-8 w-8 text-success" />
              <div>
                <h3 className="text-xl font-bold text-success">Valid Certificate</h3>
                <p className="text-sm text-muted-foreground">
                  {result.status === "government_verified" ? "Officially Verified" : "Temporarily Verified"}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="text-foreground font-medium">{result.holder_name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="text-foreground">{result.certificate_type}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">ID</span><span className="text-foreground font-mono text-sm">{result.certificate_id}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Issued</span><span className="text-foreground">{new Date(result.issued_at).toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className={`font-medium ${result.status === "government_verified" ? "text-success" : "text-warning"}`}>{result.status === "government_verified" ? "Officially Verified" : result.status === "government_rejected" ? "Rejected" : "Temporarily Verified"}</span></div>
              <div>
                <span className="text-muted-foreground text-xs">SHA-256 Hash</span>
                <p className="font-mono text-xs break-all mt-1 bg-muted p-2 rounded text-foreground">{result.hash}</p>
              </div>
            </div>
          </motion.div>
        )}

        {notFound && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-8 text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-xl font-bold text-destructive mb-2">Invalid / Tampered Certificate</h3>
            <p className="text-muted-foreground">No matching certificate found in the database.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
