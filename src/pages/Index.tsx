import { Shield } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(250,80%,15%) 0%, hsl(230,25%,7%) 40%, hsl(200,80%,10%) 100%)" }}>
      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20" style={{ background: "radial-gradient(circle, hsl(250,80%,60%) 0%, transparent 70%)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full opacity-15" style={{ background: "radial-gradient(circle, hsl(180,70%,50%) 0%, transparent 70%)" }} />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center relative z-10">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }} className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/20 mb-6 neon-glow">
          <Shield className="h-10 w-10 text-primary" />
        </motion.div>

        <h1 className="text-5xl md:text-6xl font-bold gradient-text mb-4">CivicDocs AI</h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
          Multi-Level Government Certificate Verification System powered by AI
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="gradient" size="lg" onClick={() => navigate("/auth")}>
              Get Started
            </Button>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-16 max-w-3xl">
          {[
            { title: "AI Verification", desc: "Automated document analysis with confidence scoring" },
            { title: "Multi-Level Auth", desc: "Citizen → Admin → Government verification pipeline" },
            { title: "Tamper-Proof", desc: "SHA-256 hashing and QR codes for certificate integrity" },
          ].map((item, i) => (
            <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.15 }} className="glass-card p-6 text-center">
              <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
