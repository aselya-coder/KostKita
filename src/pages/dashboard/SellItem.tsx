import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowRight, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

export default function SellItem() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const categories = ["Buku", "Elektronik", "Furnitur", "Kendaraan", "Lainnya"];
  const conditions = ["Baru", "Bekas - Sangat Baik", "Bekas - Baik", "Bekas - Cukup"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Item Listed",
        description: "Your item is now live in the marketplace.",
      });
      const basePath = user?.role === "owner" ? "/owner-dashboard" : "/dashboard";
      navigate(`${basePath}/my-items`);
    }, 1500);
  };

  const basePath = user?.role === "owner" ? "/owner-dashboard" : "/dashboard";

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <BackButton to={`${basePath}/my-items`} className="mb-0" />
        <h1 className="text-2xl font-display font-bold text-foreground">Sell New Item</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold ml-1">Item Title</label>
            <input 
              required
              type="text" 
              placeholder="e.g. MacBook Pro M1 2020" 
              className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold ml-1">Price</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">Rp</span>
                <input 
                  required
                  type="number" 
                  placeholder="0" 
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold ml-1">Category</label>
              <select className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none">
                {categories.map(cat => <option key={cat} value={cat.toLowerCase()}>{cat}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold ml-1">Condition</label>
              <select className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none">
                {conditions.map(cond => <option key={cond} value={cond.toLowerCase()}>{cond}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold ml-1">Location</label>
              <input 
                required
                type="text" 
                placeholder="e.g. Depok, Sleman" 
                className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold ml-1">Description</label>
            <textarea 
              required
              rows={4}
              placeholder="Describe the item condition, usage duration, and other details..." 
              className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
          <h3 className="font-display font-bold text-lg border-b border-border pb-4">Media</h3>
          <div className="flex items-center justify-center border-2 border-dashed border-border rounded-2xl p-12 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/10 transition-colors">
                <Camera className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
              </div>
              <p className="text-sm font-semibold">Upload Photo</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button 
            type="button" 
            variant="outline" 
            className="flex-1 py-6 rounded-xl border-border"
            onClick={() => navigate(`${basePath}/my-items`)}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="flex-[2] py-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 group"
          >
            {isLoading ? "Listing Item..." : "List Item for Sale"}
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </form>
    </div>
  );
}
