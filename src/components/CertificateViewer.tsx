import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Certificate {
  id: string;
  certificate_id: string;
  certificate_type: string;
  holder_name: string;
  status: string;
  hash: string;
  issued_at: string;
}

export default function CertificateViewer({ cert, onClose }: { cert: Certificate; onClose: () => void }) {
  const qrData = JSON.stringify({ id: cert.certificate_id, hash: cert.hash });

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card gradient-border p-8 max-w-lg w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold gradient-text mb-1">{cert.certificate_type}</h2>
          <p className="text-sm text-muted-foreground">
            {cert.status === "government_verified" ? "Officially Verified Certificate" : "Temporary Certificate"}
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="text-foreground font-medium">{cert.holder_name}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Certificate ID</span><span className="text-foreground font-mono text-sm">{cert.certificate_id}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Issued</span><span className="text-foreground">{new Date(cert.issued_at).toLocaleDateString()}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className={`font-medium ${cert.status === "government_verified" ? "text-success" : "text-warning"}`}>{cert.status === "government_verified" ? "Officially Verified" : "Temporarily Verified"}</span></div>
          <div>
            <span className="text-muted-foreground text-xs">SHA-256 Hash</span>
            <p className="text-foreground font-mono text-xs break-all mt-1 bg-muted p-2 rounded">{cert.hash}</p>
          </div>
        </div>

        <div className="flex justify-center mb-4">
          <div className="bg-foreground p-3 rounded-lg">
            <QRCodeSVG value={qrData} size={120} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
