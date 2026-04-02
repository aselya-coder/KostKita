import { useState } from "react";
import { BackButton } from "@/components/BackButton";
import { 
  Settings as SettingsIcon, 
  Shield, 
  Globe, 
  Bell, 
  Database, 
  Percent, 
  Users, 
  Lock,
  Save,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function SystemSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsLoading] = useState(false);

  const handleSave = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Settings Saved",
        description: "System configuration has been updated successfully.",
      });
    }, 1500);
  };

  const sections = [
    {
      title: "Platform Configuration",
      icon: Globe,
      items: [
        { label: "Marketplace Service Fee (%)", type: "number", value: "5", description: "Fee charged to sellers for each successful transaction." },
        { label: "Premium Listing Price (IDR)", type: "number", value: "50000", description: "Monthly cost for owners to promote their kos as premium." },
      ]
    },
    {
      title: "Moderation & Safety",
      icon: Shield,
      items: [
        { label: "Auto-Approve Listings", type: "switch", value: false, description: "Automatically approve new listings without manual review." },
        { label: "User Reporting System", type: "switch", value: true, description: "Allow users to report suspicious content or accounts." },
        { label: "Email Verification Required", type: "switch", value: true, description: "Users must verify their email before posting listings." },
      ]
    },
    {
      title: "Maintenance",
      icon: Database,
      items: [
        { label: "Maintenance Mode", type: "switch", value: false, description: "Put the entire platform into maintenance mode for all users." },
        { label: "Debug Logs", type: "switch", value: true, description: "Enable detailed logging for system troubleshooting." },
      ]
    }
  ];

  const getBackPath = () => {
    if (!user) return "/";
    if (user.role === "admin") return "/admin";
    if (user.role === "owner") return "/owner-dashboard";
    return "/dashboard";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <BackButton to={getBackPath()} className="mb-0" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">System Settings</h1>
          <p className="text-muted-foreground text-sm">Global platform configuration and maintenance tools.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6"
        >
          {isSaving ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      <div className="space-y-6">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border bg-secondary/30 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <section.icon className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-display font-bold text-foreground">{section.title}</h3>
            </div>
            <div className="divide-y border-border">
              {section.items.map((item, itemIdx) => (
                <div key={itemIdx} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-foreground">{item.label}</h4>
                    <p className="text-xs text-muted-foreground max-w-md">{item.description}</p>
                  </div>
                  <div className="shrink-0">
                    {item.type === "switch" ? (
                      <Switch defaultChecked={item.value as boolean} />
                    ) : (
                      <input 
                        type="number" 
                        defaultValue={item.value as string}
                        className="w-32 px-3 py-2 rounded-lg bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-right font-mono"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
