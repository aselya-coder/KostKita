import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Building2, GraduationCap, Home, ArrowRight, Mail, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in, redirect to appropriate dashboard
  React.useEffect(() => {
    if (user) {
      const path = user.role === "admin" ? "/admin" : user.role === "owner" ? "/owner-dashboard" : "/dashboard";
      navigate(path, { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simulate small delay for better UX
    setTimeout(() => {
      const success = login(email, password);
      if (!success) {
        setError("Email atau password salah. Silakan coba lagi.");
        setIsLoading(false);
      }
    }, 800);
  };

  const handleQuickLogin = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setError("");
  };

  const demoAccounts = [
    {
      role: "Student",
      email: "budi@student.com",
      password: "student123",
      icon: GraduationCap,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      role: "Owner",
      email: "sulam@owner.com",
      password: "owner123",
      icon: Building2,
      color: "bg-blue-50 text-blue-600",
    },
    {
      role: "Admin",
      email: "admin@koskita.com",
      password: "admin123",
      icon: ShieldCheck,
      color: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <BackButton to="/" className="mb-8" />
        
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Home className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-foreground">
              KosKita
            </span>
          </Link>
          <h1 className="text-3xl font-display font-bold text-foreground">Masuk ke Akun Anda</h1>
          <p className="text-muted-foreground mt-2">Gunakan email dan password terdaftar untuk masuk.</p>
        </div>

        <div className="bg-card rounded-3xl border border-border p-8 shadow-xl shadow-foreground/5 relative overflow-hidden">
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-sm font-bold text-foreground">Password</label>
                <Link to="#" className="text-xs font-semibold text-primary hover:underline">Lupa Password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full py-6 rounded-xl font-bold text-lg shadow-lg shadow-primary/20"
              disabled={isLoading}
            >
              {isLoading ? "Masuk..." : "Masuk ke Dashboard"}
            </Button>
          </form>

          {/* Decorative Background */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
        </div>

        <div className="mt-8">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center mb-4">Atau Gunakan Akun Demo</p>
          <div className="grid grid-cols-3 gap-3">
            {demoAccounts.map((acc) => (
              <button
                key={acc.role}
                onClick={() => handleQuickLogin(acc.email, acc.password)}
                className="p-3 rounded-2xl bg-card border border-border hover:border-primary hover:shadow-md transition-all text-center group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${acc.color}`}>
                  <acc.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground group-hover:text-primary transition-colors">{acc.role}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Belum punya akun? <Link to="/register" className="text-primary font-semibold hover:underline">Daftar Sekarang</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
