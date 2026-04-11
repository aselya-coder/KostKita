import { Bell, Lock, Shield, Eye, Smartphone, Globe, Loader2, Languages, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { BackButton } from "@/components/BackButton";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function Settings() {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [language, setLanguage] = useState<'id' | 'en'>('id');

  // Translations object
  const translations = {
    id: {
      title: "Pengaturan",
      subtitle: "Kelola preferensi akun dan pengaturan keamanan Anda.",
      security: {
        title: "Keamanan",
        desc: "Kelola kata sandi dan keamanan akun Anda.",
        tfa: "Autentikasi Dua Faktor",
        tfaDesc: "Tambahkan lapisan keamanan ekstra ke akun Anda.",
        loginNotif: "Notifikasi Login",
        loginNotifDesc: "Dapatkan notifikasi saat seseorang masuk ke akun Anda."
      },
      privacy: {
        title: "Privasi",
        desc: "Kontrol visibilitas dan berbagi data Anda.",
        publicProfile: "Profil Publik",
        publicProfileDesc: "Buat profil Anda terlihat oleh pengguna lain.",
        showPhone: "Tampilkan Nomor Telepon",
        showPhoneDesc: "Tampilkan nomor WhatsApp Anda di iklan Anda."
      },
      passwordSection: "Password & Bahasa",
      changePassword: "Ubah Password",
      langLabel: "Bahasa",
      modal: {
        title: "Ubah Password",
        desc: "Masukkan password baru Anda di bawah ini. Pastikan aman dan mudah diingat.",
        newPass: "Password Baru",
        confirmPass: "Konfirmasi Password",
        placeholder: "Minimal 6 karakter",
        repeat: "Ulangi password baru",
        cancel: "Batal",
        save: "Simpan Password"
      },
      deactivate: "Nonaktifkan Akun",
      saveAll: "Simpan Semua Perubahan",
      toast: {
        langChanged: "Bahasa diubah ke Indonesia",
        passMin: "Password minimal harus 6 karakter.",
        passMismatch: "Konfirmasi password tidak cocok.",
        passSuccess: "Password berhasil diperbarui!",
        settingsSaved: "Pengaturan berhasil diperbarui!"
      }
    },
    en: {
      title: "Settings",
      subtitle: "Manage your account preferences and security settings.",
      security: {
        title: "Security",
        desc: "Manage your password and account security.",
        tfa: "Two-Factor Authentication",
        tfaDesc: "Add an extra layer of security to your account.",
        loginNotif: "Login Notifications",
        loginNotifDesc: "Get notified when someone logs into your account."
      },
      privacy: {
        title: "Privacy",
        desc: "Control your visibility and data sharing.",
        publicProfile: "Public Profile",
        publicProfileDesc: "Make your profile visible to other users.",
        showPhone: "Show Phone Number",
        showPhoneDesc: "Display your WhatsApp number on your listings."
      },
      passwordSection: "Password & Language",
      changePassword: "Change Password",
      langLabel: "Language",
      modal: {
        title: "Change Password",
        desc: "Enter your new password below. Make sure it's secure and easy to remember.",
        newPass: "New Password",
        confirmPass: "Confirm Password",
        placeholder: "Minimum 6 characters",
        repeat: "Repeat new password",
        cancel: "Cancel",
        save: "Save Password"
      },
      deactivate: "Deactivate Account",
      saveAll: "Save All Changes",
      toast: {
        langChanged: "Language changed to English",
        passMin: "Password must be at least 6 characters.",
        passMismatch: "Password confirmation does not match.",
        passSuccess: "Password updated successfully!",
        settingsSaved: "Settings updated successfully!"
      }
    }
  };

  const t = translations[language];
  
  // Password Change States
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    new: '',
    confirm: ''
  });

  const handleLanguageToggle = () => {
    const nextLang = language === 'id' ? 'en' : 'id';
    setLanguage(nextLang);
    toast.success(translations[nextLang].toast.langChanged);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new.length < 6) {
      toast.error(t.toast.passMin);
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast.error(t.toast.passMismatch);
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      });

      if (error) throw error;

      toast.success(t.toast.passSuccess);
      setIsPasswordModalOpen(false);
      setPasswords({ new: '', confirm: '' });
    } catch (error: any) {
      toast.error(error.message || "Gagal memperbarui password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate saving as most of these settings are placeholders for now
    setTimeout(() => {
      setIsSaving(false);
      toast.success(t.toast.settingsSaved);
    }, 800);
  };

  const settingsSections = [
    {
      title: t.security.title,
      description: t.security.desc,
      items: [
        { title: t.security.tfa, description: t.security.tfaDesc, icon: Shield, active: true },
        { title: t.security.loginNotif, description: t.security.loginNotifDesc, icon: Bell, active: true },
      ]
    },
    {
      title: t.privacy.title,
      description: t.privacy.desc,
      items: [
        { title: t.privacy.publicProfile, description: t.privacy.publicProfileDesc, icon: Eye, active: true },
        { title: t.privacy.showPhone, description: t.privacy.showPhoneDesc, icon: Smartphone, active: true },
      ]
    }
  ];

  const basePath = user?.role === "admin" ? "/admin" : "/dashboard";

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <BackButton to={basePath} className="mb-0" />
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">{t.title}</h1>
        <p className="text-muted-foreground">{t.subtitle}</p>
      </div>

      <div className="space-y-6">
        {settingsSections.map((section, idx) => (
          <div key={idx} className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border bg-secondary/30">
              <h3 className="font-display font-bold text-foreground">{section.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{section.description}</p>
            </div>
            <div className="divide-y border-border">
              {section.items.map((item, itemIdx) => (
                <div key={itemIdx} className="p-6 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                    </div>
                  </div>
                  <Switch defaultChecked={item.active} />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h3 className="font-display font-bold text-foreground mb-6">{t.passwordSection}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Button 
              variant="outline" 
              onClick={() => setIsPasswordModalOpen(true)}
              className="rounded-xl py-6 border-border flex items-center gap-2 hover:bg-secondary/50 transition-colors"
            >
              <Lock className="w-4 h-4" />
              {t.changePassword}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleLanguageToggle}
              className="rounded-xl py-6 border-border flex items-center gap-2 hover:bg-secondary/50 transition-colors"
            >
              <Globe className="w-4 h-4" />
              {t.langLabel}: {language === 'id' ? 'Indonesia' : 'English'}
            </Button>
          </div>
        </div>

        {/* Password Change Dialog */}
        <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
          <DialogContent className="sm:max-w-[425px] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-display font-bold">{t.modal.title}</DialogTitle>
              <DialogDescription>
                {t.modal.desc}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePasswordChange} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">{t.modal.newPass}</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwords.new}
                  onChange={(e) => setPasswords(p => ({ ...p, new: e.target.value }))}
                  placeholder={t.modal.placeholder}
                  className="rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">{t.modal.confirmPass}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                  placeholder={t.modal.repeat}
                  className="rounded-xl"
                  required
                />
              </div>
              <DialogFooter className="pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="rounded-xl"
                >
                  {t.modal.cancel}
                </Button>
                <Button 
                  type="submit" 
                  disabled={isChangingPassword}
                  className="bg-primary hover:bg-primary/90 rounded-xl"
                >
                  {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {t.modal.save}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <div className="pt-4 flex flex-col sm:flex-row gap-4">
          <Button variant="destructive" className="flex-1 py-6 rounded-xl font-bold">
            {t.deactivate}
          </Button>
          <Button 
            disabled={isSaving}
            onClick={handleSave}
            className="flex-1 bg-primary hover:bg-primary/90 py-6 rounded-xl font-bold shadow-lg shadow-primary/20"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : null}
            {t.saveAll}
          </Button>
        </div>
      </div>
    </div>
  );
}
