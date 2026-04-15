import { motion } from "framer-motion";

const statusConfig: Record<string, { label: string; className: string }> = {
  submitted: { label: "Submitted", className: "status-pending" },
  ai_verified: { label: "AI Verified", className: "status-verified" },
  ai_suspicious: { label: "AI Suspicious", className: "status-pending" },
  ai_rejected: { label: "AI Rejected", className: "status-rejected" },
  admin_approved: { label: "Admin Approved", className: "status-verified" },
  needs_review: { label: "Needs Review", className: "status-pending" },
  rejected: { label: "Rejected", className: "status-rejected" },
  temporary: { label: "Temporary", className: "status-pending" },
  government_verified: { label: "Officially Verified", className: "status-verified" },
  government_rejected: { label: "Gov. Rejected", className: "status-rejected" },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, className: "bg-muted text-muted-foreground" };
  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </motion.span>
  );
}
