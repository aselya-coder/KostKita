import { Building2, PlusCircle, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";
import { BackButton } from "@/components/BackButton";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const Owner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleDashboardClick = () => {
    if (user?.role === "owner") {
      navigate("/owner-dashboard");
    } else {
      navigate("/login");
    }
  };

  const handleAddKosClick = () => {
    if (user?.role === "owner") {
      navigate("/owner-dashboard/add-kos");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="container py-8">
      <BackButton to="/" />
      <div className="text-center py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-display font-bold mb-4">Pemilik Kos</h1>
          <p className="text-muted-foreground mb-12 max-w-lg mx-auto">
            Platform terbaik untuk mempromosikan kos Anda ke ribuan mahasiswa. Kelola properti Anda dengan mudah dan profesional.
          </p>
          
          <div className="grid gap-6 sm:grid-cols-2">
            <button
              onClick={handleAddKosClick}
              className="p-8 rounded-3xl border border-border bg-card hover:border-primary/50 hover:shadow-xl transition-all text-left group"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <PlusCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="font-display font-bold text-xl mb-2">Pasang Iklan</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Buat listing kos Anda hanya dalam beberapa menit dan mulai terima calon penghuni.
              </p>
            </button>

            <button
              onClick={handleDashboardClick}
              className="p-8 rounded-3xl border border-border bg-card hover:border-primary/50 hover:shadow-xl transition-all text-left group"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <LayoutDashboard className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-display font-bold text-xl mb-2">Dashboard</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Pantau statistik, kelola listing, dan lihat semua pertanyaan calon penghuni.
              </p>
            </button>
          </div>

          {!user && (
            <div className="mt-12">
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                Mulai Sebagai Pemilik Kos
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Owner;
