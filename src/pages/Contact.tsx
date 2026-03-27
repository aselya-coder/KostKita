import { BackButton } from "@/components/BackButton";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";

export default function Contact() {
  return (
    <div className="container py-12 max-w-4xl">
      <BackButton to="/" />
      <h1 className="text-3xl font-display font-bold text-foreground mb-8 text-center">Hubungi Kami</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-card p-8 rounded-2xl border border-border shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">Email</h3>
          <p className="text-muted-foreground text-sm mb-4">Tim dukungan kami siap membantu Anda.</p>
          <a href="mailto:support@koskita.com" className="text-primary font-medium hover:underline">support@koskita.com</a>
        </div>
        
        <div className="bg-card p-8 rounded-2xl border border-border shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <MessageCircle className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">WhatsApp</h3>
          <p className="text-muted-foreground text-sm mb-4">Chat langsung untuk bantuan cepat.</p>
          <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-medium hover:underline">6281234567890</a>
        </div>
      </div>

      <div className="mt-12 bg-card p-8 rounded-2xl border border-border shadow-sm">
        <h3 className="font-semibold text-foreground mb-6 text-center">Lokasi Kantor Kami</h3>
        <div className="flex flex-col items-center gap-4 text-center">
          <MapPin className="w-6 h-6 text-muted-foreground" />
          <p className="text-muted-foreground text-sm max-w-md">
            Jl. Margonda Raya No. 123, Beji, Depok, Jawa Barat 16424
          </p>
        </div>
      </div>
    </div>
  );
}
