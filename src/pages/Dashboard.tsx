import { Link } from "react-router-dom";
import { Heart, Home, ShoppingBag, Settings, LogOut } from "lucide-react";
import { BackButton } from "@/components/BackButton";

const Dashboard = () => {
  return (
    <div className="container py-8">
      <BackButton to="/" />
      <h1 className="font-display font-bold text-2xl text-foreground mb-1">Dashboard</h1>
      <p className="text-sm text-muted-foreground mb-8">Kelola akun dan aktivitas kamu</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: Heart, title: "Favorit Kos", desc: "3 kos tersimpan", to: "/favorites", color: "text-primary" },
          { icon: Home, title: "Listing Saya", desc: "Kelola kos milikmu", to: "/owner", color: "text-primary" },
          { icon: ShoppingBag, title: "Barang Dijual", desc: "2 barang aktif", to: "/marketplace", color: "text-primary" },
          { icon: Settings, title: "Pengaturan", desc: "Edit profil", to: "#", color: "text-muted-foreground" },
        ].map((item) => (
          <Link
            key={item.title}
            to={item.to}
            className="flex items-start gap-4 p-6 rounded-2xl bg-surface ring-1 ring-foreground/5 hover:shadow-card-hover transition-shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
