import { BackButton } from "@/components/BackButton";

export default function FAQ() {
  const faqs = [
    {
      q: "Bagaimana cara mencari kos di KosKita?",
      a: "Anda dapat menggunakan fitur pencarian di halaman utama atau klik menu 'Cari Kos' di navigasi atas."
    },
    {
      q: "Bagaimana cara menjual barang di marketplace?",
      a: "Anda perlu masuk ke akun Anda, lalu buka Dashboard dan pilih menu 'Jual Barang'."
    },
    {
      q: "Apakah layanan KosKita gratis?",
      a: "Ya, mencari kos dan memasang iklan barang bekas di marketplace saat ini tersedia secara gratis."
    }
  ];

  return (
    <div className="container py-12 max-w-3xl">
      <BackButton to="/" />
      <h1 className="text-3xl font-display font-bold text-foreground mb-8">Pertanyaan Umum (FAQ)</h1>
      <div className="space-y-6">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-card p-6 rounded-2xl border border-border shadow-sm">
            <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
