import { useState, useRef, useEffect } from "react";
import { User, Mail, Phone, MapPin, Calendar, Shield, Camera, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BackButton } from "@/components/BackButton";
import { uploadFile } from "@/services/storage";
import { updateUserProfile } from "@/services/marketplace";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function Profile() {
  const { user, fetchUserProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [location, setLocation] = useState(user?.location || "");
  const [about, setAbout] = useState(user?.about || "");

  // Sync local state with user object from context
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setLocation(user.location || "");
      setAbout(user.about || "");
    }
  }, [user]);

  // Sync local state with user object from context
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setLocation(user.location || "");
      setAbout(user.about || "");
    }
  }, [user]);

  if (!user) return null;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);

      const fileName = `avatar-${Date.now()}-${file.name.replace(/\s/g, '_')}`;
      const path = `${user.id}/${fileName}`;
      
      const { url, error } = await uploadFile('avatars', path, file);

      if (error) {
        toast.error("Failed to upload avatar");
        setIsUploading(false);
        return;
      }

      if (url) {
        // Update profile in database
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar: url })
          .eq('id', user.id);

        if (updateError) {
          toast.error("Failed to update profile");
        } else {
          toast.success("Avatar updated successfully!");
          // The AuthContext should ideally handle the user state update, 
          // but for now, we might need to refresh or the user will see it on next load
          // In a real app, you'd update the context user object.
          await fetchUserProfile(); // Re-fetch user profile to update context
          toast.success("Avatar updated successfully!");
        }
      }
      setIsUploading(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (!user) return;

    setIsUpdating(true);
    try {
      await updateUserProfile(user.id, { name, phone, location, about });
      await fetchUserProfile(); // Re-fetch user profile to update context
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

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
                <AvatarFallback className="text-2xl">{user?.name ? user.name.charAt(0) : "U"}</AvatarFallback>
              </Avatar>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors border-2 border-background disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarChange} 
                accept="image/*" 
                className="hidden" 
              />
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
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold ml-1">City / Region</label>
                  {user.location && (
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(user.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-primary hover:underline flex items-center gap-1 font-bold uppercase tracking-tighter"
                    >
                      <MapPin className="w-3 h-3" />
                      Cek di Maps
                    </a>
                  )}
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold ml-1">About Me</label>
              <textarea 
                rows={4}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Tell us a bit about yourself..."
                className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button 
                onClick={handleProfileUpdate}
                disabled={isUpdating || isUploading}
                className="bg-primary hover:bg-primary/90 px-8 py-6 rounded-xl font-bold shadow-lg shadow-primary/20"
              >
                {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
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