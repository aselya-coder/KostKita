import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { BackButton } from "@/components/BackButton";
import { Plus, Edit, Trash2, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  getAllAdminCoinPackages,
  createAdminCoinPackage,
  updateAdminCoinPackage,
  deleteAdminCoinPackage,
  AdminCoinPackage,
} from "@/services/admin";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function CoinPackagesPage() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<AdminCoinPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPackage, setCurrentPackage] = useState<AdminCoinPackage | null>(null);
  const [form, setForm] = useState({
    name: "",
    coinAmount: 0,
    price: 0,
    isActive: true,
  });

  const fetchPackages = async () => {
    if (!user || user.role !== "admin") return;
    setIsLoading(true);
    try {
      const data = await getAllAdminCoinPackages(user.id, "ADMIN");
      setPackages(data);
    } catch (error: any) {
      toast.error(error.message || "Gagal mengambil paket koin.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, [user]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? parseFloat(value) : value,
    }));
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== "admin") return;

    try {
      if (currentPackage) {
        // Update existing package
        await updateAdminCoinPackage(user.id, "ADMIN", currentPackage.id, form);
        toast.success("Paket koin berhasil diperbarui.");
      } else {
        // Create new package
        await createAdminCoinPackage(user.id, "ADMIN", form);
        toast.success("Paket koin berhasil ditambahkan.");
      }
      setIsModalOpen(false);
      setCurrentPackage(null);
      setForm({ name: "", coinAmount: 0, price: 0, isActive: true });
      fetchPackages();
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan paket koin.");
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (!user || user.role !== "admin") return;
    if (confirm("Apakah Anda yakin ingin menghapus paket koin ini?")) {
      try {
        await deleteAdminCoinPackage(user.id, "ADMIN", id);
        toast.success("Paket koin berhasil dihapus.");
        fetchPackages();
      } catch (error: any) {
        toast.error(error.message || "Gagal menghapus paket koin.");
      }
    }
  };

  const openCreateModal = () => {
    setCurrentPackage(null);
    setForm({ name: "", coinAmount: 0, price: 0, isActive: true });
    setIsModalOpen(true);
  };

  const openEditModal = (pkg: AdminCoinPackage) => {
    setCurrentPackage(pkg);
    setForm({
      name: pkg.name,
      coinAmount: pkg.coinAmount,
      price: pkg.price,
      isActive: pkg.isActive,
    });
    setIsModalOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 pb-12 px-4 md:px-0">
      <BackButton to="/admin" className="mb-0" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">Manajemen Paket Koin</h1>
          <p className="text-muted-foreground text-xs md:text-sm">Kelola paket koin yang tersedia untuk top-up pengguna.</p>
        </div>
        <Button onClick={openCreateModal} className="rounded-xl w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" /> Tambah Paket
        </Button>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-10 md:p-20 flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Memuat data...</p>
          </div>
        ) : packages.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm text-left">
              <thead className="bg-secondary/50 text-muted-foreground uppercase text-[9px] md:text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-4 md:px-6 py-4">Nama Paket</th>
                  <th className="px-4 md:px-6 py-4">Koin</th>
                  <th className="px-4 md:px-6 py-4">Harga</th>
                  <th className="px-4 md:px-6 py-4">Aktif</th>
                  <th className="px-4 md:px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y border-border">
                {packages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 md:px-6 py-4 font-medium text-foreground">{pkg.name}</td>
                    <td className="px-4 md:px-6 py-4">{pkg.coinAmount}</td>
                    <td className="px-4 md:px-6 py-4 font-bold text-primary whitespace-nowrap">{formatCurrency(pkg.price)}</td>
                    <td className="px-4 md:px-6 py-4">
                      {pkg.isActive ? (
                        <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
                      ) : (
                        <XCircle className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
                      )}
                    </td>
                    <td className="px-4 md:px-6 py-4 text-right whitespace-nowrap">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditModal(pkg)}>
                        <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeletePackage(pkg.id)}>
                        <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-20 text-center space-y-4">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto">
              <Plus className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Belum ada paket koin</h3>
              <p className="text-sm text-muted-foreground">Tambahkan paket koin pertama Anda untuk memulai.</p>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{currentPackage ? "Edit Paket Koin" : "Tambah Paket Koin Baru"}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {currentPackage ? "Perbarui informasi paket koin yang sudah ada." : "Buat paket koin baru untuk sistem top-up."}
            </p>
          </DialogHeader>
          <form onSubmit={handleSavePackage} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nama
              </Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                className="col-span-3 rounded-xl"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="coinAmount" className="text-right">
                Jumlah Koin
              </Label>
              <Input
                id="coinAmount"
                name="coinAmount"
                type="number"
                value={form.coinAmount}
                onChange={handleFormChange}
                className="col-span-3 rounded-xl"
                min={1}
                max={1000}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Harga (IDR)
              </Label>
              <Input
                id="price"
                name="price"
                type="number"
                value={form.price}
                onChange={handleFormChange}
                className="col-span-3 rounded-xl"
                min={0}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">
                Aktif
              </Label>
              <Switch
                id="isActive"
                name="isActive"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isActive: checked }))}
                className="col-span-3"
              />
            </div>
            <DialogFooter>
              <Button type="submit" className="rounded-xl" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {currentPackage ? "Simpan Perubahan" : "Tambah Paket"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
