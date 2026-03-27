import { User, Mail, Phone, MapPin, Calendar, Shield, Camera } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BackButton } from "@/components/BackButton";

export default function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  const basePath = user.role === "admin" ? "/admin" : user.role === "owner" ? "/owner-dashboard" : "/dashboard";

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <BackButton to={basePath} className="mb-0" />
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Account Profile</h1>
        <p className="text-muted-foreground">Manage your personal information and public profile.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm text-center">
            <div className="relative inline-block mx-auto mb-4">
              <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors border-2 border-background">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <h3 className="text-lg font-display font-bold">{user.name}</h3>
            <p className="text-sm text-muted-foreground capitalize mb-4">{user.role}</p>
            <div className="flex justify-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                Verified
              </span>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Member Since</h4>
            <div className="flex items-center gap-3 text-foreground">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{new Date(user.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Right Column - Forms */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm space-y-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    defaultValue={user.name}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    defaultValue={user.email}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted border border-border text-muted-foreground cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold ml-1">WhatsApp Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    defaultValue={user.phone}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold ml-1">City / Region</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    defaultValue={user.location || "Depok, Indonesia"}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold ml-1">About Me</label>
              <textarea 
                rows={4}
                placeholder="Tell us a bit about yourself..."
                className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button className="bg-primary hover:bg-primary/90 px-8 py-6 rounded-xl font-bold shadow-lg shadow-primary/20">
                Save Changes
              </Button>
            </div>
          </div>

          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-red-900 font-bold text-sm mb-1">Privacy Protection</h4>
              <p className="text-red-700 text-xs leading-relaxed">
                Your email address and WhatsApp number are only visible to verified users who interact with your listings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
