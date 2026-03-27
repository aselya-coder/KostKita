import { Bell, Lock, Shield, Eye, Smartphone, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/AuthContext";
import { BackButton } from "@/components/BackButton";

export default function Settings() {
  const { user } = useAuth();
  const settingsSections = [
    {
      title: "Security",
      description: "Manage your password and account security.",
      items: [
        { title: "Two-Factor Authentication", description: "Add an extra layer of security to your account.", icon: Shield, active: true },
        { title: "Login Notifications", description: "Get notified when someone logs into your account.", icon: Bell, active: true },
      ]
    },
    {
      title: "Privacy",
      description: "Control your visibility and data sharing.",
      items: [
        { title: "Public Profile", description: "Make your profile visible to other users.", icon: Eye, active: true },
        { title: "Show Phone Number", description: "Display your WhatsApp number on your listings.", icon: Smartphone, active: true },
      ]
    }
  ];

  const basePath = user?.role === "admin" ? "/admin" : user?.role === "owner" ? "/owner-dashboard" : "/dashboard";

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <BackButton to={basePath} className="mb-0" />
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and security settings.</p>
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
          <h3 className="font-display font-bold text-foreground mb-6">Password</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Button variant="outline" className="rounded-xl py-6 border-border flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Change Password
            </Button>
            <Button variant="outline" className="rounded-xl py-6 border-border flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Language: English
            </Button>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row gap-4">
          <Button variant="destructive" className="flex-1 py-6 rounded-xl font-bold">
            Deactivate Account
          </Button>
          <Button className="flex-1 bg-primary hover:bg-primary/90 py-6 rounded-xl font-bold shadow-lg shadow-primary/20">
            Save All Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
