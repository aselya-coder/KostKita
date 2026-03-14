import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Building2, GraduationCap, Home, ArrowRight } from "lucide-react";
import { BackButton } from "@/components/BackButton";

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to appropriate dashboard
  React.useEffect(() => {
    if (user) {
      const path = user.role === "admin" ? "/admin" : user.role === "owner" ? "/owner-dashboard" : "/dashboard";
      navigate(path, { replace: true });
    }
  }, [user, navigate]);

  const handleRoleLogin = (role: "admin" | "owner" | "student") => {
    login(role);
    const path = role === "admin" ? "/admin" : role === "owner" ? "/owner-dashboard" : "/dashboard";
    navigate(path);
  };

  const roles = [
    {
      id: "student" as const,
      title: "Mahasiswa",
      description: "Cari kos, marketplace, dan kelola favorit Anda.",
      icon: GraduationCap,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      id: "owner" as const,
      title: "Pemilik Kos",
      description: "Pasang iklan kos dan kelola properti Anda.",
      icon: Building2,
      color: "bg-blue-50 text-blue-600",
    },
    {
      id: "admin" as const,
      title: "Administrator",
      description: "Kelola pengguna dan moderasi konten platform.",
      icon: ShieldCheck,
      color: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <BackButton to="/" className="mb-8" />
        
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Home className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-foreground">
              KosKita
            </span>
          </Link>
          <h1 className="text-3xl font-display font-bold text-foreground">Masuk ke Akun Anda</h1>
          <p className="text-muted-foreground mt-2">Pilih peran Anda untuk masuk ke dashboard yang sesuai.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {roles.map((role, index) => (
            <motion.button
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleRoleLogin(role.id)}
              className="p-6 rounded-2xl bg-card border border-border hover:border-primary hover:shadow-xl transition-all text-left group flex flex-col h-full"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${role.color}`}>
                <role.icon className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
                {role.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                {role.description}
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Pilih <ArrowRight className="w-4 h-4" />
              </div>
            </motion.button>
          ))}
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Belum punya akun? <Link to="/register" className="text-primary font-semibold hover:underline">Daftar Sekarang</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
