import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Plus, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function AddBoardingHouse() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const amenitiesList = [
    "WiFi", "AC", "Kamar Mandi Dalam", "Parkir", "Laundry", "CCTV", "Dapur Bersama", "Penjaga Kos"
  ];

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity) 
        : [...prev, amenity]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Listing Created",
        description: "Your boarding house has been submitted for review.",
      });
      navigate("/owner-dashboard/my-kos");
    }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <BackButton to="/owner-dashboard/my-kos" className="mb-0" />
        <h1 className="text-2xl font-display font-bold text-foreground">Add New Boarding House</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
          <h3 className="font-display font-bold text-lg border-b border-border pb-4">Basic Information</h3>
          
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
              <label className="text-sm font-semibold ml-1">Kos Name</label>
              <input 
                required
                type="text" 
                placeholder="e.g. Kos Harmoni Residence" 
                className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <label className="text-sm font-semibold ml-1">Full Address</label>
              <textarea 
                required
                rows={3}
                placeholder="e.g. Jl. Margonda Raya No. 123, Depok" 
                className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold ml-1">Price per Month</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">Rp</span>
                <input 
                  required
                  type="number" 
                  placeholder="1.500.000" 
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold ml-1">Kos Type</label>
              <select className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none">
                <option value="putra">Putra</option>
                <option value="putri">Putri</option>
                <option value="campur">Campur</option>
              </select>
            </div>
          </div>
        </div>

        {/* Details & Amenities */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
          <h3 className="font-display font-bold text-lg border-b border-border pb-4">Details & Amenities</h3>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold ml-1">Description</label>
            <textarea 
              required
              rows={4}
              placeholder="Describe your kos, environment, and rules..." 
              className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold ml-1">Amenities</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {amenitiesList.map(amenity => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all",
                    selectedAmenities.includes(amenity)
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-surface border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                    selectedAmenities.includes(amenity) ? "bg-primary border-primary" : "border-muted-foreground/30"
                  )}>
                    {selectedAmenities.includes(amenity) && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  {amenity}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Media */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
          <h3 className="font-display font-bold text-lg border-b border-border pb-4">Photos</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button type="button" className="aspect-square rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 group">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Add Photo</span>
            </button>
            <div className="aspect-square rounded-2xl bg-muted animate-pulse" />
            <div className="aspect-square rounded-2xl bg-muted animate-pulse" />
          </div>
          <p className="text-xs text-muted-foreground">Upload at least 3 high-quality photos of your property.</p>
        </div>

        <div className="flex gap-4">
          <Button 
            type="button" 
            variant="outline" 
            className="flex-1 py-6 rounded-xl border-border"
            onClick={() => navigate("/owner-dashboard/my-kos")}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="flex-[2] py-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20"
          >
            {isLoading ? "Submitting..." : "Submit Listing"}
          </Button>
        </div>
      </form>
    </div>
  );
}
