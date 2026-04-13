import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, GraduationCap, Home, ArrowRight, User, Mail, Lock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "student" as "student" | "owner"
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { signup } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleRoleChange = (role: "student" | "owner") => {
    setFormData(prev => ({ ...prev, role }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    const result = await signup(formData.email, formData.password, {
      name: formData.name,
      role: formData.role,
      phone: formData.phone,
    });

    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error || "Gagal mendaftar. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
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
          <h1 className="text-3xl font-display font-bold text-foreground">Daftar Akun Baru</h1>
          <p className="text-muted-foreground mt-2">
            Lengkapi data diri Anda untuk mulai menggunakan KosKita.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-3xl p-8 shadow-xl shadow-foreground/5 relative overflow-hidden"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm"
              >
                {error}
              </motion.div>
            )}
            <div className="grid grid-cols-2 gap-4 mb-2">
              <button
                type="button"
                onClick={() => handleRoleChange("student")}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2",
                  formData.role === "student" 
                    ? "border-primary bg-primary/5 text-primary" 
                    : "border-border bg-surface text-muted-foreground hover:border-border/80"
                )}
              >
                <GraduationCap className={cn("w-6 h-6", formData.role === "student" ? "text-primary" : "text-muted-foreground")} />
                <span className="text-xs font-bold">Pencari Kos</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange("owner")}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2",
                  formData.role === "owner" 
                    ? "border-primary bg-primary/5 text-primary" 
                    : "border-border bg-surface text-muted-foreground hover:border-border/80"
                )}
              >
                <Building2 className={cn("w-6 h-6", formData.role === "owner" ? "text-primary" : "text-muted-foreground")} />
                <span className="text-xs font-bold">Pemilik Kos</span>
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground ml-1">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  type="text"
                  placeholder="Masukkan nama lengkap"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  type="email"
                  placeholder="name@example.com"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground ml-1">Nomor WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  required
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  type="tel"
                  placeholder="0812xxxx"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground ml-1">Kata Sandi</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  required
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full py-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-base mt-4 shadow-lg shadow-primary/20 group"
              disabled={isLoading}
            >
              {isLoading ? "Mendaftar..." : "Daftar Sekarang"}
              {!isLoading && <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
            </Button>
          </form>
        </motion.div>

        <div className="mt-10 text-center text-sm text-muted-foreground">
          <p>Sudah punya akun? <Link to="/login" className="text-primary font-semibold hover:underline">Masuk di sini</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
