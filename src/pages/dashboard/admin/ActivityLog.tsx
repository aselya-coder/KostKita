import { useState, useEffect } from 'react';
import { getUserActivities, deleteActivity } from '@/services/marketplace';
import { Loader2, ShieldAlert, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// Define the type for an activity, including the nested profile
interface Activity {
  id: string;
  created_at: string;
  action: string;
  description: string | null;
  target_url: string | null;
  profiles: {
    name: string | null;
    avatar: string | null;
  } | null;
}

export default function ActivityLogPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    try {
      const data = await getUserActivities();
      // Type guard to ensure data is what we expect
      if (Array.isArray(data)) {
        setActivities(data as Activity[]);
      } else {
        throw new Error("Format data tidak valid");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat aktivitas.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleDelete = async (activityId: string) => {
    if (!confirm("Hapus log aktivitas ini?")) return;
    
    try {
      await deleteActivity(activityId);
      toast.success("Aktivitas berhasil dihapus");
      setActivities(prev => prev.filter(a => a.id !== activityId));
    } catch (err) {
      toast.error("Gagal menghapus aktivitas");
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Memuat log aktivitas...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4 bg-destructive/10 border border-destructive rounded-2xl">
          <ShieldAlert className="w-10 h-10 text-destructive" />
          <p className="font-bold text-destructive">Terjadi Kesalahan</p>
          <p className="text-sm text-center text-destructive/80">{error}</p>
        </div>
      );
    }

    if (activities.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Belum ada aktivitas yang tercatat.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-2xl bg-card hover:bg-muted/50 transition-colors group relative">
            <Avatar className="w-10 h-10 border">
              <AvatarImage src={activity.profiles?.avatar || undefined} alt={activity.profiles?.name || 'User'} />
              <AvatarFallback>{activity.profiles?.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <p className="font-medium pr-8">
                <span className="font-bold text-primary">{activity.profiles?.name || 'Pengguna'}</span>
                {' '}{activity.action.toLowerCase()}
                {activity.description && (
                  <span className="text-muted-foreground italic">
                    : "{activity.description}"
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: id })}
                {activity.target_url && (
                  <>
                    {' · '}
                    <Link to={activity.target_url} className="text-primary hover:underline font-semibold">
                      Lihat Detail
                    </Link>
                  </>
                )}
              </p>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive h-8 w-8"
              onClick={() => handleDelete(activity.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-display font-bold text-foreground">Log Aktivitas Pengguna</h1>
        <p className="text-muted-foreground">Melihat semua aktivitas yang terjadi di platform.</p>
      </div>
      {renderContent()}
    </div>
  );
}