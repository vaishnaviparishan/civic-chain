import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import CitizenDashboard from "./pages/CitizenDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import GovernmentDashboard from "./pages/GovernmentDashboard";
import ApplyForm from "./pages/ApplyForm";
import VerifyPage from "./pages/VerifyPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="text-foreground">Loading...</div></div>;
  if (!user) return <Navigate to="/auth" />;
  if (allowedRoles && role && !allowedRoles.includes(role)) return <Navigate to="/" />;
  return <>{children}</>;
}

function AuthRedirect() {
  const { user, role, loading } = useAuth();
  if (loading) return null;
  if (user) {
    if (role === "admin") return <Navigate to="/admin" />;
    if (role === "government") return <Navigate to="/government" />;
    return <Navigate to="/citizen" />;
  }
  return <AuthPage />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthRedirect />} />
            <Route path="/citizen" element={<ProtectedRoute allowedRoles={["citizen"]}><CitizenDashboard /></ProtectedRoute>} />
            <Route path="/apply" element={<ProtectedRoute allowedRoles={["citizen"]}><ApplyForm /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/government" element={<ProtectedRoute allowedRoles={["government"]}><GovernmentDashboard /></ProtectedRoute>} />
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
