import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, GraduationCap, Home, ArrowRight, User, Mail, Lock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";
import { useAuth } from "@/context/AuthContext";

const Register = () => {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<"student" | "owner" | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleRoleSelect = (selectedRole: "student" | "owner") => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role) {
      // In a real app, you'd send data to API
      // For now, we'll just mock a successful registration and login
      login(role);
      const path = role === "owner" ? "/owner-dashboard" : "/dashboard";
      navigate(path);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <BackButton to={step === 1 ? "/" : undefined} onClick={step === 2 ? () => setStep(1) : undefined} className="mb-8" />
        
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
            {step === 1 ? "Pilih peran Anda untuk memulai." : `Lengkapi data diri Anda sebagai ${role === 'owner' ? 'Pemilik Kos' : 'Mahasiswa'}.`}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid gap-4 sm:grid-cols-2"
            >
              <button
                onClick={() => handleRoleSelect("student")}
                className="p-8 rounded-2xl bg-card border border-border hover:border-primary hover:shadow-xl transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
                  Mahasiswa
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Cari kos, belanja di marketplace, dan simpan favorit Anda.
                </p>
              </button>

              <button
                onClick={() => handleRoleSelect("owner")}
                className="p-8 rounded-2xl bg-card border border-border hover:border-primary hover:shadow-xl transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
                  Pemilik Kos
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Pasang iklan kos, kelola properti, dan jual barang Anda.
                </p>
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-card border border-border rounded-2xl p-8 shadow-sm"
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground ml-1">Nama Lengkap</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      required
                      type="text"
                      placeholder="Masukkan nama lengkap"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground ml-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      required
                      type="email"
                      placeholder="nama@email.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground ml-1">Nomor WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      required
                      type="tel"
                      placeholder="0812xxxx"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground ml-1">Kata Sandi</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      required
                      type="password"
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full py-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-base mt-4 shadow-lg shadow-primary/20 group">
                  Daftar Sekarang
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-10 text-center text-sm text-muted-foreground">
          <p>Sudah punya akun? <Link to="/login" className="text-primary font-semibold hover:underline">Masuk di sini</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
